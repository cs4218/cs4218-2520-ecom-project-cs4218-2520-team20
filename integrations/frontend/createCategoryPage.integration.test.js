// Seah Minlong, A0271643E
// Integration: CreateCategory.js + CategoryForm.js + categoryController.js + categoryModel.js
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import mongoose from "mongoose";
import toast from "react-hot-toast";
import axios from "axios";
import categoryModel from "../../models/categoryModel.js";
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  categoryController,
} from "../../controllers/categoryController.js";
import CreateCategory from "../../client/src/pages/Admin/CreateCategory.js";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../client/src/components/Layout", () => ({ children }) => (
  <div>{children}</div>
));

jest.mock("../../client/src/components/AdminMenu", () => () => (
  <div>AdminMenu</div>
));

jest.mock("antd", () => ({
  Modal: ({ onCancel, visible, open, children }) => {
    if (!visible && !open) return null;
    return (
      <div data-testid="modal">
        <button onClick={onCancel} aria-label="Close Modal">
          X
        </button>
        {children}
      </div>
    );
  },
}));

// The following two helpers (callController and axiosResult) and the axios
// wiring in beforeEach were adapted from Claude Opus 4.
// Prompt: "Write helper functions that bridge mocked axios calls to real
// Express controller functions by constructing req/res objects, capturing the
// status and body, and resolving or rejecting like real axios based on the
// status code."

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

let mongoServer;

beforeAll(async () => {
  // MongoMemoryServer is injected via FixJSDOMEnvironment to avoid ESM parse
  // errors when importing mongodb-memory-server directly in JSDOM.
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await categoryModel.deleteMany({});
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation(() => {});

  // Wire axios methods to real controllers
  axios.get.mockImplementation(async (url) => {
    if (url === "/api/v1/category/get-category") {
      return axiosResult(await callController(categoryController, {}));
    }
    return Promise.reject(new Error(`Unhandled GET: ${url}`));
  });

  axios.post.mockImplementation(async (url, data) => {
    if (url === "/api/v1/category/create-category") {
      return axiosResult(
        await callController(createCategoryController, { body: data })
      );
    }
    return Promise.reject(new Error(`Unhandled POST: ${url}`));
  });

  axios.put.mockImplementation(async (url, data) => {
    if (url.startsWith("/api/v1/category/update-category/")) {
      const id = url.split("/").pop();
      return axiosResult(
        await callController(updateCategoryController, {
          body: data,
          params: { id },
        })
      );
    }
    return Promise.reject(new Error(`Unhandled PUT: ${url}`));
  });

  axios.delete.mockImplementation(async (url) => {
    if (url.startsWith("/api/v1/category/delete-category/")) {
      const id = url.split("/").pop();
      return axiosResult(
        await callController(deleteCategoryController, { params: { id } })
      );
    }
    return Promise.reject(new Error(`Unhandled DELETE: ${url}`));
  });
});

afterEach(() => {
  console.log.mockRestore();
});

const renderPage = async () => {
  render(
    <MemoryRouter>
      <CreateCategory />
    </MemoryRouter>
  );
  // Wait for the initial getAllCategory fetch to complete
  await waitFor(() => expect(axios.get).toHaveBeenCalled());
};

describe("CreateCategory.js + categoryController + categoryModel integration", () => {
  it("renders seeded categories from the real DB on mount", async () => {
    // Arrange
    await categoryModel.create([
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing", slug: "clothing" },
    ]);

    // Act
    await renderPage();

    // Assert
    expect(await screen.findByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Clothing")).toBeInTheDocument();
  });

  it("creates a category via the form and it appears in the category list", async () => {
    // Arrange
    await renderPage();

    // Act
    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: "Electronics" },
    });
    fireEvent.click(screen.getAllByText("Submit")[0]);

    // Assert
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Electronics is created");
    });
    expect(await screen.findByText("Electronics")).toBeInTheDocument();

    const saved = await categoryModel.findOne({ name: "Electronics" });
    expect(saved).not.toBeNull();
    expect(saved.slug).toBe("electronics");
  });

  it("shows an error when submitting a duplicate category name via the form", async () => {
    // Arrange
    await categoryModel.create({ name: "Electronics", slug: "electronics" });
    await renderPage();
    await screen.findByText("Electronics");

    // Act
    fireEvent.change(screen.getByPlaceholderText("Enter new category"), {
      target: { value: "Electronics" },
    });
    fireEvent.click(screen.getAllByText("Submit")[0]);

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Category Already Exists");
    });

    const count = await categoryModel.countDocuments({ name: "Electronics" });
    expect(count).toBe(1);
  });

  it("updates a category via the edit modal and persists the change to the DB", async () => {
    // Arrange
    await categoryModel.create({ name: "Electronics", slug: "electronics" });
    await renderPage();
    await screen.findByText("Electronics");

    // Act — open modal, change name, submit
    fireEvent.click(screen.getByText("Edit"));
    await screen.findByTestId("modal");

    const inputs = screen.getAllByPlaceholderText("Enter new category");
    const modalInput = inputs[1];
    fireEvent.change(modalInput, { target: { value: "Gadgets" } });

    const submitBtns = screen.getAllByText("Submit");
    fireEvent.click(submitBtns[1]);

    // Assert
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Gadgets is updated");
    });
    expect(await screen.findByText("Gadgets")).toBeInTheDocument();
    expect(screen.queryByText("Electronics")).not.toBeInTheDocument();

    const updated = await categoryModel.findOne({ name: "Gadgets" });
    expect(updated).not.toBeNull();
    expect(updated.slug).toBe("gadgets");
  });

  it("deletes a category via the delete button and removes it from the DB", async () => {
    // Arrange
    await categoryModel.create({ name: "Electronics", slug: "electronics" });
    await renderPage();
    await screen.findByText("Electronics");

    // Act
    fireEvent.click(screen.getByText("Delete"));

    // Assert
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("category is deleted");
    });
    await waitFor(() => {
      expect(screen.queryByText("Electronics")).not.toBeInTheDocument();
    });

    const gone = await categoryModel.findOne({ name: "Electronics" });
    expect(gone).toBeNull();
  });

  it("shows an error when updating to a name that already exists", async () => {
    // Arrange
    await categoryModel.create([
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing", slug: "clothing" },
    ]);
    await renderPage();
    await screen.findByText("Electronics");

    // Act — try to rename Electronics to Clothing
    const editBtns = screen.getAllByText("Edit");
    fireEvent.click(editBtns[0]);
    await screen.findByTestId("modal");

    const inputs = screen.getAllByPlaceholderText("Enter new category");
    const modalInput = inputs[1];
    fireEvent.change(modalInput, { target: { value: "Clothing" } });

    const submitBtns = screen.getAllByText("Submit");
    fireEvent.click(submitBtns[1]);

    // Assert
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Category Already Exists");
    });

    const count = await categoryModel.countDocuments({ name: "Electronics" });
    expect(count).toBe(1);
  });
});
