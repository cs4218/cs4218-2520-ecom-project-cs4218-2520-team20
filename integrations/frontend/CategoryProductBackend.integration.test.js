// Alexander Setyawan, A0257149W
// Integration: CategoryProduct.js + productRoutes.js + productCategoryController + productModel.js + categoryModel.js

import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";
import CategoryProduct from "@client/pages/CategoryProduct.js";
import productModel from "@server/models/productModel.js";
import categoryModel from "@server/models/categoryModel.js";
import { productCategoryController } from "@server/controllers/productController.js";

const MongoMemoryServer = global.MongoMemoryServer

jest.mock("axios");

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("@client/components/Layout", () => ({ children }) => <div>{children}</div>);

// Helper: calls the real controller with constructed req/res
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

// Wire axios.get to call the real controller
axios.get.mockImplementation(async (url) => {
  const slugMatch = url.match(/\/api\/v1\/product\/product-category\/(.+)/);
  if (slugMatch) {
    const slug = slugMatch[1];
    const { body, status } = await callController(productCategoryController, { params: { slug } });
    if (status >= 200 && status < 300) return { data: body, status };
    throw { response: { data: body, status } };
  }
  return Promise.reject(new Error(`Unhandled GET: ${url}`));
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

beforeEach(async () => {
  await productModel.deleteMany({});
  await categoryModel.deleteMany({});
  jest.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// Helper: render CategoryProduct.js with slug param
const renderCategoryPage = async (slug) => {
  render(
    <MemoryRouter initialEntries={[`/category/${slug}`]}>
      <Routes>
        <Route path="/category/:slug" element={<CategoryProduct />} />
      </Routes>
    </MemoryRouter>
  );
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
};

describe("CategoryProduct.js + productCategoryController Integration", () => {
  test("renders category name and one product", async () => {
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

    await renderCategoryPage("electronics");

    expect(await screen.findByText("Category - Electronics")).toBeInTheDocument();
    expect(screen.getByText("1 result found")).toBeInTheDocument();
    expect(screen.getByText("Laptop")).toBeInTheDocument();
    expect(screen.getByText("$1,500.00")).toBeInTheDocument();
    expect(screen.getByText(/High-end laptop/i)).toBeInTheDocument();
  });

  test("renders multiple products", async () => {
    const category = await categoryModel.create({ name: "Phones", slug: "phones" });

    const products = [
      { name: "iPhone", slug: "iphone", description: "Apple phone", price: 1000, category: category._id, quantity: 5, shipping: true },
      { name: "Samsung Galaxy", slug: "samsung-galaxy", description: "Samsung phone", price: 900, category: category._id, quantity: 10, shipping: true },
    ];

    await productModel.insertMany(products);

    await renderCategoryPage("phones");

    expect(await screen.findByText("Category - Phones")).toBeInTheDocument();
    expect(screen.getByText("2 result found")).toBeInTheDocument();
    expect(screen.getByText("iPhone")).toBeInTheDocument();
    expect(screen.getByText("Samsung Galaxy")).toBeInTheDocument();
  });

  test("renders empty when category exists but has no products", async () => {
    await categoryModel.create({ name: "Books", slug: "books" });

    await renderCategoryPage("books");

    expect(await screen.findByText("Category - Books")).toBeInTheDocument();
    expect(screen.getByText("0 result found")).toBeInTheDocument();
  });

  test("handles category with special characters in slug", async () => {
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

    await renderCategoryPage("café-bar");

    expect(await screen.findByText("Category - Café & Bar")).toBeInTheDocument();
    expect(screen.getByText("1 result found")).toBeInTheDocument();
    expect(screen.getByText("Coffee Maker")).toBeInTheDocument();
  });
});