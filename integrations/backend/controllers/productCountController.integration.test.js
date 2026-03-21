import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { productCountController } from "../../../controllers/productController.js";

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

describe("productCountController (Integration)", () => {
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

  // ✅ 1. Returns 0 when no products exist
  test("returns 0 when collection is empty", async () => {
    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(0);
  });

  // ✅ 2. Counts a single product
  test("returns 1 when one product exists", async () => {
    await productModel.create({
      name: "Product 1",
      slug: "product-1",
      description: "Test",
      price: 100,
      category: category._id,
      quantity: 1,
    });

    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(1);
  });

  // ✅ 3. Counts multiple products
  test("returns correct count for multiple products", async () => {
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
      {
        name: "P3",
        slug: "p3",
        description: "Test",
        price: 300,
        category: category._id,
        quantity: 1,
      },
    ]);

    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(3);
  });

  // ✅ 4. Counts products across different categories
  test("counts products regardless of category", async () => {
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

    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(2);
  });

  // ✅ 5. Returns correct response structure
  test("returns correct response structure", async () => {
    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response).toHaveProperty("success", true);
    expect(response).toHaveProperty("total");
  });

  // ✅ 6. Returns status 200 on success
  test("returns status 200 on success", async () => {
    await productCountController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  // ✅ 7. Handles large number of products
  test("handles counting a large number of products", async () => {
    const products = [];

    for (let i = 0; i < 50; i++) {
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

    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(50);
  });

  // ✅ 8. Ignores product field variations
  test("counts products regardless of field differences", async () => {
    await productModel.insertMany([
      {
        name: "With Shipping",
        slug: "with-shipping",
        description: "Test",
        price: 100,
        category: category._id,
        quantity: 1,
        shipping: true,
      },
      {
        name: "Without Shipping",
        slug: "without-shipping",
        description: "Test",
        price: 200,
        category: category._id,
        quantity: 1,
      },
    ]);

    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(2);
  });

  // ✅ 9. After deletion reflects updated count
  test("updates count after product deletion", async () => {
    const product = await productModel.create({
      name: "Temp",
      slug: "temp",
      description: "Test",
      price: 100,
      category: category._id,
      quantity: 1,
    });

    await productModel.deleteOne({ _id: product._id });

    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(0);
  });

  // ✅ 10. Handles rapid insertions correctly
  test("counts correctly after rapid insertions", async () => {
    const insertPromises = [];

    for (let i = 0; i < 10; i++) {
      insertPromises.push(
        productModel.create({
          name: `Rapid ${i}`,
          slug: `rapid-${i}`,
          description: "Test",
          price: i,
          category: category._id,
          quantity: 1,
        })
      );
    }

    await Promise.all(insertPromises);

    await productCountController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.total).toBe(10);
  });
});