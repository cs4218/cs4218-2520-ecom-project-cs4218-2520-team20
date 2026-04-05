// Kaw Jun Rei Dylan, A0252791Y
// Integration: CartPage + cart context + braintree controllers + order model pipeline
// These tests were generated with the help of GPT-5.3-Codex

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";

import CartPage from "@client/pages/CartPage.js";
import { CartProvider } from "@client/context/cart.js";
import {
  braintreeTokenController,
  brainTreePaymentController,
} from "@server/controllers/productController.js";
import {
  getOrdersController,
  orderStatusController,
} from "@server/controllers/authController.js";
import orderModel from "@server/models/orderModel.js";
import userModel from "@server/models/userModel.js";
import productModel from "@server/models/productModel.js";
import categoryModel from "@server/models/categoryModel.js";

const MongoMemoryServer = global.MongoMemoryServer;

jest.mock("axios");

jest.mock("dotenv", () => ({ config: jest.fn() }));

jest.mock("braintree", () => {
  const mockGenerate = jest.fn((_opts, cb) =>
    cb(null, { clientToken: "integration-client-token" })
  );
  const mockSale = jest.fn((_opts, cb) =>
    cb(null, { success: true, transaction: { id: "txn-integration-1" } })
  );

  const _gateway = {
    clientToken: { generate: mockGenerate },
    transaction: { sale: mockSale },
  };

  return {
    BraintreeGateway: jest.fn(() => _gateway),
    Environment: { Sandbox: "sandbox" },
    _gateway,
  };
});

const mockNavigate = jest.fn();
let mockAuthState = {
  token: "checkout-token",
  user: {
    _id: "",
    name: "Checkout User",
    address: "123 Checkout Street",
  },
};

jest.mock("@client/context/auth", () => ({
  useAuth: () => [mockAuthState, jest.fn()],
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@client/components/Layout", () => ({ children }) => (
  <div data-testid="layout-mock">{children}</div>
));

const mockPaymentInstance = {
  requestPaymentMethod: jest.fn().mockResolvedValue({
    nonce: "integration-nonce-123",
  }),
};

jest.mock("braintree-web-drop-in-react", () => {
  return {
    __esModule: true,
    default: ({ onInstance }) => {
      setTimeout(() => onInstance(mockPaymentInstance), 0);
      return <div data-testid="dropin-mock" />;
    },
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

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

const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

let mongoServer;
let checkoutUser;
let checkoutProducts;

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
  localStorage.clear();

  await orderModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  await userModel.deleteMany({});

  checkoutUser = await userModel.create({
    name: "Checkout User",
    email: "checkout-user@test.com",
    password: "hashed-password",
    phone: "88888888",
    address: "123 Checkout Street",
    answer: "green",
    role: 0,
  });

  mockAuthState = {
    token: "checkout-token",
    user: {
      _id: checkoutUser._id.toString(),
      name: "Checkout User",
      address: "123 Checkout Street",
    },
  };

  const category = await categoryModel.create({
    name: "Checkout Category",
    slug: "checkout-category",
  });

  checkoutProducts = await productModel.create([
    {
      name: "Checkout Product A",
      slug: "checkout-product-a",
      description: "Checkout product A description",
      price: 20,
      category: category._id,
      quantity: 5,
      shipping: true,
    },
    {
      name: "Checkout Product B",
      slug: "checkout-product-b",
      description: "Checkout product B description",
      price: 30,
      category: category._id,
      quantity: 4,
      shipping: true,
    },
  ]);

  // CartPage expects full item objects in localStorage cart.
  localStorage.setItem(
    "cart",
    JSON.stringify(
      checkoutProducts.map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
      }))
    )
  );

  axios.get.mockImplementation(async (url) => {
    if (url === "/api/v1/product/braintree/token") {
      return axiosResult(await callController(braintreeTokenController, {}));
    }
    if (url === "/api/v1/auth/orders") {
      return axiosResult(
        await callController(getOrdersController, {
          user: { _id: checkoutUser._id },
        })
      );
    }
    return Promise.reject(new Error(`Unhandled GET: ${url}`));
  });

  axios.post.mockImplementation(async (url, data) => {
    if (url === "/api/v1/product/braintree/payment") {
      return axiosResult(
        await callController(brainTreePaymentController, {
          body: data,
          user: { _id: checkoutUser._id },
        })
      );
    }
    return Promise.reject(new Error(`Unhandled POST: ${url}`));
  });
});

afterEach(() => {
  console.log.mockRestore();
  localStorage.clear();
});

describe("Checkout pipeline integration", () => {
  it("creates an order in real model through CartPage -> payment controllers and supports retrieval + status update", async () => {
    // Act: render checkout page with real cart context
    render(
      <MemoryRouter>
        <CartProvider>
          <CartPage />
        </CartProvider>
      </MemoryRouter>
    );

    // Wait for token fetch + payment controls ready
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    const payButton = await screen.findByRole("button", {
      name: /make payment/i,
    });

    await waitFor(() => {
      expect(payButton).toBeEnabled();
    });

    // Trigger full payment flow
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(mockPaymentInstance.requestPaymentMethod).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/braintree/payment",
        expect.objectContaining({
          nonce: "integration-nonce-123",
          cart: expect.any(Array),
        })
      );
    });

    // Assert order persisted in real orderModel
    await waitFor(async () => {
      const createdOrders = await orderModel.find({ buyer: checkoutUser._id });
      expect(createdOrders).toHaveLength(1);
      expect(createdOrders[0].status).toBe("Not Processed");
      expect(createdOrders[0].products).toHaveLength(2);
    });

    // Assert getOrdersController can retrieve the created order
    const getOrdersReq = { user: { _id: checkoutUser._id } };
    const getOrdersRes = makeRes();
    await getOrdersController(getOrdersReq, getOrdersRes);

    expect(getOrdersRes.status).not.toHaveBeenCalled();
    expect(getOrdersRes.json).toHaveBeenCalledTimes(1);
    const retrieved = getOrdersRes.json.mock.calls[0][0];
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].buyer.name).toBe("Checkout User");

    // Assert orderStatusController updates created order
    const orderId = retrieved[0]._id.toString();
    const updateReq = {
      params: { orderId },
      body: { status: "Shipped" },
    };
    const updateRes = makeRes();

    await orderStatusController(updateReq, updateRes);

    expect(updateRes.status).not.toHaveBeenCalled();
    expect(updateRes.json).toHaveBeenCalledTimes(1);
    expect(updateRes.json.mock.calls[0][0].status).toBe("Shipped");

    const updatedOrder = await orderModel.findById(orderId);
    expect(updatedOrder.status).toBe("Shipped");

    // UI post-payment behavior
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
    expect(localStorage.getItem("cart")).toBeNull();
  });
});
