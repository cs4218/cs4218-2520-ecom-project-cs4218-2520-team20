import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminMenu from "./AdminMenu";

const renderAdminMenu = () =>
	render(
		<MemoryRouter>
			<AdminMenu />
		</MemoryRouter>,
	);

describe("AdminMenu", () => {
	it("renders the admin panel heading", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const heading = screen.getByText("Admin Panel");

		// Assert
		expect(heading).toBeInTheDocument();
	});

	it("renders the create category link", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /create category/i });

		// Assert
		expect(link).toBeInTheDocument();
	});

	it("create category link has correct href", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /create category/i });

		// Assert
		expect(link).toHaveAttribute(
			"href",
			"/dashboard/admin/create-category",
		);
	});

	it("renders the create product link", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /create product/i });

		// Assert
		expect(link).toBeInTheDocument();
	});

	it("create product link has correct href", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /create product/i });

		// Assert
		expect(link).toHaveAttribute("href", "/dashboard/admin/create-product");
	});

	it("renders the products link", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /^products$/i });

		// Assert
		expect(link).toBeInTheDocument();
	});

	it("products link has correct href", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /^products$/i });

		// Assert
		expect(link).toHaveAttribute("href", "/dashboard/admin/products");
	});

	it("renders the orders link", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /orders/i });

		// Assert
		expect(link).toBeInTheDocument();
	});

	it("orders link has correct href", () => {
		// Arrange
		renderAdminMenu();

		// Act
		const link = screen.getByRole("link", { name: /orders/i });

		// Assert
		expect(link).toHaveAttribute("href", "/dashboard/admin/orders");
	});
});
