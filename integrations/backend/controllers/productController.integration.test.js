// Seah Minlong, A0271643E
// Integration: productController.js (create, delete) <-> productModel.js

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import os from "os";
import productModel from "@server/models/productModel.js";
import categoryModel from "@server/models/categoryModel.js";
import {
  createProductController,
  deleteProductController,
} from "@server/controllers/productController.js";

let mongoServer;
let testCategory;
let photoPath;

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  
  // The following code was adapted from Claude Opus 4.
  // Prompt: "Write code that creates a small temporary JPEG file and tracks its path for cleanup, 
  // to be used in tests that require file uploads."
  photoPath = path.join(os.tmpdir(), "integration_test_photo.jpg");
  const minJpeg = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ]);
  fs.writeFileSync(photoPath, minJpeg);
});

afterAll(async () => {
  if (photoPath && fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  testCategory = await categoryModel.create({
    name: "Electronics",
    slug: "electronics",
  });
});

afterEach(() => {
  console.log.mockRestore();
});

function validProductReq(overrides = {}) {
  return {
    fields: {
      name: "Test Widget",
      description: "A test product",
      price: 49,
      category: testCategory._id.toString(),
      quantity: 10,
      shipping: true,
      ...overrides,
    },
    files: {
      photo: { path: photoPath, type: "image/jpeg", size: 100 },
    },
  };
}

describe("createProductController", () => {
  it("returns 201 with the created product in the response", async () => {
    // Arrange
    const req = validProductReq();
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("Product Created Successfully");
    expect(body.products.name).toBe("Test Widget");
    expect(body.products.slug).toBe("Test-Widget");
  });

  it("persists the product document in the DB", async () => {
    // Arrange
    const req = validProductReq();
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    const saved = await productModel.findOne({ name: "Test Widget" });
    expect(saved).not.toBeNull();
    expect(saved.description).toBe("A test product");
    expect(saved.price).toBe(49);
  });

  it.each([
    ["name", "Name is Required"],
    ["description", "Description is Required"],
    ["price", "Price is Required"],
    ["category", "Category is Required"],
    ["quantity", "Quantity is Required"],
  ])("returns 400 when %s is missing", async (field, expectedError) => {
    // Arrange
    const req = validProductReq({ [field]: "" });
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.send.mock.calls[0][0];
    expect(body.error).toBe(expectedError);
  });

  it("returns 400 when photo is missing", async () => {
    // Arrange
    const req = validProductReq();
    req.files = {};
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.send.mock.calls[0][0];
    expect(body.error).toBe("photo is Required");
  });

  it("does not persist a product when a required field is missing", async () => {
    // Arrange
    const req = validProductReq({ name: "" });
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    const count = await productModel.countDocuments({});
    expect(count).toBe(0);
  });
});

describe("deleteProductController", () => {
  it("returns 200 with success response", async () => {
    // Arrange
    const product = await productModel.create({
      name: "To Delete",
      slug: "to-delete",
      description: "Will be removed",
      price: 10,
      category: testCategory._id,
      quantity: 1,
    });
    const req = { params: { pid: product._id.toString() } };
    const res = mockRes();

    // Act
    await deleteProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("Product Deleted successfully");
  });

  it("removes the product document from the DB", async () => {
    // Arrange
    const product = await productModel.create({
      name: "To Delete",
      slug: "to-delete",
      description: "Will be removed",
      price: 10,
      category: testCategory._id,
      quantity: 1,
    });
    const req = { params: { pid: product._id.toString() } };
    const res = mockRes();

    // Act
    await deleteProductController(req, res);

    // Assert
    const gone = await productModel.findById(product._id);
    expect(gone).toBeNull();
  });

  it("returns 500 when given an invalid ID format", async () => {
    // Arrange
    const req = { params: { pid: "not-a-valid-id" } };
    const res = mockRes();

    // Act
    await deleteProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(false);
  });
});
