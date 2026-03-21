import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { getProductController } from "../../../controllers/productController.js";

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

const createReq = () => ({});

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

describe("getProductController (Integration)", () => {
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

  // ✅ 1. Returns products successfully
  test("returns products when they exist", async () => {
    await productModel.create({
      name: "Product A",
      slug: "product-a",
      description: "Test",
      price: 100,
      category: category._id,
      quantity: 1,
    });

    await getProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(1);
  });

  // ✅ 2. Returns status 200
  test("returns status 200 on success", async () => {
    await getProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ✅ 3. Returns empty array when no products
  test("returns empty array when no products exist", async () => {
    await getProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products).toEqual([]);
  });

  // ✅ 4. Limits results to 12
  test("limits results to maximum of 12 products", async () => {
    const products = [];

    for (let i = 0; i < 15; i++) {
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

    await getProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(12);
  });

  // ✅ 5. Sorts by newest first
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

    req.params = {};

    await getProductController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products[0]._id.toString()).toBe(newer._id.toString());
  });

  // ✅ 6. Populates category field
  test("populates category in returned products", async () => {
    await productModel.create({
      name: "Phone",
      slug: "phone",
      description: "Test",
      price: 500,
      category: category._id,
      quantity: 1,
    });

    await getProductController(req, res);

    const product = res.send.mock.calls[0][0].products[0];

    expect(product.category.name).toBe("Electronics");
  });

  // ✅ 7. Returns correct counTotal
  test("returns correct counTotal equal to number of returned products", async () => {
    await productModel.insertMany([
      {
        name: "P1",
        slug: "p1",
        description: "Test",
        price: 100,
        category: category._id,
        quantity: 1,
      },
      {
        name: "P2",
        slug: "p2",
        description: "Test",
        price: 200,
        category: category._id,
        quantity: 1,
      },
    ]);

    await getProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.counTotal).toBe(2);
  });

  // ✅ 8. Handles mixed categories
  test("returns products from different categories", async () => {
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

    await getProductController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products.length).toBe(2);
  });

  // ✅ 9. Returns correct response structure
  test("returns correct response structure", async () => {
    await getProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("products");
    expect(response).toHaveProperty("counTotal");
    expect(response).toHaveProperty("message");
  });
});