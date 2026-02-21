// Kaw Jun Rei Dylan, A0252791Y

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import { Prices } from "../components/Prices";
import HomePage from "./HomePage";

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const axios = require("axios");

jest.mock("react-hot-toast", () => {
  const mockSuccess = jest.fn();
  const mockError = jest.fn();
  return {
    __esModule: true,
    default: {
      success: mockSuccess,
      error: mockError,
    },
    success: mockSuccess,
    error: mockError,
    Toaster: () => null,
  };
});

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: () => mockUseCart(),
}));

jest.mock("../components/Layout", () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="layout-mock">{children}</div>,
  };
});

jest.mock("react-icons/ai", () => ({
  AiOutlineReload: () => <span data-testid="reload-icon" />,
}));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const reloadMock = jest.fn();
Object.defineProperty(window, "location", {
  value: {
    ...window.location,
    reload: reloadMock,
  },
  writable: true,
});

window.matchMedia =
  window.matchMedia ||
  function matchMediaMock() {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    };
  };

const mockCategories = [
  { _id: "cat-1", name: "Gadgets", slug: "gadgets" },
  { _id: "cat-2", name: "Accessories", slug: "accessories" },
];

const mockProductsPageOne = [
  {
    _id: "prod-1",
    name: "Smart Speaker",
    slug: "smart-speaker",
    price: 199,
    description: "Compact smart speaker with assistant integration.",
    category: "cat-1",
  },
  {
    _id: "prod-2",
    name: "T-shirt",
    slug: "t-shirt",
    price: 299,
    description: "Comfortable cotton t-shirt.",
    category: "cat-2",
  },
];

const mockProductsPageTwo = [
  {
    _id: "prod-3",
    name: "Smart Lamp",
    slug: "smart-lamp",
    price: 99,
    description: "Voice-controlled ambient smart lamp.",
    category: "cat-1",
  },
];

const setupAxiosGet = ({
  total = 2,
  pageMap = { 1: mockProductsPageOne, 2: mockProductsPageTwo },
} = {}) => {
  axios.get.mockImplementation((url) => {
    if (url === "/api/v1/category/get-category") {
      return Promise.resolve({
        data: { success: true, category: mockCategories },
      });
    }

    if (url === "/api/v1/product/product-count") {
      return Promise.resolve({ data: { total } });
    }

    const pageMatch = url.match(/\/api\/v1\/product\/product-list\/(\d+)/);
    if (pageMatch) {
      const pageNumber = Number(pageMatch[1]);
      return Promise.resolve({ data: { products: pageMap[pageNumber] || [] } });
    }

    return Promise.resolve({ data: {} });
  });
};

/*
Teaching checklist (reuse on any component):
1. Identify observable behaviors (e.g., initial fetch, navigation, cart saves).
2. For each behavior, outline Arrange-Act-Assert steps before writing code.
3. Mock every dependency that would otherwise reach outside the component
  (network, context, routing) so the test stays deterministic.
4. Use fixtures to keep test data readable and avoid copy/paste.
5. Keep each test laser-focused on a single user-visible outcome.
*/

