// Alexander Setyawan, A0257149W
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { relatedProductController } from "../../../controllers/productController.js";

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

describe("relatedProductController (Integration)", () => {
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

  // ✅ 1. Returns products from same category
  test("returns products from the same category", async () => {
    const p1 = await productModel.create({
      name: "iPhone 15",
      slug: "iphone-15",
      description: "Apple phone",
      price: 1000,
      category: category1._id,
      quantity: 5,
    });

    await productModel.create({
      name: "iPhone 14",
      slug: "iphone-14",
      description: "Older Apple phone",
      price: 800,
      category: category1._id,
      quantity: 5,
    });

    req.params.pid = p1._id.toString();
    req.params.cid = category1._id.toString();

    await relatedProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(1);
  });

  // ✅ 2. Excludes current product
  test("does not include the current product (pid)", async () => {
    const p1 = await productModel.create({
      name: "Product A",
      slug: "product-a",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    await productModel.create({
      name: "Product B",
      slug: "product-b",
      description: "Test",
      price: 200,
      category: category1._id,
      quantity: 5,
    });

    req.params.pid = p1._id.toString();
    req.params.cid = category1._id.toString();

    await relatedProductController(req, res);

    const response = res.send.mock.calls[0][0];

    const ids = response.products.map(p => p._id.toString());

    expect(ids).not.toContain(p1._id.toString());
  });

  // ✅ 3. Limits results to 3
  test("limits the number of results to 3", async () => {
    const p1 = await productModel.create({
      name: "Main Product",
      slug: "main-product",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    // Create 5 related products
    for (let i = 0; i < 5; i++) {
      await productModel.create({
        name: `Related ${i}`,
        slug: `related-${i}`,
        description: "Test",
        price: 100,
        category: category1._id,
        quantity: 5,
      });
    }

    req.params.pid = p1._id.toString();
    req.params.cid = category1._id.toString();

    await relatedProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(3);
  });

  // ✅ 4. Does not return products from different categories
  test("does not include products from other categories", async () => {
    const p1 = await productModel.create({
      name: "Phone A",
      slug: "phone-a",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    await productModel.create({
      name: "Laptop A",
      slug: "laptop-a",
      description: "Test",
      price: 1000,
      category: category2._id,
      quantity: 5,
    });

    req.params.pid = p1._id.toString();
    req.params.cid = category1._id.toString();

    await relatedProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products.length).toBe(0);
  });

  // ✅ 5. Returns empty when no related products
  test("returns empty array when no related products exist", async () => {
    const p1 = await productModel.create({
      name: "Only Product",
      slug: "only-product",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    req.params.pid = p1._id.toString();
    req.params.cid = category1._id.toString();

    await relatedProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products).toEqual([]);
  });

  // ✅ 6. Populates category field
  test("populates category in returned products", async () => {
    const p1 = await productModel.create({
      name: "Main",
      slug: "main",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    await productModel.create({
      name: "Related",
      slug: "related",
      description: "Test",
      price: 200,
      category: category1._id,
      quantity: 5,
    });

    req.params.pid = p1._id.toString();
    req.params.cid = category1._id.toString();

    await relatedProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products[0].category.name).toBe("Phones");
  });

  // ✅ 7. Handles invalid category id
  test("returns empty array for invalid category id", async () => {
    const p1 = await productModel.create({
      name: "Product",
      slug: "product",
      description: "Test",
      price: 100,
      category: category1._id,
      quantity: 5,
    });

    req.params.pid = p1._id.toString();
    req.params.cid = new mongoose.Types.ObjectId().toString();

    await relatedProductController(req, res);

    const response = res.send.mock.calls[0][0];

    expect(response.products).toEqual([]);
  });

  // ✅ 8. Handles missing pid
  test("handles missing pid gracefully", async () => {
    req.params.cid = category1._id.toString();

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalled();
  });

  // ✅ 9. Handles missing cid
  test("handles missing cid gracefully", async () => {
    req.params.pid = new mongoose.Types.ObjectId().toString();

    await relatedProductController(req, res);

    expect(res.status).toHaveBeenCalled();
  });
});