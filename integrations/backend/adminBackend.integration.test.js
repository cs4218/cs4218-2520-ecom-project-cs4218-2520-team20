// Seah Minlong, A0271643E
// Integration: categoryController.js, categoryModel.js, productModel.js,
//              createProductController, deleteProductController
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import os from "os";
import path from "path";
import fs from "fs";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import { createCategoryController } from "../../controllers/categoryController.js";
import {
  createProductController,
  deleteProductController,
} from "../../controllers/productController.js";

let mongoServer;
let tempFiles = [];

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Writes a small temp file and tracks it for cleanup
const makeTempPhoto = () => {
  const filePath = path.join(os.tmpdir(), `test-photo-${Date.now()}.jpg`);
  fs.writeFileSync(filePath, Buffer.alloc(1024));
  tempFiles.push(filePath);
  return filePath;
};

// Seeds a real category via createCategoryController and returns its _id string
const seedCategory = async (name = "Electronics") => {
  const req = { body: { name } };
  const res = mockRes();
  await createCategoryController(req, res);
  return res.send.mock.calls[0][0].category._id.toString();
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await categoryModel.deleteMany({});
  await productModel.deleteMany({});
  tempFiles = [];
});

afterEach(() => {
  for (const p of tempFiles) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
});

describe("createProductController", () => {
  it("returns 201 with correct response when all fields are valid", async () => {
    // Arrange
    const categoryId = await seedCategory();
    const photoPath = makeTempPhoto();
    const req = {
      fields: {
        name: "laptop",
        description: "a powerful laptop",
        price: "1500",
        category: categoryId,
        quantity: "5",
        shipping: "true",
      },
      files: { photo: { path: photoPath, type: "image/jpeg", size: 1024 } },
    };
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("Product Created Successfully");
    expect(body.products.name).toBe("laptop");
    expect(body.products.category.toString()).toBe(categoryId);
  });

  it("persists the product document in the DB linked to the real category", async () => {
    // Arrange
    const categoryId = await seedCategory();
    const photoPath = makeTempPhoto();
    const req = {
      fields: {
        name: "laptop",
        description: "a powerful laptop",
        price: "1500",
        category: categoryId,
        quantity: "5",
        shipping: "true",
      },
      files: { photo: { path: photoPath, type: "image/jpeg", size: 1024 } },
    };
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    const saved = await productModel.findOne({ name: "laptop" });
    expect(saved).not.toBeNull();
    expect(saved.description).toBe("a powerful laptop");
    expect(saved.price).toBe(1500);
    expect(saved.category.toString()).toBe(categoryId);
  });

  it("returns 400 when name is missing", async () => {
    // Arrange
    const req = {
      fields: {
        description: "a powerful laptop",
        price: "1500",
        category: new mongoose.Types.ObjectId().toString(),
        quantity: "5",
        shipping: "true",
      },
      files: {},
    };
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.send.mock.calls[0][0];
    expect(body.error).toBe("Name is Required");
  });

  it("returns 400 when category is missing", async () => {
    // Arrange
    const req = {
      fields: {
        name: "laptop",
        description: "a powerful laptop",
        price: "1500",
        quantity: "5",
        shipping: "true",
      },
      files: {},
    };
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.send.mock.calls[0][0];
    expect(body.error).toBe("Category is Required");
  });

  it("returns 400 when photo is missing", async () => {
    // Arrange
    const req = {
      fields: {
        name: "laptop",
        description: "a powerful laptop",
        price: "1500",
        category: new mongoose.Types.ObjectId().toString(),
        quantity: "5",
        shipping: "true",
      },
      files: {},
    };
    const res = mockRes();

    // Act
    await createProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    const body = res.send.mock.calls[0][0];
    expect(body.error).toBe("photo is Required");
  });
});

describe("deleteProductController", () => {
  it("returns 200 with success response and removes the product from the DB", async () => {
    // Arrange
    const categoryId = await seedCategory();
    const photoPath = makeTempPhoto();
    const createReq = {
      fields: {
        name: "laptop",
        description: "a powerful laptop",
        price: "1500",
        category: categoryId,
        quantity: "5",
        shipping: "true",
      },
      files: { photo: { path: photoPath, type: "image/jpeg", size: 1024 } },
    };
    const createRes = mockRes();
    await createProductController(createReq, createRes);
    const productId = createRes.send.mock.calls[0][0].products._id.toString();

    const req = { params: { pid: productId } };
    const res = mockRes();

    // Act
    await deleteProductController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("Product Deleted successfully");

    const gone = await productModel.findById(productId);
    expect(gone).toBeNull();
  });

  it("confirms the product is absent from a subsequent DB listing after deletion", async () => {
    // Arrange
    const categoryId = await seedCategory();
    const photoPath = makeTempPhoto();
    const createReq = {
      fields: {
        name: "laptop",
        description: "a powerful laptop",
        price: "1500",
        category: categoryId,
        quantity: "5",
        shipping: "true",
      },
      files: { photo: { path: photoPath, type: "image/jpeg", size: 1024 } },
    };
    const createRes = mockRes();
    await createProductController(createReq, createRes);
    const productId = createRes.send.mock.calls[0][0].products._id.toString();

    // Act
    await deleteProductController({ params: { pid: productId } }, mockRes());

    // Assert
    const remaining = await productModel.find({});
    expect(remaining).toHaveLength(0);
  });
});

describe("cross-model consistency: categoryController <-> createProductController", () => {
  it("product created via createProductController is correctly linked to category created via createCategoryController", async () => {
    // Arrange — create category using the real createCategoryController
    const catReq = { body: { name: "Electronics" } };
    const catRes = mockRes();
    await createCategoryController(catReq, catRes);
    const categoryId = catRes.send.mock.calls[0][0].category._id.toString();

    // Act — create product using the real createProductController with that category ID
    const photoPath = makeTempPhoto();
    const prodReq = {
      fields: {
        name: "laptop",
        description: "a powerful laptop",
        price: "1500",
        category: categoryId,
        quantity: "5",
        shipping: "true",
      },
      files: { photo: { path: photoPath, type: "image/jpeg", size: 1024 } },
    };
    const prodRes = mockRes();
    await createProductController(prodReq, prodRes);

    // Assert — both documents exist in the DB and are correctly linked via category _id
    const savedCategory = await categoryModel.findById(categoryId);
    const savedProduct = await productModel.findOne({ name: "laptop" });

    expect(savedCategory).not.toBeNull();
    expect(savedProduct).not.toBeNull();
    expect(savedProduct.category.toString()).toBe(savedCategory._id.toString());
  });
});
