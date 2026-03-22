// Alexander Setyawan, A0257149W
// ProductDetails.js + productRoutes.js + getSingleProductController + productModel.js

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";

import ProductDetails from "@client/pages/ProductDetails.js";
import productModel from "@server/models/productModel.js";
import categoryModel from "@server/models/categoryModel.js";
import {
  getSingleProductController,
} from "@server/controllers/productController.js";

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

jest.mock("@client/components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

// 🔥 SAME CONTROLLER BRIDGE PATTERN

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

const axiosResult = ({ status, body }) => {
  if (status >= 200 && status < 300) {
    return Promise.resolve({ data: body, status });
  }
  return Promise.reject({ response: { data: body, status } });
};

// ----------------------------------------

let mongoServer;
let category;

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
  jest.clearAllMocks();
});

const renderComponent = (slug = "test-product") =>
  render(
    <MemoryRouter initialEntries={[`/product/${slug}`]}>
      <Routes>
        <Route path="/product/:slug" element={<ProductDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe("ProductDetails + ProductRoutes + getSingleProductController integration", () => {
  beforeEach(async () => {
    category = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    // 🔥 AXIOS → CONTROLLER BRIDGE
    axios.get.mockImplementation(async (url) => {
      // SINGLE PRODUCT
      if (url.startsWith("/api/v1/product/get-product/")) {
        const slug = url.split("/").pop();

        return axiosResult(
          await callController(getSingleProductController, {
            params: { slug },
          })
        );
      }

      // RELATED PRODUCTS (keep simple or extend later)
      if (url.startsWith("/api/v1/product/related-product/")) {
        return axiosResult({
          status: 200,
          body: { products: [] },
        });
      }

      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });
  });

  // Displays formatted price
  test("renders formatted price correctly", async () => {
    await productModel.create({
      name: "Tablet",
      slug: "test-product",
      description: "Tablet",
      price: 1500,
      category: category._id,
      quantity: 2,
    });

    renderComponent();

    expect(await screen.findByText(/\$1,500/)).toBeInTheDocument();
  });

  // Displays populated category
  test("renders populated category name", async () => {
    await productModel.create({
      name: "Camera",
      slug: "test-product",
      description: "DSLR",
      price: 800,
      category: category._id,
      quantity: 1,
    });

    renderComponent();

    expect(await screen.findByText(/Electronics/i)).toBeInTheDocument();
  });

  // Handles product not found
  test("handles non-existent product gracefully", async () => {
    renderComponent("non-existent");

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });
  });

  // Slug must match exactly
  test("does not render product for incorrect slug", async () => {
    await productModel.create({
      name: "iPhone",
      slug: "iphone",
      description: "Phone",
      price: 1000,
      category: category._id,
      quantity: 5,
    });

    renderComponent("iphone-15");

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.queryByText("iPhone")).not.toBeInTheDocument();
  });

  // Calls correct API endpoint
  test("calls correct API endpoint with slug", async () => {
    renderComponent("my-slug");

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/get-product/my-slug"
      );
    });
  });

  // Shows no related products message
  test("shows 'No Similar Products found' when related products empty", async () => {
    await productModel.create({
      name: "TV",
      slug: "test-product",
      description: "Smart TV",
      price: 1200,
      category: category._id,
      quantity: 1,
    });

    renderComponent();

    expect(
      await screen.findByText(/No Similar Products found/i)
    ).toBeInTheDocument();
  });
});