describe("HomePage", () => {
  let setCartMock;

  beforeEach(() => {
    jest.clearAllMocks();
    setCartMock = jest.fn();
    mockUseCart.mockReturnValue([[], setCartMock]);
    localStorageMock.getItem.mockReturnValue(null);
    reloadMock.mockClear();
    setupAxiosGet();
  });

  it("renders the category filters", async () => {
    // Arrange: render after axios mocks are ready.
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Assert: all fetched category names render as checkbox labels.
    expect(
      await screen.findByRole("checkbox", { name: "Gadgets" })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("checkbox", { name: "Accessories" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    });
  });

  it("renders the price filters", () => {
    // Arrange: price filters do not depend on API, so render immediately.
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Assert: each price range from Prices is visible as a radio option label.
    Prices.forEach((priceRange) => {
      expect(screen.getByLabelText(priceRange.name)).toBeInTheDocument();
    });
  });

  it("renders the products", async () => {
    // Arrange: render with default page-one products mocked.
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Assert: product cards appear once axios resolves.
    expect(await screen.findByText("Smart Speaker")).toBeInTheDocument();
    expect(await screen.findByText("T-shirt")).toBeInTheDocument();

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

  it("navigates to the product details page when More Details is clicked", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const detailButtons = await screen.findAllByRole("button", {
      name: /more details/i,
    });

    // Act: simulate the same click a user would perform in the UI.
    fireEvent.click(detailButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith("/product/smart-speaker");
  });

  it("adds a category to the filter payload when a checkbox is checked and renders filtered products", async () => {
    // Arrange: wait for categories to be rendered so we can interact with them.
    axios.post.mockResolvedValueOnce({
      data: { products: [mockProductsPageOne[0], mockProductsPageTwo[0]] },
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    const gadgetsCheckbox = await screen.findByRole("checkbox", {
      name: "Gadgets",
    });

    // Act: toggle a single category filter.
    fireEvent.click(gadgetsCheckbox);

    // Assert: axios.post receives the checked id and empty radio array.
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/product/product-filters",
        {
          checked: ["cat-1"],
          radio: [],
        }
      );
    });

    // Assert: UI updates to cat-1 filtered products.
    expect(await screen.findByText("Smart Speaker")).toBeInTheDocument();
    expect(await screen.findByText("Smart Lamp")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("T-shirt")).not.toBeInTheDocument();
    });
  });

  it("removes a category from filters when a checkbox is unchecked", async () => {
    // Arrange: render and wait for checkbox to be available.
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    const gadgetsCheckbox = await screen.findByRole("checkbox", {
      name: "Gadgets",
    });

    // Act: first check, then uncheck the same category.
    fireEvent.click(gadgetsCheckbox);
    fireEvent.click(gadgetsCheckbox);

    // Assert: category is unchecked and product list fetch runs again.
    expect(gadgetsCheckbox).not.toBeChecked();
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
    });
  });

  it("filters by price when a price radio is clicked", async () => {
    // Arrange: render and wait for price options.
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    const firstPriceRadio = await screen.findByLabelText("$0 to 19");

    // Act: click a price radio option.
    fireEvent.click(firstPriceRadio);

    // Assert: filter endpoint is called with empty checked and non-empty radio.
    expect(axios.post).toHaveBeenCalledWith("/api/v1/product/product-filters", {
      checked: [],
      radio: [0, 19],
    });
    const latestPostCall =
      axios.post.mock.calls[axios.post.mock.calls.length - 1];
    expect(latestPostCall[0]).toBe("/api/v1/product/product-filters");
    expect(latestPostCall[1].checked).toEqual([]);
    expect(latestPostCall[1].radio).toEqual([0, 19]);
  });

  it("resets filters by reloading the page", async () => {
    // Arrange: ensure categories render, then click reset filters.
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );
    await screen.findByRole("checkbox", { name: "Gadgets" });
    const resetButton = screen.getByRole("button", { name: /reset filters/i });

    // Act: trigger the reset button.
    fireEvent.click(resetButton);

    // Assert: current implementation reloads the page to clear state.
    expect(reloadMock).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/1");
  });

  it("adds a product to the cart and persists it", async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const addButtons = await screen.findAllByRole("button", {
      name: /add to cart/i,
    });

    // Act: mimic clicking the first Add to Cart button.
    fireEvent.click(addButtons[0]);

    // Assert: cart setter receives the new item, storage is synced, toast fires.
    expect(setCartMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ _id: "prod-1", name: "Smart Speaker" }),
      ])
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([mockProductsPageOne[0]])
    );
    expect(toast.success).toHaveBeenCalledWith("Item Added to cart");
  });

  it("loads the next page of products when Loadmore is clicked", async () => {
    setupAxiosGet({
      total: 4,
      pageMap: { 1: mockProductsPageOne, 2: mockProductsPageTwo },
    });

    render(<HomePage />);

    const loadMoreButton = await screen.findByRole("button", {
      name: /Load more/i,
    });

    // Act: clicking the button increments the internal page state.
    fireEvent.click(loadMoreButton);

    expect(axios.get).toHaveBeenCalledWith("/api/v1/product/product-list/2");
    expect(await screen.findByText("Smart Lamp")).toBeInTheDocument();
  });
});
