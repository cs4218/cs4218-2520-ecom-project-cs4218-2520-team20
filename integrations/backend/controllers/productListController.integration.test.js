// Alexander Setyawan, A0257149W
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { productListController } from "../../../controllers/productController.js";

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

describe("productListController (Integration)", () => {
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

  // ✅ 1. Default page returns first 6 products
  test("returns first 6 products when page is undefined", async () => {
    const products = [];

    for (let i = 0; i < 8; i++) {
      products.push({
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: "Test",
        price: i,
        category: category._id,
        quantity: 1,
      });
    }

    await productModel.insertMany(products);

    await productListController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(6);
  });

  // ✅ 2. Page 2 returns next set of products
  test("returns correct products for page 2", async () => {
    const products = [];

    for (let i = 0; i < 10; i++) {
      products.push({
        name: `Product ${i}`,
        slug: `product-${i}`,
        description: "Test",
        price: i,
        category: category._id,
        quantity: 1,
      });
    }

    await productModel.insertMany(products);

    req.params.page = 2;

    await productListController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(4);
  });

  // ✅ 3. Page 1 behaves like default
  test("page 1 returns first 6 products", async () => {
    await productModel.insertMany(
      Array.from({ length: 7 }).map((_, i) => ({
        name: `P${i}`,
        slug: `p-${i}`,
        description: "Test",
        price: i,
        category: category._id,
        quantity: 1,
      }))
    );

    req.params.page = 1;

    await productListController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(6);
  });

  // ✅ 4. Returns empty array if page exceeds data
  test("returns empty array when page exceeds available data", async () => {
    await productModel.insertMany(
      Array.from({ length: 5 }).map((_, i) => ({
        name: `P${i}`,
        slug: `p-${i}`,
        description: "Test",
        price: i,
        category: category._id,
        quantity: 1,
      }))
    );

    req.params.page = 2;

    await productListController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products).toEqual([]);
  });

  // ✅ 5. Sorting by newest first
  test("returns products sorted by newest first", async () => {
    const older = await productModel.create({
      name: "Old",
      slug: "old",
      description: "Test",
      price: 100,
      category: category._id,
      quantity: 1,
    });

    const newer = await productModel.create({
      name: "New",
      slug: "new",
      description: "Test",
      price: 200,
      category: category._id,
      quantity: 1,
    });

    await productListController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products[0]._id.toString()).toBe(newer._id.toString());
  });

  // ✅ 6. Limits exactly 6 per page
  test("returns exactly 6 products per page when enough data exists", async () => {
    await productModel.insertMany(
      Array.from({ length: 12 }).map((_, i) => ({
        name: `P${i}`,
        slug: `p-${i}`,
        description: "Test",
        price: i,
        category: category._id,
        quantity: 1,
      }))
    );

    await productListController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(6);
  });

  // ✅ 7. Works with mixed categories
  test("returns products regardless of category", async () => {
    const category2 = await categoryModel.create({
      name: "Books",
      slug: "books",
    });

    await productModel.insertMany([
      {
        name: "Phone",
        slug: "phone",
        description: "Test",
        price: 500,
        category: category._id,
        quantity: 1,
      },
      {
        name: "Book",
        slug: "book",
        description: "Test",
        price: 50,
        category: category2._id,
        quantity: 1,
      },
    ]);

    await productListController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(2);
  });

  // ✅ 8. Returns status 200
  test("returns status 200 on success", async () => {
    await productListController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ✅ 9. Returns correct response structure
  test("returns correct response structure", async () => {
    await productListController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("products");
  });

  // ✅ 10. Handles invalid page (non-numeric)
  test("handles non-numeric page value", async () => {
    req.params.page = "abc";

    await productListController(req, res);

    expect(res.status).toHaveBeenCalled();
  });
});