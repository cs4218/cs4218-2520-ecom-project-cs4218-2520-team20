// Seah Minlong, A0271643E
import productModel from "../models/productModel.js";
import fs from "fs";
import slugify from "slugify";
import {
	createProductController,
	deleteProductController,
	updateProductController,
} from "./productController.js";

jest.mock("../models/productModel.js", () => {
	const MockProductModel = jest.fn();
	MockProductModel.findByIdAndUpdate = jest.fn();
	MockProductModel.findByIdAndDelete = jest.fn();
	return { __esModule: true, default: MockProductModel };
});
jest.mock("../models/categoryModel.js", () => ({
	__esModule: true,
	default: {},
}));
jest.mock("../models/orderModel.js", () => ({ __esModule: true, default: {} }));
jest.mock("fs");
jest.mock("slugify");
jest.mock("braintree", () => ({
	BraintreeGateway: jest.fn(() => ({})),
	Environment: { Sandbox: "sandbox" },
}));
jest.mock("dotenv", () => ({ config: jest.fn() }));

const makeRes = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	return res;
};

const validFields = {
	name: "Test Product",
	description: "A test description",
	price: "99.99",
	category: "cat123",
	quantity: "10",
	shipping: "1",
};

const validPhoto = {
	path: "/tmp/photo.jpg",
	type: "image/jpeg",
	size: 500000,
};

// createProductController

describe("createProductController", () => {
	let mockSave;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
		mockSave = jest.fn().mockResolvedValue();
		productModel.mockImplementation(() => ({
			photo: { data: null, contentType: null },
			save: mockSave,
		}));
		slugify.mockReturnValue("test-product");
		fs.readFileSync.mockReturnValue(Buffer.from("fake-image"));
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	it.each([
		["name", { ...validFields, name: "" }, "Name is Required"],
		[
			"description",
			{ ...validFields, description: "" },
			"Description is Required",
		],
		["price", { ...validFields, price: "" }, "Price is Required"],
		["category", { ...validFields, category: "" }, "Category is Required"],
		["quantity", { ...validFields, quantity: "" }, "Quantity is Required"],
		["shipping", { ...validFields, shipping: "" }, "Shipping is Required"],
	])("returns 400 when %s is missing", async (_field, fields, errorMsg) => {
		// Arrange
		const req = { fields, files: { photo: validPhoto } };
		const res = makeRes();

		// Act
		await createProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith({ error: errorMsg });
	});

	it("returns 400 when photo is missing", async () => {
		// Arrange
		const req = { fields: validFields, files: {} };
		const res = makeRes();

		// Act
		await createProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith({ error: "photo is Required" });
	});

	it("returns 400 when photo exceeds 1mb", async () => {
		// Arrange
		const req = {
			fields: validFields,
			files: { photo: { ...validPhoto, size: 2000000 } },
		};
		const res = makeRes();

		// Act
		await createProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith({
			error: "photo should be less than 1mb",
		});
	});

	it("creates product and returns 201 on valid input", async () => {
		// Arrange
		const req = { fields: validFields, files: { photo: validPhoto } };
		const res = makeRes();

		// Act
		await createProductController(req, res);

		// Assert
		expect(productModel).toHaveBeenCalledWith({
			...validFields,
			slug: "test-product",
		});
		expect(fs.readFileSync).toHaveBeenCalledWith(validPhoto.path);
		expect(mockSave).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				message: "Product Created Successfully",
			}),
		);
	});

	it("returns 500 on database error", async () => {
		// Arrange
		mockSave.mockRejectedValueOnce(new Error("DB Error"));
		const req = { fields: validFields, files: { photo: validPhoto } };
		const res = makeRes();

		// Act
		await createProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				message: "Error in creating product",
			}),
		);
	});
});

// deleteProductController

describe("deleteProductController", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	it("deletes product and returns 200 on success", async () => {
		// Arrange
		productModel.findByIdAndDelete.mockReturnValue({
			select: jest.fn().mockResolvedValue({}),
		});
		const req = { params: { pid: "prod123" } };
		const res = makeRes();

		// Act
		await deleteProductController(req, res);

		// Assert
		expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("prod123");
		expect(res.status).toHaveBeenCalledWith(200);
		expect(res.send).toHaveBeenCalledWith({
			success: true,
			message: "Product Deleted successfully",
		});
	});

	it("returns 500 on database error", async () => {
		// Arrange
		productModel.findByIdAndDelete.mockReturnValue({
			select: jest.fn().mockRejectedValue(new Error("DB Error")),
		});
		const req = { params: { pid: "prod123" } };
		const res = makeRes();

		// Act
		await deleteProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				message: "Error while deleting product",
			}),
		);
	});
});

// updateProductController

describe("updateProductController", () => {
	let mockSave;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
		mockSave = jest.fn().mockResolvedValue();
		productModel.findByIdAndUpdate.mockResolvedValue({
			photo: { data: null, contentType: null },
			save: mockSave,
		});
		slugify.mockReturnValue("test-product");
		fs.readFileSync.mockReturnValue(Buffer.from("fake-image"));
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	it.each([
		["name", { ...validFields, name: "" }, "Name is Required"],
		[
			"description",
			{ ...validFields, description: "" },
			"Description is Required",
		],
		["price", { ...validFields, price: "" }, "Price is Required"],
		["category", { ...validFields, category: "" }, "Category is Required"],
		["quantity", { ...validFields, quantity: "" }, "Quantity is Required"],
		["shipping", { ...validFields, shipping: "" }, "Shipping is Required"],
	])("returns 400 when %s is missing", async (_field, fields, errorMsg) => {
		// Arrange
		const req = { fields, files: {}, params: { pid: "prod123" } };
		const res = makeRes();

		// Act
		await updateProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith({ error: errorMsg });
	});

	it("returns 400 when photo exceeds 1mb", async () => {
		// Arrange
		const req = {
			fields: validFields,
			files: { photo: { ...validPhoto, size: 2000000 } },
			params: { pid: "prod123" },
		};
		const res = makeRes();

		// Act
		await updateProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.send).toHaveBeenCalledWith({
			error: "Photo is required and should be less then 1mb",
		});
	});

	it("updates product without photo and returns 201", async () => {
		// Arrange
		const req = {
			fields: validFields,
			files: {},
			params: { pid: "prod123" },
		};
		const res = makeRes();

		// Act
		await updateProductController(req, res);

		// Assert
		expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
			"prod123",
			{ ...validFields, slug: "test-product" },
			{ new: true },
		);
		expect(fs.readFileSync).not.toHaveBeenCalled();
		expect(mockSave).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				message: "Product Updated Successfully",
			}),
		);
	});

	it("updates product with photo and returns 201", async () => {
		// Arrange
		const req = {
			fields: validFields,
			files: { photo: validPhoto },
			params: { pid: "prod123" },
		};
		const res = makeRes();

		// Act
		await updateProductController(req, res);

		// Assert
		expect(fs.readFileSync).toHaveBeenCalledWith(validPhoto.path);
		expect(mockSave).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: true,
				message: "Product Updated Successfully",
			}),
		);
	});

	it("returns 500 on database error", async () => {
		// Arrange
		productModel.findByIdAndUpdate.mockRejectedValueOnce(
			new Error("DB Error"),
		);
		const req = {
			fields: validFields,
			files: {},
			params: { pid: "prod123" },
		};
		const res = makeRes();

		// Act
		await updateProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(500);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				message: "Error in Update product",
			}),
		);
	});
});
