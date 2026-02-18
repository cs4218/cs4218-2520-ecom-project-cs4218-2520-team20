import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  categoryController,
  singleCategoryController,
} from "./categoryController.js";
import { describe } from "node:test";

jest.mock("../models/categoryModel.js");
jest.mock("slugify");

const mockCategories = [
  { _id: "cat-1", name: "Gadgets", slug: "gadgets" },
  { _id: "cat-2", name: "Accessories", slug: "accessories" },
];

const SUCCESS_RESPONSE = 200;
const CREATED_RESPONSE = 201;
const BAD_REQUEST_RESPONSE = 401;
const ERROR_RESPONSE = 500;

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

let req, res;

beforeEach(() => {
  req = { body: {} };
  res = mockRes();
});
afterEach(() => jest.clearAllMocks());

describe("createCategoryController", () => {
  it("creates a new category successfully", async () => {
    req = { body: { name: mockCategories[0].name } };
    categoryModel.findOne.mockResolvedValue(null);
    const saveMock = jest.fn().mockResolvedValue(mockCategories[0]);
    categoryModel.mockImplementation(() => ({ save: saveMock }));

    await createCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      name: mockCategories[0].name,
    });
    expect(saveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(CREATED_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "new category created",
        category: mockCategories[0],
      })
    );
  });

  it("does not create a new category if it already exists", async () => {
    req = { body: { name: mockCategories[0].name } };

    categoryModel.findOne.mockResolvedValue(mockCategories[0]);

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(SUCCESS_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Category Already Exists",
      })
    );
  });

  it("returns 401 if no name is provided", async () => {
    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(BAD_REQUEST_RESPONSE);
    expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
  });

  it("returns 500 and catches an error", async () => {
    req = { body: { name: "Gadgets" } };

    const error = new Error("DB failure");
    categoryModel.findOne.mockRejectedValue(error);

    await createCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Error in Category" })
    );
  });
});

describe("updateCategoryController", () => {
  it("updates a category successfully", async () => {
    req = {
      body: { name: "Gadgets Updated" },
      params: { id: mockCategories[0]._id },
    };

    const updatedCategory = {
      ...mockCategories[0],
      name: "Gadgets Updated",
      slug: "gadgets-updated",
    };
    categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);
    slugify.mockReturnValue("gadgets-updated");

    await updateCategoryController(req, res);

    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
      mockCategories[0]._id,
      { name: "Gadgets Updated", slug: "gadgets-updated" },
      { new: true }
    );
    expect(res.status).toHaveBeenCalledWith(SUCCESS_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Category Updated Successfully",
        category: updatedCategory,
      })
    );
  });

  it("returns 500 and catches an error", async () => {
    req = {
      body: { name: "Gadgets Updated" },
      params: { id: mockCategories[0]._id },
    };

    const error = new Error("DB failure");
    categoryModel.findByIdAndUpdate.mockRejectedValue(error);

    await updateCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while updating category",
      })
    );
  });
});

describe("categoryController", () => {
  it("returns all categories successfully", async () => {
    categoryModel.find.mockResolvedValue(mockCategories);

    await categoryController(req, res);

    expect(categoryModel.find).toHaveBeenCalledWith({});
    expect(res.status).toHaveBeenCalledWith(SUCCESS_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "All Categories List",
        category: mockCategories,
      })
    );
  });

  it("returns 500 and catches an error", async () => {
    const error = new Error("DB failure");
    categoryModel.find.mockRejectedValue(error);

    await categoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while getting all categories",
      })
    );
  });
});

describe("singleCategoryController", () => {
  it("returns a single category successfully", async () => {
    req = { params: { slug: mockCategories[0].slug } };
    categoryModel.findOne.mockResolvedValue(mockCategories[0]);

    await singleCategoryController(req, res);

    expect(categoryModel.findOne).toHaveBeenCalledWith({
      slug: mockCategories[0].slug,
    });
    expect(res.status).toHaveBeenCalledWith(SUCCESS_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Get Single Category Successfully",
        category: mockCategories[0],
      })
    );
  });

  it("returns 500 and catches an error", async () => {
    req = { params: { slug: mockCategories[0].slug } };
    const error = new Error("DB failure");
    categoryModel.findOne.mockRejectedValue(error);

    await singleCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error While getting Single Category",
      })
    );
  });
});

describe("deleteCategoryController", () => {
  it("deletes a category successfully", async () => {
    req = { params: { id: mockCategories[0]._id } };
    await deleteCategoryController(req, res);

    expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(
      mockCategories[0]._id
    );
    expect(res.status).toHaveBeenCalledWith(SUCCESS_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: "Category Deleted Successfully",
      })
    );
  });

  it("returns 500 and catches an error", async () => {
    req = { params: { id: mockCategories[0]._id } };
    const error = new Error("DB failure");
    categoryModel.findByIdAndDelete.mockRejectedValue(error);

    await deleteCategoryController(req, res);

    expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error while deleting category",
      })
    );
  });
});
