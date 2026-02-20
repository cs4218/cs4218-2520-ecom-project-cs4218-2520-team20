import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SearchInput from "./SearchInput";
import axios from "axios";
import { useSearch } from "../../context/search";
import { useNavigate } from "react-router-dom";

jest.mock("axios");
jest.mock("../../context/search");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("SearchInput Component", () => {
  let mockSetValues;
  let mockNavigate;

  beforeEach(() => {
    mockSetValues = jest.fn();
    mockNavigate = jest.fn();

    useSearch.mockReturnValue([
      { keyword: "", results: [] },
      mockSetValues,
    ]);

    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders search form", () => {
    // Arrange
    render(<SearchInput />);

    // Act
    const input = screen.getByPlaceholderText("Search");
    const button = screen.getByRole("button", { name: /search/i });

    // Assert
    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
  });

  test("input should be initially empty", () => {
    // Arrange
    render(<SearchInput />);

    // Act
    const input = screen.getByPlaceholderText("Search");

    // Assert
    expect(input.value).toBe("");
  });

  test("should update keyword when typing", () => {
    // Arrange
    render(<SearchInput />);
    const input = screen.getByPlaceholderText("Search");

    // Act
    fireEvent.change(input, { target: { value: "laptop" } });

    // Assert
    expect(mockSetValues).toHaveBeenCalledWith({
      keyword: "laptop",
      results: [],
    });
  });

  test("should call axios with correct URL on submit", async () => {
    // Arrange
    useSearch.mockReturnValue([
      { keyword: "phone", results: [] },
      mockSetValues,
    ]);

    axios.get.mockResolvedValue({ data: [] });

    render(<SearchInput />);
    const button = screen.getByRole("button", { name: /search/i });

    // Act
    fireEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/search/phone"
      );
    });
  });

  test("should set results after successful search", async () => {
    // Arrange
    const fakeData = [{ id: 1, name: "Phone" }];

    useSearch.mockReturnValue([
      { keyword: "phone", results: [] },
      mockSetValues,
    ]);

    axios.get.mockResolvedValue({ data: fakeData });

    render(<SearchInput />);
    const button = screen.getByRole("button", { name: /search/i });

    // Act
    fireEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(mockSetValues).toHaveBeenCalledWith({
        keyword: "phone",
        results: fakeData,
      });
    });
  });

  test("should navigate to /search after successful search", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: [] });

    useSearch.mockReturnValue([
      { keyword: "phone", results: [] },
      mockSetValues,
    ]);

    render(<SearchInput />);
    const button = screen.getByRole("button", { name: /search/i });

    // Act
    fireEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/search");
    });
  });

  test("should log error if axios request fails", async () => {
    // Arrange
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    axios.get.mockRejectedValue(new Error("Network error"));

    useSearch.mockReturnValue([
      { keyword: "phone", results: [] },
      mockSetValues,
    ]);

    render(<SearchInput />);
    const button = screen.getByRole("button", { name: /search/i });

    // Act
    fireEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  test("should handle empty search keyword", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: [] });

    useSearch.mockReturnValue([
      { keyword: "", results: [] },
      mockSetValues,
    ]);

    render(<SearchInput />);
    const button = screen.getByRole("button", { name: /search/i });

    // Act
    fireEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        "/api/v1/product/search/"
      );
    });
  });
});