// Alexander Setyawan, A0257149W
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { getSingleProductController } from "../../../controllers/productController.js";

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

const createReq = () => ({
  params: {},
});

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
});

describe("getSingleProductController (Integration)", () => {
  let req;
  let res;
  let category;

  beforeEach(async () => {
    req = createReq();
    res = createRes();

    category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
  });

  // ✅ 1. Fetch product by slug
  test("returns product when slug matches", async () => {
    await productModel.create({
      name: "iPhone",
      slug: "iphone",
      description: "Apple phone",
      price: 1000,
      category: category._id,
      quantity: 5,
    });

    req.params.slug = "iphone";

    await getSingleProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.product.name).toBe("iPhone");
  });

  // ✅ 2. Returns correct status
  test("returns status 200 on success", async () => {
    await productModel.create({
      name: "MacBook",
      slug: "macbook",
      description: "Laptop",
      price: 2000,
      category: category._id,
      quantity: 3,
    });

    req.params.slug = "macbook";

    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ✅ 3. Populates category
  test("populates category field", async () => {
    await productModel.create({
      name: "iPad",
      slug: "ipad",
      description: "Tablet",
      price: 800,
      category: category._id,
      quantity: 4,
    });

    req.params.slug = "ipad";

    await getSingleProductController(req, res);

    const product = res.send.mock.calls[0][0].product;

    expect(product.category.name).toBe("Electronics");
  });

  // ✅ 4. Returns null if product not found
  test("returns null when product does not exist", async () => {
    req.params.slug = "non-existent";

    await getSingleProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.product).toBeNull();
  });

  // ✅ 5. Slug must match exactly
  test("does not return product for different slug", async () => {
    await productModel.create({
      name: "iPhone",
      slug: "iphone",
      description: "Phone",
      price: 1000,
      category: category._id,
      quantity: 5,
    });

    req.params.slug = "iphone-15";

    await getSingleProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.product).toBeNull();
  });

  // ✅ 6. Handles missing slug
  test("handles missing slug parameter", async () => {
    await getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalled();
  });

  // ✅ 7. Works with special characters in slug
  test("handles slug with special characters", async () => {
    await productModel.create({
      name: "C++ Book",
      slug: "c++-book",
      description: "Programming",
      price: 50,
      category: category._id,
      quantity: 2,
    });

    req.params.slug = "c++-book";

    await getSingleProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.product.name).toBe("C++ Book");
  });

  // ✅ 8. Handles multiple products but returns only one
  test("returns only one product even if multiple exist", async () => {
    await productModel.create({
      name: "Product 1",
      slug: "unique-slug",
      description: "Test",
      price: 100,
      category: category._id,
      quantity: 1,
    });

    // Technically shouldn't happen if slug is unique, but we test behavior
    await productModel.create({
      name: "Product 2",
      slug: "unique-slug",
      description: "Test",
      price: 200,
      category: category._id,
      quantity: 1,
    });

    req.params.slug = "unique-slug";

    await getSingleProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.product).toBeTruthy();
  });

  // ✅ 9. Response structure is correct
  test("returns correct response structure", async () => {
    await productModel.create({
      name: "Watch",
      slug: "watch",
      description: "Smart watch",
      price: 300,
      category: category._id,
      quantity: 6,
    });

    req.params.slug = "watch";

    await getSingleProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("message");
    expect(response).toHaveProperty("product");
  });
});