// Seah Minlong, A0271643E
// Integration: categoryController.js <-> categoryModel.js 
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import categoryModel from "@server/models/categoryModel.js";
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  categoryController,
  singleCategoryController,
} from "@server/controllers/categoryController.js";

let mongoServer;

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
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
});

describe("createCategoryController", () => {
  it("returns 201 with success response body on a valid name", async () => {
    // Arrange
    const req = { body: { name: "Electronics" } };
    const res = mockRes();

    // Act
    await createCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("New category created");
    expect(body.category.name).toBe("Electronics");
    expect(body.category.slug).toBe("electronics");
  });

  it("persists the new category document in the DB", async () => {
    // Arrange
    const req = { body: { name: "Electronics" } };
    const res = mockRes();

    // Act
    await createCategoryController(req, res);

    // Assert
    const saved = await categoryModel.findOne({ name: "Electronics" });
    expect(saved).not.toBeNull();
    expect(saved.slug).toBe("electronics");
  });

  it("returns 409 response when a duplicate name already exists", async () => {
    // Arrange
    await categoryModel.create({ name: "Electronics", slug: "electronics" });
    const req = { body: { name: "Electronics" } };
    const res = mockRes();

    // Act
    await createCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe("Category Already Exists");
  });

  it("does not create a duplicate document in the DB", async () => {
    // Arrange
    await categoryModel.create({ name: "Electronics", slug: "electronics" });
    const req = { body: { name: "Electronics" } };
    const res = mockRes();

    // Act
    await createCategoryController(req, res);

    // Assert
    const count = await categoryModel.countDocuments({ name: "Electronics" });
    expect(count).toBe(1);
  });
});

describe("updateCategoryController", () => {
  it("returns 200 with the updated category in the response", async () => {
    // Arrange
    const existing = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
    const req = {
      body: { name: "Gadgets" },
      params: { id: existing._id.toString() },
    };
    const res = mockRes();

    // Act
    await updateCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("Category Updated Successfully");
    expect(body.category.name).toBe("Gadgets");
    expect(body.category.slug).toBe("gadgets");
  });

  it("persists the update to the DB", async () => {
    // Arrange
    const existing = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
    const req = {
      body: { name: "Gadgets" },
      params: { id: existing._id.toString() },
    };
    const res = mockRes();

    // Act
    await updateCategoryController(req, res);

    // Assert
    const updated = await categoryModel.findById(existing._id);
    expect(updated.name).toBe("Gadgets");
    expect(updated.slug).toBe("gadgets");
  });

  it("returns 404 when the category ID does not exist in the DB", async () => {
    // Arrange
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = {
      body: { name: "Gadgets" },
      params: { id: nonExistentId },
    };
    const res = mockRes();

    // Act
    await updateCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.send.mock.calls[0][0];
    expect(body.message).toBe("Category not found");
  });

  it("returns 409 when the new name already belongs to a different category", async () => {
    // Arrange
    await categoryModel.create({ name: "Gadgets", slug: "gadgets" });
    const existing = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
    const req = {
      body: { name: "Gadgets" },
      params: { id: existing._id.toString() },
    };
    const res = mockRes();

    // Act
    await updateCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(409);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe("Category Already Exists");
  });

});

describe("deleteCategoryController", () => {
  it("returns 200 with success response", async () => {
    // Arrange
    const existing = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
    const req = { params: { id: existing._id.toString() } };
    const res = mockRes();

    // Act
    await deleteCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("Category Deleted Successfully");
  });

  it("removes the document from the DB", async () => {
    // Arrange
    const existing = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });
    const req = { params: { id: existing._id.toString() } };
    const res = mockRes();

    // Act
    await deleteCategoryController(req, res);

    // Assert
    const gone = await categoryModel.findById(existing._id);
    expect(gone).toBeNull();
  });

  it("returns 404 when the category ID does not exist in the DB", async () => {
    // Arrange
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const req = { params: { id: nonExistentId } };
    const res = mockRes();

    // Act
    await deleteCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.send.mock.calls[0][0];
    expect(body.message).toBe("Category not found");
  });

});

describe("categoryController (getAllCategories)", () => {
  it("returns all seeded category names with correct status", async () => {
    // Arrange
    await categoryModel.create([
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing", slug: "clothing" },
    ]);
    const req = {};
    const res = mockRes();

    // Act
    await categoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("All Categories List");
    expect(body.category).toHaveLength(2);
    const names = body.category.map((c) => c.name);
    expect(names).toContain("Electronics");
    expect(names).toContain("Clothing");
  });

  it("returns categories with the correct document fields", async () => {
    // Arrange
    await categoryModel.create([
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing", slug: "clothing" },
    ]);
    const req = {};
    const res = mockRes();

    // Act
    await categoryController(req, res);

    // Assert
    const { category } = res.send.mock.calls[0][0];
    category.forEach((c) => {
      expect(c).toHaveProperty("_id");
      expect(c).toHaveProperty("name");
      expect(c).toHaveProperty("slug");
    });
  });
});

describe("singleCategoryController (getSingleCategory)", () => {
  it("returns 200 with correct response metadata", async () => {
    // Arrange
    await categoryModel.create({ name: "Electronics", slug: "electronics" });
    const req = { params: { slug: "electronics" } };
    const res = mockRes();

    // Act
    await singleCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.message).toBe("Get Single Category Successfully");
  });

  it("returns the correct category document fields", async () => {
    // Arrange
    await categoryModel.create({ name: "Electronics", slug: "electronics" });
    const req = { params: { slug: "electronics" } };
    const res = mockRes();

    // Act
    await singleCategoryController(req, res);

    // Assert
    const { category } = res.send.mock.calls[0][0];
    expect(category).toHaveProperty("_id");
    expect(category.name).toBe("Electronics");
    expect(category.slug).toBe("electronics");
  });

  it("returns 404 when the slug does not exist in the DB", async () => {
    // Arrange
    const req = { params: { slug: "nonexistent-slug" } };
    const res = mockRes();

    // Act
    await singleCategoryController(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    const body = res.send.mock.calls[0][0];
    expect(body.success).toBe(false);
    expect(body.message).toBe("Category not found");
  });
});
