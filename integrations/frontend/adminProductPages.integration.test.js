// Seah Minlong, A0271643E
// Integration: CreateProduct.js + Products.js + productController.js + productModel.js
import React from "react";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import os from "os";
import toast from "react-hot-toast";
import axios from "axios";
import categoryModel from "../../models/categoryModel.js";
import productModel from "../../models/productModel.js";
import {
	createProductController,
	getProductController,
} from "../../controllers/productController.js";
import { categoryController } from "../../controllers/categoryController.js";
import CreateProduct from "../../client/src/pages/admin/CreateProduct.js";
import Products from "../../client/src/pages/admin/Products.js";

jest.mock("axios");
jest.mock("react-hot-toast");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
	const actual = jest.requireActual("react-router-dom");
	return {
		...actual,
		useNavigate: () => mockNavigate,
	};
});

jest.mock("../../client/src/components/Layout", () => ({ children }) => (
	<div>{children}</div>
));

jest.mock("../../client/src/components/AdminMenu", () => () => (
	<div>AdminMenu</div>
));

jest.mock("antd", () => {
	const Select = ({ children, onChange }) => (
		<select
			data-testid="antd-select"
			onChange={(e) => onChange?.(e.target.value)}
		>
			{children}
		</select>
	);
	Select.Option = ({ value, children }) => (
		<option value={value}>{children}</option>
	);
	return { Select };
});

// The following two helpers (callController and axiosResult) and the axios
// wiring in beforeEach were adapted from Claude Opus 4.
// Prompt: "Write helper functions that bridge mocked axios calls to real Express controller functions."

// Helper: calls a real controller with a constructed req/res and returns
// { status, body } so the axios mock can decide to resolve or reject.
const callController = async (controller, req) => {
	let statusCode = 200;
	let responseBody = {};
	const res = {
		status: jest.fn().mockImplementation((code) => {
			statusCode = code;
			return res;
		}),
		send: jest.fn().mockImplementation((body) => {
			responseBody = body;
			return res;
		}),
	};
	await controller(req, res);
	return { status: statusCode, body: responseBody };
};

// Helper: simulates real axios behavior — resolves for 2xx, rejects for non-2xx.
const axiosResult = ({ status, body }) => {
	if (status >= 200 && status < 300) {
		return Promise.resolve({ data: body, status });
	}
	return Promise.reject({ response: { data: body, status } });
};

// The following helper (formDataToReq) was adapted from Claude Opus 4.
// Prompt: "Write a helper that converts browser FormData entries into the
// formidable-style req.fields and req.files that createProductController
// expects"
//
// Helper: converts FormData (sent by CreateProduct.js) into the formidable-style
// req.fields and req.files that createProductController expects.
const formDataToReq = async (formData) => {
	const fields = {};
	const files = {};
	const tempPaths = [];

	for (const [key, value] of formData.entries()) {
		if (
			value &&
			typeof value === "object" &&
			typeof value.name === "string"
		) {
			const tempPath = path.join(
				os.tmpdir(),
				`test-${Date.now()}-${value.name}`,
			);
			// JSDOM's File doesn't support arrayBuffer(), so write placeholder bytes
			// that fs.readFileSync in the controller can read.
			const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
			fs.writeFileSync(tempPath, buffer);
			files[key] = {
				path: tempPath,
				type: value.type,
				size: buffer.length,
			};
			tempPaths.push(tempPath);
		} else {
			fields[key] = value;
		}
	}

	return { fields, files, tempPaths };
};

let mongoServer;
let testCategory;
let tempFiles = [];

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
	jest.clearAllMocks();
	jest.spyOn(console, "log").mockImplementation(() => {});
	tempFiles = [];

	// Seed a category for product creation
	testCategory = await categoryModel.create({
		name: "Electronics",
		slug: "electronics",
	});

	global.URL.createObjectURL = jest.fn(() => "blob:preview-url");
	global.URL.revokeObjectURL = jest.fn();

	// Wire axios methods to real controllers
	axios.get.mockImplementation(async (url) => {
		if (url === "/api/v1/category/get-category") {
			return axiosResult(await callController(categoryController, {}));
		}
		if (url === "/api/v1/product/get-product") {
			return axiosResult(await callController(getProductController, {}));
		}
		return Promise.reject(new Error(`Unhandled GET: ${url}`));
	});

	axios.post.mockImplementation(async (url, formData) => {
		if (url === "/api/v1/product/create-product") {
			const { fields, files, tempPaths } = await formDataToReq(formData);
			tempFiles.push(...tempPaths);
			return axiosResult(
				await callController(createProductController, {
					fields,
					files,
				}),
			);
		}
		return Promise.reject(new Error(`Unhandled POST: ${url}`));
	});
});

