import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import productModel from "../../../models/productModel.js";
import categoryModel from "../../../models/categoryModel.js";
import { productCategoryController } from "../../../controllers/productController.js";

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
};

const createReq = () => {
  const req = { params: {} };
  return req;
};

describe("productCategoryController Integration Tests", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri, { 
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
  });

  test("returns products for a valid category", async () => {
    // Arrange
    const category = await categoryModel.create({ name: "Electronics", slug: "electronics" });
    const product = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "High-end laptop",
      price: 1500,
      category: category._id,
      quantity: 5,
      shipping: true,
    });

    const req = createReq();
    req.params.slug = "electronics";
    const res = createRes();

    // Act
    await productCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      category: expect.objectContaining({ _id: category._id }),
      products: expect.arrayContaining([
        expect.objectContaining({ _id: product._id })
      ]),
    }));
  });

  test("returns empty array if category exists but no products", async () => {
    const category = await categoryModel.create({ name: "Books", slug: "books" });

    const req = createReq();
    req.params.slug = "books";
    const res = createRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      category: expect.objectContaining({ _id: category._id }),
      products: [],
    }));
  });

  test("handles multiple products in one category", async () => {
    const category = await categoryModel.create({ name: "Phones", slug: "phones" });

    const product1 = await productModel.create({
      name: "iPhone",
      slug: "iphone",
      description: "Apple phone",
      price: 1000,
      category: category._id,
      quantity: 10,
      shipping: true,
    });

    const product2 = await productModel.create({
      name: "Samsung Galaxy",
      slug: "samsung-galaxy",
      description: "Samsung phone",
      price: 900,
      category: category._id,
      quantity: 15,
      shipping: true,
    });

    const req = createReq();
    req.params.slug = "phones";
    const res = createRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      category: expect.objectContaining({ _id: category._id }),
      products: expect.arrayContaining([
        expect.objectContaining({ _id: product1._id }),
        expect.objectContaining({ _id: product2._id }),
      ]),
    }));
  });

  test("category with special characters in slug", async () => {
    const category = await categoryModel.create({ name: "Café & Bar", slug: "café-bar" });
    const product = await productModel.create({
      name: "Coffee Maker",
      slug: "coffee-maker",
      description: "Makes coffee",
      price: 120,
      category: category._id,
      quantity: 7,
      shipping: true,
    });

    const req = { params: { slug: "café-bar" } };
    const res = createRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      category: expect.objectContaining({ _id: category._id }),
      products: expect.arrayContaining([
        expect.objectContaining({ _id: product._id }),
      ]),
    }));
  });

  test("product with shipping set to false", async () => {
    const category = await categoryModel.create({ name: "Furniture", slug: "furniture" });
    const product = await productModel.create({
      name: "Chair",
      slug: "chair",
      description: "Wooden chair",
      price: 50,
      category: category._id,
      quantity: 20,
      shipping: false,
    });

    const req = { params: { slug: "furniture" } };
    const res = createRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      products: expect.arrayContaining([
        expect.objectContaining({ _id: product._id, shipping: false }),
      ]),
    }));
  });

  test("correct filtering with multiple categories", async () => {
    const electronics = await categoryModel.create({ name: "Electronics", slug: "electronics" });
    const books = await categoryModel.create({ name: "Books", slug: "books" });

    const laptop = await productModel.create({
      name: "Laptop",
      slug: "laptop",
      description: "High-end laptop",
      price: 1500,
      category: electronics._id,
      quantity: 5,
      shipping: true,
    });

    const novel = await productModel.create({
      name: "Novel",
      slug: "novel",
      description: "Interesting novel",
      price: 20,
      category: books._id,
      quantity: 30,
      shipping: true,
    });

    const req = { params: { slug: "electronics" } };
    const res = createRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.send.mock.calls[0][0];
    expect(result.products.length).toBe(1);
    expect(result.products[0]._id.toString()).toBe(laptop._id.toString());
  });

  test("handles large number of products", async () => {
    const category = await categoryModel.create({ name: "Gadgets", slug: "gadgets" });

    const products = [];
    for (let i = 0; i < 50; i++) {
      products.push({
        name: `Gadget ${i}`,
        slug: `gadget-${i}`,
        description: `Description ${i}`,
        price: i * 10,
        category: category._id,
        quantity: i,
        shipping: true,
      });
    }
    await productModel.insertMany(products);

    const req = { params: { slug: "gadgets" } };
    const res = createRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.send.mock.calls[0][0];
    expect(result.products.length).toBe(50);
  });

  test("product without optional fields (photo missing)", async () => {
    const category = await categoryModel.create({ name: "Accessories", slug: "accessories" });
    const product = await productModel.create({
      name: "Belt",
      slug: "belt",
      description: "Leather belt",
      price: 30,
      category: category._id,
      quantity: 10,
      shipping: true,
      // no photo field
    });

    const req = { params: { slug: "accessories" } };
    const res = createRes();

    await productCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      products: expect.arrayContaining([
        expect.objectContaining({ _id: product._id }),
      ]),
    }));
  });
});