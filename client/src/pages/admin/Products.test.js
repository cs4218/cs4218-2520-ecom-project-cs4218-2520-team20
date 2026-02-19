// Seah Minlong, A0271643E
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import Products from "./Products";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/Layout", () => ({ children }) => (
	<div data-testid="LayoutMock">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
	<div data-testid="AdminMenuMock">AdminMenuMock</div>
));

const mockProducts = [
	{
		_id: "prod1",
		name: "Test Product 1",
		description: "Description for product 1",
		slug: "test-product-1",
	},
	{
		_id: "prod2",
		name: "Test Product 2",
		description: "Description for product 2",
		slug: "test-product-2",
	},
];

const renderProducts = async () => {
	render(
		<MemoryRouter>
			<Products />
		</MemoryRouter>,
	);
	// Wait for the initial fetch to resolve and products to render
	await waitFor(() =>
		expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product"),
	);
};

describe("Products", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
		axios.get.mockResolvedValue({ data: { products: mockProducts } });
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	it("renders the layout and admin menu", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		expect(screen.getByTestId("LayoutMock")).toBeInTheDocument();
		expect(screen.getByTestId("AdminMenuMock")).toBeInTheDocument();
	});

	it("renders the All Products List heading", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		expect(screen.getByText("All Products List")).toBeInTheDocument();
	});

	it("fetches all products on mount", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		expect(axios.get).toHaveBeenCalledWith("/api/v1/product/get-product");
		expect(axios.get).toHaveBeenCalledTimes(1);
	});

	it("renders all product names", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		await screen.findByText("Test Product 1");
		expect(screen.getByText("Test Product 1")).toBeInTheDocument();
		expect(screen.getByText("Test Product 2")).toBeInTheDocument();
	});

	it("renders all product descriptions", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		await screen.findByText("Description for product 1");
		expect(
			screen.getByText("Description for product 1"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Description for product 2"),
		).toBeInTheDocument();
	});

	it("renders product images with correct src and alt", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		const img1 = await screen.findByAltText("Test Product 1");
		expect(img1).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/prod1",
		);

		const img2 = screen.getByAltText("Test Product 2");
		expect(img2).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/prod2",
		);
	});

	it("renders product links with correct href", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		await screen.findByText("Test Product 1");
		const links = screen.getAllByRole("link");
		const hrefs = links.map((l) => l.getAttribute("href"));
		expect(hrefs).toContain("/dashboard/admin/product/test-product-1");
		expect(hrefs).toContain("/dashboard/admin/product/test-product-2");
	});

	it("renders an empty list when no products are returned", async () => {
		// Arrange
		axios.get.mockResolvedValueOnce({ data: { products: [] } });

		// Act
		await renderProducts();

		// Assert
		await expect(
			screen.findByText("All Products List"),
		).resolves.toBeInTheDocument();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("shows error toast when fetching products fails", async () => {
		// Arrange
		axios.get.mockRejectedValueOnce(new Error("Network Error"));

		// Act
		render(
			<MemoryRouter>
				<Products />
			</MemoryRouter>,
		);

		// Assert
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith("Something Went Wrong"),
		);
	});

	it("logs the error when fetching products fails", async () => {
		// Arrange
		const error = new Error("Network Error");
		axios.get.mockRejectedValueOnce(error);

		// Act
		render(
			<MemoryRouter>
				<Products />
			</MemoryRouter>,
		);

		// Assert
		await waitFor(() => expect(console.log).toHaveBeenCalledWith(error));
	});

	it("renders the correct number of product cards", async () => {
		// Arrange + Act
		await renderProducts();

		// Assert
		await screen.findByText("Test Product 1");
		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(2);
	});

	it("renders a single product correctly", async () => {
		// Arrange
		axios.get.mockResolvedValueOnce({
			data: {
				products: [
					{
						_id: "prod3",
						name: "Single Product",
						description: "Only one product",
						slug: "single-product",
					},
				],
			},
		});

		// Act
		await renderProducts();

		// Assert
		await screen.findByText("Single Product");
		expect(screen.getByText("Single Product")).toBeInTheDocument();
		expect(screen.getByText("Only one product")).toBeInTheDocument();
		expect(screen.getByAltText("Single Product")).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/prod3",
		);
		expect(screen.getByRole("link")).toHaveAttribute(
			"href",
			"/dashboard/admin/product/single-product",
		);
	});
});
