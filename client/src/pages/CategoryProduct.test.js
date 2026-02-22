import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import axios from "axios";
import CategoryProduct from "./CategoryProduct";

jest.mock("axios");

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));

jest.mock('../hooks/useCategory', () => ({
    __esModule: true, // importing useCategory via ES Module
    default: jest.fn(() => [])
  }));

describe("CategoryProduct Component", () => {
  const mockData = {
    products: [
      { 
        _id: "1", 
        name: "Product 1", 
        price: 100, 
        description: "This is a short description.", 
        slug: "product-1" 
      },
      { 
        _id: "2", 
        name: "Product 2", 
        price: 150, 
        description: "This is a long description that will be truncated after 60 characters. It should show only the first 60 characters.", 
        slug: "product-2" 
      },
    ],
    category: { name: "Category 1" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValueOnce({ data: mockData });
  });

  it("should call getPrductsByCat when slug changes", async () => { // Alexander Setyawan, A0257149W
    // Act
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith(
      "/api/v1/product/product-category/product-1"
    ));
  });

  it("should update products and category state after API call", async () => {
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const categoryText = screen.getByText(/Category - Category 1/i);
      const resultCountText = screen.getByText(/2 result found/i);
      const product1Text = screen.getByText(/Product 1/i);
      const product2Text = screen.getByText(/Product 2/i);

      expect(categoryText).toBeInTheDocument();
      expect(resultCountText).toBeInTheDocument();
      expect(product1Text).toBeInTheDocument();
      expect(product2Text).toBeInTheDocument();
    });
  });

  it("should handle API error gracefully", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    axios.get.mockRejectedValueOnce(new Error("API Error"));

    // Act
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    await waitFor(() => expect(screen.queryByText(/Category - Category 1/i)).not.toBeInTheDocument());
    expect(screen.queryByText(/2 result found/i)).not.toBeInTheDocument();
  });

  it("should not call API when slug is not available", async () => { // Alexander Setyawan, A0257149W
    // Act
    render(
      <MemoryRouter initialEntries={["/category/"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    // Assert
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should render the main container", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    // Act
    // await waitFor(() => expect(screen.getByText(/Category - Category 1/i)).toBeInTheDocument());

    // Assert
    const containerElement = screen.getByTestId('main-container');  // Assuming the main container has role="main" (as per semantic HTML practice)
    expect(containerElement).toBeInTheDocument();
  });

  it("should render the category name", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const text = screen.getByText(/Category - Category 1/i);
      
      // Assert
      expect(text).toBeInTheDocument();
    })
  });

  it("should render the number of results", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const text = screen.getByText(/2 result found/i);
      
      // Assert
      expect(text).toBeInTheDocument()
    });
  });

  it("should render the whole products.map section", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const product1 = screen.getByText(/Product 1/i);
      const product2 = screen.getByText(/Product 2/i);
      const price1 = screen.getByText(/\$100.00/i);
      const price2 = screen.getByText(/\$150.00/i);

      // Assert
      expect(product1).toBeInTheDocument();
      expect(product2).toBeInTheDocument();
      expect(price1).toBeInTheDocument();
      expect(price2).toBeInTheDocument();
    });
  });

  it("should ensure each product has the correct src attribute for the image", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const product1Image = screen.getByAltText("Product 1");
      const product2Image = screen.getByAltText("Product 2");

      // Assert
      expect(product1Image).toHaveAttribute('src', '/api/v1/product/product-photo/1');
      expect(product2Image).toHaveAttribute('src', '/api/v1/product/product-photo/2');
    });
  });

  it("should ensure each product card has the correct title", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const text1 = screen.getByText("Product 1")
      const text2 = screen.getByText("Product 2")
      
      // Assert
      expect(text1).toBeInTheDocument();
      expect(text2).toBeInTheDocument();
    });
  });

  it("should ensure the price is formatted correctly", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const text1 = screen.getByText("$100.00")
      const text2 = screen.getByText("$150.00")
      
      // Assert
      expect(text1).toBeInTheDocument();
      expect(text2).toBeInTheDocument();
    });
  });

  it("should ensure the description is rendered correctly", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const text = screen.getByText("This is a short description....");

      // Assert
      expect(text).toBeInTheDocument();
    });
  });

  it("should truncate long descriptions to 60 characters", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-2"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const truncatedDescription = "This is a long description that will be truncated after 60 c...";
      
      // Assert
      expect(screen.getByText(truncatedDescription)).toBeInTheDocument();
    });
  });

  it("should render the 'More Details' button", async () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <MemoryRouter initialEntries={["/category/product-1"]}>
        <Routes>
          <Route path="/category/:slug" element={<CategoryProduct />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      // Act
      const text = screen.getByTestId("product-1-button")

      // Assert
      expect(text).toBeInTheDocument();
    });
  });
});