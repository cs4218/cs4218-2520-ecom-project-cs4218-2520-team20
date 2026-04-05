import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import ProductDetails from "./ProductDetails";

jest.mock("axios");

const mockSetCart = jest.fn();
jest.mock("../context/cart", () => ({
  useCart: () => [[], mockSetCart],
}));

const mockNavigate = jest.fn();
let mockSlug = "test-product";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ slug: mockSlug }),
  useNavigate: () => mockNavigate,
}));

jest.mock("../components/Layout", () => ({ children }) => (
  <div data-testid="layout">{children}</div>
));

jest.mock("../styles/ProductDetailsStyles.css", () => {}, { virtual: true });

const renderAndSettle = async () => {
  await act(async () => {
    render(
      <MemoryRouter>
        <ProductDetails />
      </MemoryRouter>
    );
  });
};

const mockProduct = {
  _id: "prod-1",
  name: "Test Widget",
  description: "A really nice widget",
  price: 49.99,
  slug: "test-widget",
  category: { _id: "cat-1", name: "Gadgets" },
};

const mockRelated = [
  {
    _id: "prod-2",
    name: "Related Widget",
    description:
      "Another nice widget with a long description that should be truncated",
    price: 29.99,
    slug: "related-widget",
    category: { _id: "cat-1", name: "Gadgets" },
  },
];

describe("ProductDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSlug = "test-product";
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  describe("Component rendering", () => {
    // Alexander Setyawan, A0257149W
    beforeEach(() => {
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });
    });

    it("renders inside Layout", async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      expect(screen.getByTestId("layout")).toBeInTheDocument();
    });

    it('renders the "Product Details" heading', async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      expect(
        screen.getByRole("heading", { name: /product details/i })
      ).toBeInTheDocument();
    });

    it("displays the product name after fetch", async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      expect(screen.getByText(/test widget/i)).toBeInTheDocument();
    });

    it("displays the product description after fetch", async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      expect(screen.getByText(/a really nice widget/i)).toBeInTheDocument();
    });

    it("displays the formatted product price after fetch", async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      expect(screen.getByText(/\$49\.99/)).toBeInTheDocument();
    });

    it("displays the product category name after fetch", async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      expect(screen.getByText(/gadgets/i)).toBeInTheDocument();
    });

    it("renders the product image with correct src and alt", async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      const img = screen.getByAltText("Test Widget");
      expect(img).toBeInTheDocument();
      expect(img.src).toContain(`/api/v1/product/product-photo/prod-1`);
    });

    it('renders the "ADD TO CART" button', async () => {
      // Arrange / Act
      await renderAndSettle();

      // Assert
      expect(
        screen.getByTestId("product-details-add-to-cart-btn-test-widget")
      ).toBeInTheDocument();
    });
  });

  describe("API calls on mount", () => {
    // Alexander Setyawan, A0257149W
    it("calls the get-product endpoint with the slug from params", async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      // Act
      await renderAndSettle();

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/get-product/test-product`
      );
    });

    it("calls the related-product endpoint with the correct pid and cid", async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      // Act
      await renderAndSettle();

      // Assert
      expect(axios.get).toHaveBeenCalledWith(
        `/api/v1/product/related-product/prod-1/cat-1`
      );
    });

    it("does not call any API when slug is absent", async () => {
      // Arrange
      mockSlug = undefined;

      // Act
      await renderAndSettle();

      // Assert
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe("Similar products section", () => {
    // Alexander Setyawan, A0257149W
    it('shows "No Similar Products found" when related list is empty', async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: [] } });

      // Act
      await renderAndSettle();

      // Assert
      expect(
        screen.getByText(/no similar products found/i)
      ).toBeInTheDocument();
    });

    it("does not show the empty-state message when related products exist", async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });

      // Act
      await renderAndSettle();

      // Assert
      expect(
        screen.queryByText(/no similar products found/i)
      ).not.toBeInTheDocument();
    });

    it("renders the name of each related product", async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });

      // Act
      await renderAndSettle();

      // Assert
      expect(screen.getByText("Related Widget")).toBeInTheDocument();
    });

    it("renders the formatted price of each related product", async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });

      // Act
      await renderAndSettle();

      // Assert
      expect(screen.getByText(/\$29\.99/)).toBeInTheDocument();
    });

    it("truncates the description of each related product to 60 characters", async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });

      // Act
      await renderAndSettle();

      // Assert
      const truncated = mockRelated[0].description.substring(0, 60) + "...";
      expect(screen.getByText(truncated)).toBeInTheDocument();
    });

    it("renders the image for each related product with correct src", async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });

      // Act
      await renderAndSettle();

      // Assert
      const img = screen.getByAltText("Related Widget");
      expect(img.src).toContain(`/api/v1/product/product-photo/prod-2`);
    });

    it('renders a "More Details" button for each related product', async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });

      // Act
      await renderAndSettle();

      // Assert
      expect(
        screen.getByRole("button", { name: /more details/i })
      ).toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    // Alexander Setyawan, A0257149W
    it('navigates to the related product slug when "More Details" is clicked', async () => {
      // Arrange
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockResolvedValueOnce({ data: { products: mockRelated } });

      await renderAndSettle();

      // Act
      await userEvent.click(
        screen.getByRole("button", { name: /more details/i })
      );

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(
        `/product/${mockRelated[0].slug}`
      );
    });
  });

  describe("API error handling", () => {
    // Alexander Setyawan, A0257149W
    it("logs error and does not crash when getProduct fails", async () => {
      // Arrange
      const error = new Error("Network error");
      axios.get.mockRejectedValueOnce(error);

      // Act
      await renderAndSettle();

      // Assert
      expect(console.log).toHaveBeenCalledWith(error);
      expect(
        screen.getByRole("heading", { name: /product details/i })
      ).toBeInTheDocument();
    });

    it("logs error and does not crash when getSimilarProduct fails", async () => {
      // Arrange
      const error = new Error("Related API error");
      axios.get
        .mockResolvedValueOnce({ data: { product: mockProduct } })
        .mockRejectedValueOnce(error);

      // Act
      await renderAndSettle();

      // Assert
      expect(console.log).toHaveBeenCalledWith(error);
      expect(screen.getByText(/test widget/i)).toBeInTheDocument();
    });
  });
});
