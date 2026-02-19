// Seah Minlong, A0271643E
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import {
	createProductController,
	deleteProductController,
	updateProductController,
	braintreeTokenController,
	brainTreePaymentController,
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

jest.mock("../models/orderModel.js", () => {
	const mockSaveOrder = jest.fn().mockResolvedValue({});
	const MockOrderModel = jest.fn(() => ({ save: mockSaveOrder }));
	MockOrderModel._mockSave = mockSaveOrder;
	return { __esModule: true, default: MockOrderModel };
});
jest.mock("fs");
jest.mock("slugify");
jest.mock("braintree", () => {
	const mockGenerate = jest.fn();
	const mockSale = jest.fn();
	const _gateway = {
		clientToken: { generate: mockGenerate },
		transaction: { sale: mockSale },
	};
	return {
		BraintreeGateway: jest.fn(() => _gateway),
		Environment: { Sandbox: "sandbox" },
		_gateway,
	};
});
jest.mock("dotenv", () => ({ config: jest.fn() }));

const makeRes = () => {
	const res = {};
	res.status = jest.fn().mockReturnValue(res);
	res.send = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
};

const SUCCESS_RESPONSE = 200;
const CREATED_RESPONSE = 201;
const BAD_REQUEST_RESPONSE = 400;
const ERROR_RESPONSE = 500;

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
		expect(res.status).toHaveBeenCalledWith(BAD_REQUEST_RESPONSE);
		expect(res.send).toHaveBeenCalledWith({ error: errorMsg });
	});

	it("returns 400 when photo is missing", async () => {
		// Arrange
		const req = { fields: validFields, files: {} };
		const res = makeRes();

		// Act
		await createProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(BAD_REQUEST_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(BAD_REQUEST_RESPONSE);
		expect(res.send).toHaveBeenCalledWith({
			error: "photo should be less than 1mb",
		});
	});

	it("constructs product model and reads photo on valid create", async () => {
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
	});

	it("returns 201 with success response on valid create", async () => {
		// Arrange
		const req = { fields: validFields, files: { photo: validPhoto } };
		const res = makeRes();

		// Act
		await createProductController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(CREATED_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(SUCCESS_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(BAD_REQUEST_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(BAD_REQUEST_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(CREATED_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(CREATED_RESPONSE);
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
		expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				message: "Error in Update product",
			}),
		);
	});
});

// braintreeTokenController

describe("braintreeTokenController", () => {
	let mockGenerate;

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
		mockGenerate = braintree._gateway.clientToken.generate;
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	it("calls clientToken.generate with empty options and a callback", async () => {
		// Arrange
		mockGenerate.mockImplementation((_opts, cb) =>
			cb(null, { clientToken: "tok" }),
		);
		const req = {};
		const res = makeRes();

		// Act
		await braintreeTokenController(req, res);

		// Assert
		expect(mockGenerate).toHaveBeenCalledWith({}, expect.any(Function));
	});

	it("responds with implicit 200 on success", async () => {
		// Arrange
		mockGenerate.mockImplementation((_opts, cb) =>
			cb(null, { clientToken: "tok" }),
		);
		const req = {};
		const res = makeRes();

		// Act
		await braintreeTokenController(req, res);

		// Assert
		expect(res.status).not.toHaveBeenCalled();
	});

	it("sends the gateway response to the client on success", async () => {
		// Arrange
		const tokenResponse = { clientToken: "tok-abc" };
		mockGenerate.mockImplementation((_opts, cb) => cb(null, tokenResponse));
		const req = {};
		const res = makeRes();

		// Act
		await braintreeTokenController(req, res);

		// Assert
		expect(res.send).toHaveBeenCalledWith(tokenResponse);
	});

	it("responds with 500 when the callback receives an error", async () => {
		// Arrange
		const gatewayErr = new Error("Token generation failed");
		mockGenerate.mockImplementation((_opts, cb) => cb(gatewayErr, null));
		const req = {};
		const res = makeRes();

		// Act
		await braintreeTokenController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
		expect(res.send).toHaveBeenCalledWith(gatewayErr);
	});

	it("responds with 500 when gateway throws synchronously", async () => {
		// Arrange
		mockGenerate.mockImplementation(() => {
			throw new Error("Unexpected sync error");
		});
		const req = {};
		const res = makeRes();

		// Act
		await braintreeTokenController(req, res);

		// Assert
		expect(console.log).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
		expect(res.send).toHaveBeenCalledWith(
			expect.objectContaining({
				success: false,
				message: "Error while generating token",
			}),
		);
	});
});

// brainTreePaymentController

describe("brainTreePaymentController", () => {
	let mockSale;
	const cart = [
		{ _id: "p1", name: "Item A", price: 20 },
		{ _id: "p2", name: "Item B", price: 30 },
	];
	const nonce = "payment-nonce-xyz";
	const userId = "user-001";

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
		mockSale = braintree._gateway.transaction.sale;
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	it("calls transaction.sale with summed cart total, nonce, and submitForSettlement", async () => {
		// Arrange
		mockSale.mockImplementation((_opts, cb) => cb(null, { id: "txn1" }));
		const req = { body: { nonce, cart }, user: { _id: userId } };
		const res = makeRes();

		// Act
		await brainTreePaymentController(req, res);

		// Assert
		expect(mockSale).toHaveBeenCalledWith(
			{
				amount: 50,
				paymentMethodNonce: nonce,
				options: { submitForSettlement: true },
			},
			expect.any(Function),
		);
	});

	it("responds with implicit 200 on success", async () => {
		// Arrange
		mockSale.mockImplementation((_opts, cb) => cb(null, { id: "txn1" }));
		const req = { body: { nonce, cart }, user: { _id: userId } };
		const res = makeRes();

		// Act
		await brainTreePaymentController(req, res);

		// Assert
		expect(res.status).not.toHaveBeenCalled();
	});

	it("responds with { ok: true } on a successful transaction", async () => {
		// Arrange
		mockSale.mockImplementation((_opts, cb) => cb(null, { id: "txn1" }));
		const req = { body: { nonce, cart }, user: { _id: userId } };
		const res = makeRes();

		// Act
		await brainTreePaymentController(req, res);

		// Assert
		expect(res.json).toHaveBeenCalledWith({ ok: true });
	});

	it("saves an order with the correct products, payment, and buyer on success", async () => {
		// Arrange
		const transactionResult = { id: "txn1" };
		mockSale.mockImplementation((_opts, cb) => cb(null, transactionResult));
		const req = { body: { nonce, cart }, user: { _id: userId } };
		const res = makeRes();

		// Act
		await brainTreePaymentController(req, res);

		// Assert
		expect(orderModel).toHaveBeenCalledWith({
			products: cart,
			payment: transactionResult,
			buyer: userId,
		});
		expect(orderModel._mockSave).toHaveBeenCalled();
	});

	it("responds with 500 when the transaction fails", async () => {
		// Arrange
		const transactionError = new Error("Transaction declined");
		mockSale.mockImplementation((_opts, cb) => cb(transactionError, null));
		const req = { body: { nonce, cart }, user: { _id: userId } };
		const res = makeRes();

		// Act
		await brainTreePaymentController(req, res);

		// Assert
		expect(res.status).toHaveBeenCalledWith(ERROR_RESPONSE);
		expect(res.send).toHaveBeenCalledWith(transactionError);
	});
});
