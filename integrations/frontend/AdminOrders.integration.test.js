// Kaw Jun Rei Dylan, A0252791Y
// Integration: AdminOrders.js + getAllOrdersController + orderStatusController + orderModel.js

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";
import toast from "react-hot-toast";

import AdminOrders from "@client/pages/admin/AdminOrders.js";
import {
  getAllOrdersController,
  orderStatusController,
} from "@server/controllers/authController.js";
import orderModel from "@server/models/orderModel.js";
import userModel from "@server/models/userModel.js";
import productModel from "@server/models/productModel.js";
import categoryModel from "@server/models/categoryModel.js";

const MongoMemoryServer = global.MongoMemoryServer;

jest.mock("axios");
jest.mock("react-hot-toast");

let mockAuthState = {
  token: "admin-token",
  user: { _id: "admin-1", name: "Admin" },
};

jest.mock("@client/context/auth", () => ({
  useAuth: () => [mockAuthState, jest.fn()],
}));

jest.mock("@client/components/Layout", () => ({ children }) => (
  <div data-testid="layout-mock">{children}</div>
));

jest.mock("@client/components/AdminMenu", () => () => (
  <div data-testid="admin-menu-mock">AdminMenu</div>
));

jest.mock("antd", () => {
  const Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );

  const Select = ({ onChange, defaultValue, children }) => (
    <select
      data-testid="status-select"
      defaultValue={defaultValue}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );

  Select.Option = Option;
  return { Select };
});

jest.mock("moment", () => {
  return () => ({ fromNow: () => "a few seconds ago" });
});

const callController = async (controller, req) => {
  let statusCode = 200;
  let responseBody;

  const res = {
    status: jest.fn().mockImplementation((code) => {
      statusCode = code;
      return res;
    }),
    send: jest.fn().mockImplementation((body) => {
      responseBody = body;
      return res;
    }),
    json: jest.fn().mockImplementation((body) => {
      responseBody = body;
      return res;
    }),
  };

  await controller(req, res);
  return { status: statusCode, body: responseBody };
};

const axiosResult = ({ status, body }) => {
  if (status >= 200 && status < 300) {
    return Promise.resolve({ data: body, status });
  }
  return Promise.reject({ response: { data: body, status } });
};

let mongoServer;
let seededOrder;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});
  mockAuthState = {
    token: "admin-token",
    user: { _id: "admin-1", name: "Admin" },
  };

  await orderModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  await userModel.deleteMany({});

  const buyer = await userModel.create({
    name: "John Doe",
    email: "john@test.com",
    password: "hashed-password",
    phone: "12345678",
    address: "123 Main Street",
    answer: "blue",
    role: 0,
  });

  const category = await categoryModel.create({
    name: "Electronics",
    slug: "electronics",
  });

  const product = await productModel.create({
    name: "Test Product",
    slug: "test-product",
    description: "A short description",
    price: 99.99,
    category: category._id,
    quantity: 5,
    shipping: true,
  });

  seededOrder = await orderModel.create({
    products: [product._id],
    payment: { success: true },
    buyer: buyer._id,
    status: "Not Processed",
  });

  axios.get.mockImplementation(async (url) => {
    if (url === "/api/v1/auth/all-orders") {
      return axiosResult(await callController(getAllOrdersController, {}));
    }
    return Promise.reject(new Error(`Unhandled GET: ${url}`));
  });

  axios.put.mockImplementation(async (url, data) => {
    if (url.startsWith("/api/v1/auth/order-status/")) {
      const orderId = url.split("/").pop();
      return axiosResult(
        await callController(orderStatusController, {
          params: { orderId },
          body: data,
        })
      );
    }
    return Promise.reject(new Error(`Unhandled PUT: ${url}`));
  });
});

afterEach(() => {
  console.log.mockRestore();
});

const renderAdminOrders = async () => {
  render(
    <MemoryRouter>
      <AdminOrders />
    </MemoryRouter>
  );

  if (mockAuthState.token) {
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders");
    });
  }
};

describe("AdminOrders integration", () => {
  it("fetches and renders orders from real getAllOrdersController + orderModel", async () => {
    // Arrange + Act
    await renderAdminOrders();

    // Assert
    expect(screen.getByTestId("layout-mock")).toBeInTheDocument();
    expect(screen.getByTestId("admin-menu-mock")).toBeInTheDocument();
    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Test Product")).toBeInTheDocument();
    expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
    expect(screen.getByText("a few seconds ago")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("does not fetch orders when auth token is missing", async () => {
    // Arrange + Act
    mockAuthState = { token: "", user: null };

    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("updates status through real orderStatusController and persists to DB", async () => {
    // Arrange
    await renderAdminOrders();
    await screen.findByText("John Doe");

    // Act
    fireEvent.change(screen.getByTestId("status-select"), {
      target: { value: "Shipped" },
    });

    // Assert
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `/api/v1/auth/order-status/${seededOrder._id.toString()}`,
        { status: "Shipped" }
      );
    });

    const updated = await orderModel.findById(seededOrder._id);
    expect(updated.status).toBe("Shipped");

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it("shows error toast when fetching all orders fails", async () => {
    // Arrange
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    // Act
    render(
      <MemoryRouter>
        <AdminOrders />
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Something went wrong in getting orders"
      );
    });
  });
});
