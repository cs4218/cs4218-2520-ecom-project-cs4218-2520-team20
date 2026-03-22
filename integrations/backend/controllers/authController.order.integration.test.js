// A0252791Y, Kaw Jun Rei Dylan
// Integration: authController order endpoints <-> orderModel.js
// These tests were generated with the help of GPT-5.3-Codex

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import {
  getOrdersController,
  getAllOrdersController,
  orderStatusController,
} from "../../../controllers/authController.js";
import orderModel from "../../../models/orderModel.js";
import userModel from "../../../models/userModel.js";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";

let mongoServer;
let buyerUser;
let otherUser;
let seededCategory;
let seededProducts;

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  jest.spyOn(console, "log").mockImplementation(() => {});

  await orderModel.deleteMany({});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  await userModel.deleteMany({});

  buyerUser = await userModel.create({
    name: "Buyer User",
    email: "buyer@test.com",
    password: "hashed-password",
    phone: "12345678",
    address: "Buyer Address",
    answer: "blue",
    role: 0,
  });

  otherUser = await userModel.create({
    name: "Other User",
    email: "other@test.com",
    password: "hashed-password",
    phone: "87654321",
    address: "Other Address",
    answer: "red",
    role: 0,
  });

  seededCategory = await categoryModel.create({
    name: "Seed Category",
    slug: "seed-category",
  });

  seededProducts = await productModel.create([
    {
      name: "Seed Product One",
      slug: "seed-product-one",
      description: "Product one",
      price: 25,
      category: seededCategory._id,
      quantity: 10,
      shipping: true,
    },
    {
      name: "Seed Product Two",
      slug: "seed-product-two",
      description: "Product two",
      price: 30,
      category: seededCategory._id,
      quantity: 5,
      shipping: true,
    },
  ]);
});

afterEach(() => {
  console.log.mockRestore();
});

describe("getOrdersController", () => {
  it("returns only the requesting buyer orders sorted by newest first", async () => {
    // Arrange
    await orderModel.create({
      products: [seededProducts[0]._id],
      payment: { success: true },
      buyer: buyerUser._id,
      status: "Not Processed",
    });

    await delay(5);

    const latestBuyerOrder = await orderModel.create({
      products: [seededProducts[1]._id],
      payment: { success: true },
      buyer: buyerUser._id,
      status: "Processing",
    });

    await orderModel.create({
      products: [seededProducts[0]._id],
      payment: { success: true },
      buyer: otherUser._id,
      status: "Delivered",
    });

    const req = { user: { _id: buyerUser._id } };
    const res = mockRes();

    // Act
    await getOrdersController(req, res);

    // Assert
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);

    const body = res.json.mock.calls[0][0];
    expect(body).toHaveLength(2);
    expect(body[0]._id.toString()).toBe(latestBuyerOrder._id.toString());
    expect(
      body.every(
        (order) => order.buyer._id.toString() === buyerUser._id.toString()
      )
    ).toBe(true);
  });

  it("returns populated buyer and product fields", async () => {
    // Arrange
    await orderModel.create({
      products: [seededProducts[0]._id],
      payment: { success: true },
      buyer: buyerUser._id,
      status: "Not Processed",
    });

    const req = { user: { _id: buyerUser._id } };
    const res = mockRes();

    // Act
    await getOrdersController(req, res);

    // Assert
    const body = res.json.mock.calls[0][0];
    expect(body[0].buyer).toHaveProperty("name", "Buyer User");
    expect(body[0].products[0]).toHaveProperty("name", "Seed Product One");
    expect(body[0].products[0].photo?.data).toBeUndefined();
    expect(body[0].products[0].photo?.contentType).toBeUndefined();
  });

  it("returns 500 when response writing fails", async () => {
    // Arrange
    await orderModel.create({
      products: [seededProducts[0]._id],
      payment: { success: true },
      buyer: buyerUser._id,
      status: "Not Processed",
    });

    const req = { user: { _id: buyerUser._id } };
    const res = mockRes();
    const err = new Error("json write failure");
    res.json.mockImplementationOnce(() => {
      throw err;
    });

    // Act
    await getOrdersController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting orders.",
        error: err,
      })
    );
  });
});

describe("getAllOrdersController", () => {
  it("returns all orders with populated buyer and product fields", async () => {
    // Arrange
    await orderModel.create([
      {
        products: [seededProducts[0]._id],
        payment: { success: true },
        buyer: buyerUser._id,
        status: "Not Processed",
      },
      {
        products: [seededProducts[1]._id],
        payment: { success: true },
        buyer: otherUser._id,
        status: "Delivered",
      },
    ]);

    const req = {};
    const res = mockRes();

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);

    const body = res.json.mock.calls[0][0];
    expect(body).toHaveLength(2);
    const buyerNames = body.map((order) => order.buyer.name);
    expect(buyerNames).toContain("Buyer User");
    expect(buyerNames).toContain("Other User");
  });

  it("returns 500 when response writing fails", async () => {
    // Arrange
    await orderModel.create({
      products: [seededProducts[0]._id],
      payment: { success: true },
      buyer: buyerUser._id,
      status: "Not Processed",
    });

    const req = {};
    const res = mockRes();
    const err = new Error("json write failure");
    res.json.mockImplementationOnce(() => {
      throw err;
    });

    // Act
    await getAllOrdersController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting orders.",
        error: err,
      })
    );
  });
});

describe("orderStatusController", () => {
  it("updates status and persists it to the DB", async () => {
    // Arrange
    const existing = await orderModel.create({
      products: [seededProducts[0]._id],
      payment: { success: true },
      buyer: buyerUser._id,
      status: "Not Processed",
    });

    const req = {
      params: { orderId: existing._id.toString() },
      body: { status: "Shipped" },
    };
    const res = mockRes();

    // Act
    await orderStatusController(req, res);

    // Assert
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);

    const body = res.json.mock.calls[0][0];
    expect(body.status).toBe("Shipped");

    const updated = await orderModel.findById(existing._id);
    expect(updated.status).toBe("Shipped");
  });

  it("returns 500 when orderId has invalid format", async () => {
    // Arrange
    const req = {
      params: { orderId: "not-a-valid-objectid" },
      body: { status: "Shipped" },
    };
    const res = mockRes();

    // Act
    await orderStatusController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while updating orders.",
      })
    );
  });
});
