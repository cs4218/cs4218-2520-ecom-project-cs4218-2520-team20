import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
} from "./productController.js";

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";

jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("fs");
jest.mock("slugify", () => jest.fn());

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn(function BraintreeGatewayMock() {
    return {};
  }),
  Environment: {
    Sandbox: "sandbox",
  },
}));

const createRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  };
  return res;
};

const createReq = () => {
  const req = {
    fields: {},
    files: {},
    body: {},
    params: {},
  };
  return req;
};

const createQueryChain = (finalMethodName, finalResolvedValue) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };

  chain[finalMethodName] = jest.fn().mockResolvedValue(finalResolvedValue);
  return chain;
};

describe("Product Controller", () => {
  let req;
  let res;

  beforeEach(() => {
    req = createReq();
    res = createRes();

    jest.clearAllMocks();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    slugify.mockImplementation(() => "mock-slug");
  });

  describe("getProductController", () => { // Alexander Setyawan, A0257149W
    test("getProducts_success_returns200", async () => {
      // Arrange
      const mockProducts = [{ _id: "p1" }, { _id: "p2" }];
      const query = createQueryChain("sort", mockProducts);
      productModel.find = jest.fn().mockReturnValue(query);
      query.populate.mockReturnThis();
      query.select.mockReturnThis();
      query.limit.mockReturnThis();

      // Act
      await getProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(query.populate).toHaveBeenCalledWith("category");
      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(query.limit).toHaveBeenCalledWith(12);
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        counTotal: 2,
        message: "All Products ",
        products: mockProducts,
      });
    });

    test("getProducts_error_returns500", async () => {
      // Arrange
      const mockError = new Error("db");
      productModel.find = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in getting products",
        error: mockError.message,
      });
    });
  });

  describe("getSingleProductController", () => { // Alexander Setyawan, A0257149W
    test("getSingleProduct_success_returns200", async () => {
      // Arrange
      req.params.slug = "phone";
      const mockProduct = { _id: "p1", name: "Phone" };

      const query = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProduct),
      };

      productModel.findOne = jest.fn().mockReturnValue(query);

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(productModel.findOne).toHaveBeenCalledWith({
        slug: "phone",
      });
      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(query.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });
    });

    test("getSingleProduct_error_returns500", async () => {
      // Arrange
      req.params.slug = "phone";
      const mockError = new Error("db");
      productModel.findOne = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting single product",
        error: mockError,
      });
    });
  });

  describe("productPhotoController", () => { // Alexander Setyawan, A0257149W
    test("getPhoto_hasData_setsContentTypeAndReturns200", async () => {
      // Arrange
      req.params.pid = "p1";
      const mockProduct = {
        photo: {
          data: Buffer.from("abc"),
          contentType: "image/png",
        },
      };

      const query = {
        select: jest.fn().mockResolvedValue(mockProduct),
      };
      productModel.findById = jest.fn().mockReturnValue(query);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith("p1");
      expect(query.select).toHaveBeenCalledWith("photo");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(Buffer.from("abc"));
    });

    test("getPhoto_noData_doesNotSendPhoto", async () => {
      // Arrange
      req.params.pid = "p1";
      const mockProduct = {
        photo: { data: null, contentType: "image/png" },
      };

      const query = {
        select: jest.fn().mockResolvedValue(mockProduct),
      };
      productModel.findById = jest.fn().mockReturnValue(query);

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(res.set).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(200);
      expect(res.send).not.toHaveBeenCalled();
    });

    test("getPhoto_error_returns500", async () => {
      // Arrange
      req.params.pid = "p1";
      const mockError = new Error("db");
      productModel.findById = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting photo",
        error: mockError,
      });
    });
  });

  describe("productFiltersController", () => { // Alexander Setyawan, A0257149W
    test("filterProducts_categoryAndPrice_callsFindWithArgs_returns200", async () => {
      // Arrange
      req.body = { checked: ["c1"], radio: [10, 50] };
      const mockProducts = [{ _id: "p1" }];
      productModel.find = jest.fn().mockResolvedValue(mockProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: ["c1"],
        price: { $gte: 10, $lte: 50 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    test("filterProducts_noFilters_callsFindWithEmptyArgs_returns200", async () => {
      // Arrange
      req.body = { checked: [], radio: [] };
      productModel.find = jest.fn().mockResolvedValue([]);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("filterProducts_error_returns400", async () => {
      // Arrange
      req.body = { checked: ["c1"], radio: [] };
      const mockError = new Error("db");
      productModel.find = jest.fn().mockRejectedValue(mockError);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error While Filtering Products",
        error: mockError,
      });
    });
  });

  describe("productCountController", () => { // Alexander Setyawan, A0257149W
    test("countProducts_success_returns200", async () => {
      // Arrange
      const query = {
        estimatedDocumentCount: jest.fn().mockResolvedValue(123),
      };
      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await productCountController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(query.estimatedDocumentCount).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 123,
      });
    });

    test("countProducts_error_returns400", async () => {
      // Arrange
      const mockError = new Error("db");
      productModel.find = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      // Act
      await productCountController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        message: "Error in product count",
        error: mockError,
        success: false,
      });
    });
  });

  describe("productListController", () => { // Alexander Setyawan, A0257149W
    test("listProducts_defaultPage_returns200", async () => {
      // Arrange
      req.params.page = undefined;
      const mockProducts = [{ _id: "p1" }];

      const query = createQueryChain("sort", mockProducts);
      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await productListController(req, res);

      // Assert
      expect(query.skip).toHaveBeenCalledWith(0);
      expect(query.limit).toHaveBeenCalledWith(6);
      expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    test("listProducts_page2_returns200", async () => {
      // Arrange
      req.params.page = 2;
      const mockProducts = [{ _id: "p2" }];

      const query = createQueryChain("sort", mockProducts);
      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await productListController(req, res);

      // Assert
      expect(query.skip).toHaveBeenCalledWith(6);
      expect(query.limit).toHaveBeenCalledWith(6);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test("listProducts_error_returns400", async () => {
      // Arrange
      const mockError = new Error("db");
      productModel.find = jest.fn().mockImplementation(() => {
        throw mockError;
      });

      // Act
      await productListController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error in per page ctrl",
        error: mockError,
      });
    });
  });

  describe("searchProductController", () => { // Alexander Setyawan, A0257149W
    test("searchProducts_success_returnsJson", async () => {
      // Arrange
      req.params.keyword = "iph";
      const mockResults = [{ _id: "p1" }];

      const query = {
        select: jest.fn().mockResolvedValue(mockResults),
      };
      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "iph", $options: "i" } },
          { description: { $regex: "iph", $options: "i" } },
        ],
      });
      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    test("searchProducts_error_returns400", async () => {
      // Arrange
      req.params.keyword = "iph";
      const mockError = new Error("db");
      const query = {
        select: jest.fn().mockRejectedValue(mockError),
      };
      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error In Search Product API",
        error: mockError,
      });
    });
  });

  describe("relatedProductController", () => { // Alexander Setyawan, A0257149W
    test("relatedProducts_success_returns200", async () => {
      // Arrange
      req.params.pid = "p1";
      req.params.cid = "c1";
      const mockProducts = [{ _id: "p2" }];

      const query = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts),
      };

      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: "c1",
        _id: { $ne: "p1" },
      });
      expect(query.select).toHaveBeenCalledWith("-photo");
      expect(query.limit).toHaveBeenCalledWith(3);
      expect(query.populate).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    test("relatedProducts_error_returns400", async () => {
      // Arrange
      req.params.pid = "p1";
      req.params.cid = "c1";
      const mockError = new Error("db");
      const query = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockRejectedValue(mockError),
      };
      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await relatedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "error while getting related product",
        error: mockError,
      });
    });
  });

  describe("productCategoryController", () => { // Alexander Setyawan, A0257149W
    test("categoryProducts_success_returns200", async () => {
      // Arrange
      req.params.slug = "electronics";

      const mockCategory = { _id: "c1", slug: "electronics" };
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);

      const mockProducts = [{ _id: "p1" }];
      const query = {
        populate: jest.fn().mockResolvedValue(mockProducts),
      };
      productModel.find = jest.fn().mockReturnValue(query);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "electronics",
      });
      expect(productModel.find).toHaveBeenCalledWith({
        category: mockCategory,
      });
      expect(query.populate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
        products: mockProducts,
      });
    });

    test("categoryProducts_error_returns400", async () => {
      // Arrange
      req.params.slug = "electronics";
      const mockError = new Error("db");
      categoryModel.findOne = jest.fn().mockRejectedValue(mockError);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: mockError,
        message: "Error While Getting products",
      });
    });
  });
});