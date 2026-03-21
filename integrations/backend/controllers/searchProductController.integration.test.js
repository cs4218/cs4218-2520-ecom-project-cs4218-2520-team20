import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { searchProductController } from "../../../controllers/productController.js";

const createRes = () => {
  return {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
};

const createReq = () => {
  return {
    params: {},
  };
};

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

describe("searchProductController (Integration)", () => {
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

  // ✅ 1. Match by name
  test("returns products matching keyword in name", async () => {
    await productModel.create({
      name: "iPhone 15",
      slug: "iphone-15",
      description: "Apple phone",
      price: 1000,
      category: category._id,
      quantity: 10,
    });

    req.params.keyword = "iphone";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("iPhone 15");
  });

  // ✅ 2. Match by description
  test("returns products matching keyword in description", async () => {
    await productModel.create({
      name: "Galaxy S23",
      slug: "galaxy-s23",
      description: "Samsung smartphone",
      price: 900,
      category: category._id,
      quantity: 5,
    });

    req.params.keyword = "samsung";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Galaxy S23");
  });

  // ✅ 3. Case-insensitive search
  test("search is case-insensitive", async () => {
    await productModel.create({
      name: "MacBook Pro",
      slug: "macbook-pro",
      description: "Apple laptop",
      price: 2000,
      category: category._id,
      quantity: 3,
    });

    req.params.keyword = "macbook";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(result.length).toBe(1);
  });

  // ✅ 4. Returns multiple matches
  test("returns multiple matching products", async () => {
    await productModel.insertMany([
      {
        name: "iPhone 14",
        slug: "iphone-14",
        description: "Apple phone",
        price: 800,
        category: category._id,
        quantity: 5,
      },
      {
        name: "iPhone 15",
        slug: "iphone-15",
        description: "Latest Apple phone",
        price: 1000,
        category: category._id,
        quantity: 5,
      },
    ]);

    req.params.keyword = "iphone";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(result.length).toBe(2);
  });

  // ✅ 5. No matches
  test("returns empty array when no products match", async () => {
    await productModel.create({
      name: "Dell Laptop",
      slug: "dell-laptop",
      description: "Windows laptop",
      price: 700,
      category: category._id,
      quantity: 5,
    });

    req.params.keyword = "iphone";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(result).toEqual([]);
  });

  // ✅ 6. Partial match
  test("supports partial keyword matching", async () => {
    await productModel.create({
      name: "AirPods Pro",
      slug: "airpods-pro",
      description: "Wireless earbuds",
      price: 250,
      category: category._id,
      quantity: 8,
    });

    req.params.keyword = "air";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(result.length).toBe(1);
  });

  // ✅ 7. Special characters in keyword
  test("handles special characters safely", async () => {
    await productModel.create({
      name: "C++ Book",
      slug: "cpp-book",
      description: "Programming book",
      price: 50,
      category: category._id,
      quantity: 2,
    });

    req.params.keyword = "C++";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(result.length).toBe(1);
  });

  // ✅ 8. Empty keyword
  test("handles empty keyword", async () => {
    req.params.keyword = "";

    await searchProductController(req, res);

    const result = res.json.mock.calls[0][0];

    expect(Array.isArray(result)).toBe(true);
  });
});