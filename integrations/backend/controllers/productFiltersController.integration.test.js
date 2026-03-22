// Alexander Setyawan, A0257149W
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { productFiltersController } from "../../../controllers/productController.js";

const createRes = () => ({
  status: jest.fn().mockReturnThis(),
  send: jest.fn().mockReturnThis(),
});

const createReq = () => ({
  body: {},
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

describe("productFiltersController (Integration)", () => {
  let req;
  let res;
  let category1;
  let category2;

  beforeEach(async () => {
    req = createReq();
    res = createRes();

    category1 = await categoryModel.create({
      name: "Phones",
      slug: "phones",
    });

    category2 = await categoryModel.create({
      name: "Laptops",
      slug: "laptops",
    });
  });

  // ✅ 1. Filter by category only
  test("returns products matching selected category", async () => {
    await productModel.create({
      name: "iPhone",
      slug: "iphone",
      description: "Phone",
      price: 1000,
      category: category1._id,
      quantity: 5,
    });

    await productModel.create({
      name: "MacBook",
      slug: "macbook",
      description: "Laptop",
      price: 2000,
      category: category2._id,
      quantity: 3,
    });

    req.body = { checked: [category1._id], radio: [] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products.length).toBe(1);
  });

  // ✅ 2. Filter by price range only
  test("returns products within price range", async () => {
    await productModel.insertMany([
      {
        name: "Cheap",
        slug: "cheap",
        description: "Low price",
        price: 50,
        category: category1._id,
        quantity: 5,
      },
      {
        name: "Mid",
        slug: "mid",
        description: "Medium price",
        price: 150,
        category: category1._id,
        quantity: 5,
      },
    ]);

    req.body = { checked: [], radio: [100, 200] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products.length).toBe(1);
  });

  // ✅ 3. Filter by both category and price
  test("returns products matching both category and price range", async () => {
    await productModel.create({
      name: "Phone A",
      slug: "phone-a",
      description: "Test",
      price: 500,
      category: category1._id,
      quantity: 5,
    });

    await productModel.create({
      name: "Laptop A",
      slug: "laptop-a",
      description: "Test",
      price: 500,
      category: category2._id,
      quantity: 5,
    });

    req.body = { checked: [category1._id], radio: [400, 600] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products.length).toBe(1);
  });

  // ✅ 4. No filters returns all products
  test("returns all products when no filters applied", async () => {
    await productModel.insertMany([
      {
        name: "P1",
        slug: "p1",
        description: "Test",
        price: 100,
        category: category1._id,
        quantity: 5,
      },
      {
        name: "P2",
        slug: "p2",
        description: "Test",
        price: 200,
        category: category2._id,
        quantity: 5,
      },
    ]);

    req.body = { checked: [], radio: [] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products.length).toBe(2);
  });

  // ✅ 5. No matching category
  test("returns empty array when category does not match", async () => {
    await productModel.create({
      name: "Phone",
      slug: "phone",
      description: "Test",
      price: 500,
      category: category1._id,
      quantity: 5,
    });

    req.body = { checked: [category2._id], radio: [] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products).toEqual([]);
  });

  // ✅ 6. No matching price range
  test("returns empty array when price range has no matches", async () => {
    await productModel.create({
      name: "Expensive",
      slug: "expensive",
      description: "Test",
      price: 1000,
      category: category1._id,
      quantity: 5,
    });

    req.body = { checked: [], radio: [10, 50] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products).toEqual([]);
  });

  // ✅ 7. Boundary values included
  test("includes products exactly on price boundaries", async () => {
    await productModel.create({
      name: "Boundary",
      slug: "boundary",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    req.body = { checked: [], radio: [100, 200] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products.length).toBe(1);
  });

  // ✅ 8. Multiple categories filter
  test("returns products from multiple selected categories", async () => {
    await productModel.insertMany([
      {
        name: "Phone",
        slug: "phone",
        description: "Test",
        price: 500,
        category: category1._id,
        quantity: 5,
      },
      {
        name: "Laptop",
        slug: "laptop",
        description: "Test",
        price: 1500,
        category: category2._id,
        quantity: 5,
      },
    ]);

    req.body = { checked: [category1._id, category2._id], radio: [] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products.length).toBe(2);
  });

  // ✅ 9. Invalid price range (min > max)
  test("returns empty when min price is greater than max price", async () => {
    await productModel.create({
      name: "Item",
      slug: "item",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    req.body = { checked: [], radio: [200, 100] };

    await productFiltersController(req, res);

    const products = res.send.mock.calls[0][0].products;

    expect(products).toEqual([]);
  });

  // ✅ 10. Handles missing body fields
  test("handles missing checked and radio fields", async () => {
    req.body = {};

    await productFiltersController(req, res);

    expect(res.status).toHaveBeenCalled();
  });
});