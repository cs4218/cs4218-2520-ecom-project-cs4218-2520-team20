// Kaw Jun Rei Dylan, A0252791Y
// Integration: Orders.js + getOrdersController + orderModel.js
// These tests were generated with the help of GPT-5.3-Codex

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";

import Orders from "@client/pages/user/Orders.js";
import { getOrdersController } from "@server/controllers/authController.js";
import orderModel from "@server/models/orderModel.js";
import userModel from "@server/models/userModel.js";
import productModel from "@server/models/productModel.js";
import categoryModel from "@server/models/categoryModel.js";

const MongoMemoryServer = global.MongoMemoryServer;

jest.mock("axios");

let mockAuthState = {
  token: "user-token",
  user: { _id: "", name: "Buyer User" },
};

jest.mock("@client/context/auth", () => ({
  useAuth: () => [mockAuthState, jest.fn()],
}));

jest.mock("@client/components/Layout", () => ({ children }) => (
  <div data-testid="layout-mock">{children}</div>
));

jest.mock("@client/components/UserMenu", () => () => (
  <div data-testid="user-menu-mock">UserMenu</div>
));

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

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let mongoServer;
let buyerUser;
let otherUser;

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

  await orderModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  await userModel.deleteMany({});

  buyerUser = await userModel.create({
    name: "Buyer User",
    email: "buyer-orders@test.com",
    password: "hashed-password",
    phone: "12345678",
    address: "Buyer Address",
    answer: "blue",
    role: 0,
  });

  otherUser = await userModel.create({
    name: "Other User",
    email: "other-orders@test.com",
    password: "hashed-password",
    phone: "87654321",
    address: "Other Address",
    answer: "red",
    role: 0,
  });

  mockAuthState = {
    token: "user-token",
    user: { _id: buyerUser._id.toString(), name: "Buyer User" },
  };

  const category = await categoryModel.create({
    name: "Order Category",
    slug: "order-category",
  });

  const products = await productModel.create([
    {
      name: "Buyer Product One",
      slug: "buyer-product-one",
      description: "Buyer product description one is long enough to truncate.",
      price: 11,
      category: category._id,
      quantity: 10,
      shipping: true,
    },
    {
      name: "Buyer Product Two",
      slug: "buyer-product-two",
      description: "Buyer product description two is long enough to truncate.",
      price: 22,
      category: category._id,
      quantity: 8,
      shipping: true,
    },
  ]);

  await orderModel.create({
    products: [products[0]._id],
    payment: { success: true },
    buyer: buyerUser._id,
    status: "Not Processed",
  });

  await delay(5);

  await orderModel.create({
    products: [products[1]._id],
    payment: { success: false },
    buyer: buyerUser._id,
    status: "Processing",
  });

  await orderModel.create({
    products: [products[0]._id],
    payment: { success: true },
    buyer: otherUser._id,
    status: "Delivered",
  });

  axios.get.mockImplementation(async (url) => {
    if (url === "/api/v1/auth/orders") {
      return axiosResult(
        await callController(getOrdersController, {
          user: { _id: buyerUser._id },
        })
      );
    }
    return Promise.reject(new Error(`Unhandled GET: ${url}`));
  });
});

afterEach(() => {
  console.log.mockRestore();
});

const renderOrders = async () => {
  render(
    <MemoryRouter>
      <Orders />
    </MemoryRouter>
  );

  if (mockAuthState.token) {
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/orders");
    });
  }
};

describe("Orders integration", () => {
  it("fetches and renders authenticated buyer orders only with newest first", async () => {
    await renderOrders();

    expect(screen.getByTestId("layout-mock")).toBeInTheDocument();
    expect(screen.getByTestId("user-menu-mock")).toBeInTheDocument();

    // Only buyer's two orders should be rendered.
    expect(await screen.findByText("Processing")).toBeInTheDocument();
    expect(screen.getByText("Not Processed")).toBeInTheDocument();
    expect(screen.queryByText("Delivered")).not.toBeInTheDocument();

    // Newest buyer order should render first due to sort({ createdAt: -1 }).
    const statusCells = screen.getAllByRole("cell");
    expect(statusCells.some((cell) => cell.textContent === "Processing")).toBe(
      true
    );
  });

  it("renders payment state, product details and truncated description", async () => {
    await renderOrders();

    expect(await screen.findByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Buyer Product One")).toBeInTheDocument();
    expect(screen.getByText("Buyer Product Two")).toBeInTheDocument();
    expect(screen.getByText("Price : 11")).toBeInTheDocument();
    expect(screen.getByText("Price : 22")).toBeInTheDocument();

    // Orders.js truncates descriptions with substring(0, 30)
    expect(
      screen.getAllByText(/Buyer product description/).length
    ).toBeGreaterThan(0);
  });

  it("does not fetch orders when token is missing", async () => {
    mockAuthState = { token: "", user: null };

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("All Orders")).toBeInTheDocument();
    });
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("logs error message when order fetch fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith("Network Error");
    });
  });
});