afterEach(() => {
	console.log.mockRestore();
	for (const p of tempFiles) {
		if (fs.existsSync(p)) fs.unlinkSync(p);
	}
});

const renderCreateProduct = async () => {
	render(
		<MemoryRouter>
			<CreateProduct />
		</MemoryRouter>,
	);
	await waitFor(() => expect(axios.get).toHaveBeenCalled());
};

const renderProducts = async () => {
	render(
		<MemoryRouter>
			<Products />
		</MemoryRouter>,
	);
	await waitFor(() => expect(axios.get).toHaveBeenCalled());
};

// Helper: fills the CreateProduct form with all required fields and submits.
const fillAndSubmitProductForm = async () => {
	const file = new File(["fake-image-data"], "test.png", {
		type: "image/png",
	});
	const fileInput = screen.getByLabelText(/upload photo/i, {
		selector: "input",
	});
	fireEvent.change(fileInput, { target: { files: [file] } });

	fireEvent.change(screen.getByPlaceholderText(/write a name/i), {
		target: { value: "Test Widget" },
	});
	fireEvent.change(screen.getByPlaceholderText(/write a description/i), {
		target: { value: "A test product" },
	});
	fireEvent.change(screen.getByPlaceholderText(/write a price/i), {
		target: { value: "49" },
	});
	fireEvent.change(screen.getByPlaceholderText(/write a quantity/i), {
		target: { value: "10" },
	});

	const [categorySelect, shippingSelect] =
		screen.getAllByTestId("antd-select");
	fireEvent.change(categorySelect, {
		target: { value: testCategory._id.toString() },
	});
	fireEvent.change(shippingSelect, { target: { value: "1" } });

	fireEvent.click(screen.getByRole("button", { name: /create product/i }));
};

describe("CreateProduct.js + Products.js + productController + productModel integration", () => {
	it("renders seeded categories from the real DB in the category dropdown on mount", async () => {
		// Arrange + Act
		await renderCreateProduct();

		// Assert
		expect(await screen.findByText("Electronics")).toBeInTheDocument();
	});

	it("creates a product via the form and persists it in the real DB", async () => {
		// Arrange
		await renderCreateProduct();
		await screen.findByText("Electronics");

		// Act
		await fillAndSubmitProductForm();

		// Assert
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Product Created Successfully",
			);
		});
		expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");

		const saved = await productModel.findOne({ name: "Test Widget" });
		expect(saved).not.toBeNull();
		expect(saved.description).toBe("A test product");
		expect(saved.price).toBe(49);
		expect(saved.category.toString()).toBe(testCategory._id.toString());
	});

	it("renders a previously created product in the Products.js listing", async () => {
		// Arrange
		await productModel.create({
			name: "Seeded Product",
			slug: "seeded-product",
			description: "A seeded product",
			price: 25,
			category: testCategory._id,
			quantity: 5,
		});

		// Act
		await renderProducts();

		// Assert
		expect(await screen.findByText("Seeded Product")).toBeInTheDocument();
		expect(screen.getByText("A seeded product")).toBeInTheDocument();
	});

	it("shows a validation error when a required field is missing and does not persist", async () => {
		// Arrange
		await renderCreateProduct();
		await screen.findByText("Electronics");

		// Act — submit without filling any fields
		fireEvent.click(
			screen.getByRole("button", { name: /create product/i }),
		);

		// Assert
		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Name is Required");
		});
		expect(mockNavigate).not.toHaveBeenCalled();

		const count = await productModel.countDocuments({});
		expect(count).toBe(0);
	});

	it("product created via CreateProduct.js form appears in Products.js", async () => {
		// Arrange — create via UI
		await renderCreateProduct();
		await screen.findByText("Electronics");
		await fillAndSubmitProductForm();
		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Product Created Successfully",
			);
		});

		// Act — unmount CreateProduct, then render Products page
		cleanup();
		jest.clearAllMocks();
		await renderProducts();

		// Assert
		expect(await screen.findByText("Test Widget")).toBeInTheDocument();
		expect(screen.getByText("A test product")).toBeInTheDocument();
	});
});
