import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Search from "./Search";
import { useSearch } from "../context/search";

jest.mock("./../components/Layout", () => ({ children, title }) => (
  <div data-testid="layout">
    <h1>{title}</h1>
    {children}
  </div>
));

jest.mock("../context/search", () => ({
  useSearch: jest.fn(),
}));

describe("Search Page", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders search results heading", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("Search Results")).toBeInTheDocument();
  });

  test("displays 'No Products Found' when results array is empty", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    useSearch.mockReturnValue([{ results: [] }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("No Products Found")).toBeInTheDocument();
  });

  test("displays correct number of products found", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    const fakeProducts = [
      { _id: "1", name: "Product 1", description: "Description 1", price: 100 },
      { _id: "2", name: "Product 2", description: "Description 2", price: 200 },
    ];

    useSearch.mockReturnValue([{ results: fakeProducts }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("Found 2")).toBeInTheDocument();
  });

  test("renders product name correctly", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    const fakeProducts = [
      { _id: "1", name: "Test Product", description: "Some description", price: 100 },
    ];

    useSearch.mockReturnValue([{ results: fakeProducts }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("Test Product")).toBeInTheDocument();
  });

  test("renders truncated product description (first 30 characters)", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    const longDescription = "123456789012345678901234567890EXTRA_TEXT";
    const fakeProducts = [
      { _id: "1", name: "Product", description: longDescription, price: 100 },
    ];

    useSearch.mockReturnValue([{ results: fakeProducts }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("123456789012345678901234567890...")).toBeInTheDocument();
  });

  test("renders product price correctly", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    const fakeProducts = [
      { _id: "1", name: "Product", description: "Desc", price: 999 },
    ];

    useSearch.mockReturnValue([{ results: fakeProducts }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("$ 999")).toBeInTheDocument();
  });

  test("renders correct product image source", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    const fakeProducts = [
      { _id: "abc123", name: "Product", description: "Desc", price: 100 },
    ];

    useSearch.mockReturnValue([{ results: fakeProducts }, jest.fn()]);

    // ACT
    render(<Search />);

    const image = screen.getByAltText("Product");

    // ASSERT
    expect(image).toHaveAttribute(
      "src",
      "/api/v1/product/product-photo/abc123"
    );
  });

  test("renders 'More Details' button for each product", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    const fakeProducts = [
      { _id: "1", name: "Product", description: "Desc", price: 100 },
    ];

    useSearch.mockReturnValue([{ results: fakeProducts }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("More Details")).toBeInTheDocument();
  });

  test("renders 'ADD TO CART' button for each product", () => { // Alexander Setyawan, A0257149W
    // ARRANGE
    const fakeProducts = [
      { _id: "1", name: "Product", description: "Desc", price: 100 },
    ];

    useSearch.mockReturnValue([{ results: fakeProducts }, jest.fn()]);

    // ACT
    render(<Search />);

    // ASSERT
    expect(screen.getByText("ADD TO CART")).toBeInTheDocument();
  });
});