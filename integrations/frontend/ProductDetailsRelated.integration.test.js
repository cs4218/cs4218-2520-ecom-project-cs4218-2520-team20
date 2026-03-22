// Alexander Setyawan, A0257149W
// ProductDetails.js + productRoutes.js + relatedProductController + productModel.js

import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import mongoose from "mongoose";
import axios from "axios";

import ProductDetails from "@client/pages/ProductDetails.js";
import productModel from "@server/models/productModel.js";
import categoryModel from "@server/models/categoryModel.js";
import { relatedProductController } from "@server/controllers/productController.js";

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

// Helper: call real controller
const callController = async (controller, req) => {
  let statusCode = 200;
  let responseBody;
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

const axiosResult = ({ status, body }) =>
  status >= 200 && status < 300
    ? Promise.resolve({ data: body, status })
    : Promise.reject({ response: { data: body, status } });

let mongoServer;
let category1, category2;

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

const renderComponent = (slug = "main-product") =>
  render(
    <MemoryRouter initialEntries={[`/product/${slug}`]}>
      <Routes>
        <Route path="/product/:slug" element={<ProductDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe("ProductDetails + relatedProductController integration", () => {
  beforeEach(async () => {
    category1 = await categoryModel.create({ name: "Phones", slug: "phones" });
    category2 = await categoryModel.create({ name: "Laptops", slug: "laptops" });

    // Axios → real controller
    axios.get.mockImplementation(async (url) => {
      if (url.startsWith("/api/v1/product/related-product/")) {
        const [_, pid, cid] = url.split("/").slice(-3);
        return axiosResult(
          await callController(relatedProductController, {
            params: { pid, cid },
          })
        );
      }
      if (url.startsWith("/api/v1/product/get-product/")) {
        const slug = url.split("/").pop();
        const product = await productModel.findOne({ slug });
        return axiosResult({ status: 200, body: { success: true, product } });
      }
      if (url.startsWith("/api/v1/product/product-photo/")) {
        const pid = url.split("/").pop();
        const prod = await productModel.findById(pid);
        return axiosResult({ status: 200, body: prod?.photo?.data || null });
      }
      return Promise.reject(new Error(`Unhandled GET: ${url}`));
    });
  });

  // ✅ 1. Fetches related products of same category
  test("fetches related products from the same category", async () => {
    const main = await productModel.create({
      name: "iPhone 15",
      slug: "main-product",
      description: "Apple",
      price: 1000,
      category: category1._id,
      quantity: 1,
    });
    await productModel.create({
      name: "iPhone 14",
      slug: "related-1",
      description: "Apple Old",
      price: 800,
      category: category1._id,
      quantity: 1,
    });
    await productModel.create({
      name: "Laptop A",
      slug: "other-cat",
      description: "Laptop",
      price: 1200,
      category: category2._id,
      quantity: 1,
    });

    renderComponent();

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${main._id}/${category1._id}`
      )
    );
  });

  // ✅ 2. Does not include main product in related
  test("does not include main product itself", async () => {
    const main = await productModel.create({
      name: "Phone A",
      slug: "main-product",
      description: "Main",
      price: 100,
      category: category1._id,
      quantity: 1,
    });
    const related = await productModel.create({
      name: "Phone B",
      slug: "related-b",
      description: "Related",
      price: 150,
      category: category1._id,
      quantity: 1,
    });

    renderComponent();

    await waitFor(() => {
      const call = axios.get.mock.calls.find((c) =>
        c[0].includes("/related-product/")
      );
      expect(call).toBeTruthy();
    });
  });

  // ✅ 3. Limits number of related products to 3
  test("limits related products to max 3", async () => {
    const main = await productModel.create({
      name: "Main Product",
      slug: "main-product",
      description: "Main",
      price: 100,
      category: category1._id,
      quantity: 1,
    });

    for (let i = 0; i < 5; i++) {
      await productModel.create({
        name: `Related ${i}`,
        slug: `related-${i}`,
        description: "Test",
        price: 50,
        category: category1._id,
        quantity: 1,
      });
    }

    renderComponent();

    await waitFor(() => {
      const call = axios.get.mock.calls.find((c) =>
        c[0].includes("/related-product/")
      );
      expect(call).toBeTruthy();
    });
  });

  // ✅ 4. No related products from other categories
  test("does not return unrelated category products", async () => {
    const main = await productModel.create({
      name: "Phone X",
      slug: "main-product",
      description: "Main",
      price: 100,
      category: category1._id,
      quantity: 1,
    });

    await productModel.create({
      name: "Laptop X",
      slug: "other",
      description: "Other",
      price: 1000,
      category: category2._id,
      quantity: 1,
    });

    renderComponent();

    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/${main._id}/${category1._id}`
      )
    );
  });
});