import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";
import axios from "axios";

jest.mock("axios");

describe("useCategory Hook", () => {
  it("fetches and returns categories", async () => {
    const mockCategories = [
      { _id: "cat-1", name: "Gadgets", slug: "gadgets" },
      { _id: "cat-2", name: "Accessories", slug: "accessories" },
    ];

    axios.get.mockResolvedValueOnce({ data: { category: mockCategories } });

    const { result } = renderHook(() => useCategory());
    await waitFor(() => {
      expect(result.current).toEqual(mockCategories);
    });
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
  });
  it("handles error when fetching categories fails", async () => {
    const err = new Error("Failed to fetch categories");
    axios.get.mockRejectedValueOnce(err);
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    renderHook(() => useCategory());
    expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    expect(logSpy).toHaveBeenCalledWith(err);

    logSpy.mockRestore();
  });
});
