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
		renderAdminMenu();

		expect(screen.getByText("Admin Panel")).toBeInTheDocument();
	});

	it("renders the create category link", () => {
		renderAdminMenu();
		const link = screen.getByRole("link", { name: /create category/i });

		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute(
			"href",
			"/dashboard/admin/create-category",
		);
	});

	it("renders the create product link", () => {
		renderAdminMenu();
		const link = screen.getByRole("link", { name: /create product/i });

		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/dashboard/admin/create-product");
	});

	it("renders the products link", () => {
		renderAdminMenu();
		const link = screen.getByRole("link", { name: /^products$/i });

		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/dashboard/admin/products");
	});

	it("renders the orders link", () => {
		renderAdminMenu();
		const link = screen.getByRole("link", { name: /orders/i });

		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute("href", "/dashboard/admin/orders");
	});
});
