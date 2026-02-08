import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminDashboard from "./AdminDashboard";

jest.mock("../../components/AdminMenu", () => () => <div>AdminMenuMock</div>);

jest.mock("../../components/Layout", () => ({ children }) => (
	<div>{children}</div>
));

jest.mock("../../context/auth", () => ({
	useAuth: jest.fn(),
}));

jest.mock("../../context/cart", () => ({
	useCart: jest.fn(),
}));

jest.mock("../../context/search", () => ({
	useSearch: jest.fn(),
}));

jest.mock("../../hooks/useCategory", () => jest.fn());

const { useAuth } = require("../../context/auth");
const { useCart } = require("../../context/cart");
const { useSearch } = require("../../context/search");
const useCategory = require("../../hooks/useCategory");

const renderWithAuth = (authState) => {
	useAuth.mockReturnValue([authState, jest.fn()]);
	useCart.mockReturnValue([[], jest.fn()]);
	useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);
	useCategory.mockReturnValue([]);

	render(
		<MemoryRouter>
			<AdminDashboard />
		</MemoryRouter>,
	);
};

describe("AdminDashboard", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("renders the admin menu", () => {
		// Arrange
		renderWithAuth({ user: null });

		// Act
		const adminMenu = screen.getByText("AdminMenuMock");

		// Assert
		expect(adminMenu).toBeInTheDocument();
	});

	it("renders admin name", () => {
		// Arrange
		renderWithAuth({
			user: {
				name: "Alice Admin",
				email: "alice@example.com",
				phone: "123",
			},
		});

		// Act
		const adminName = screen.getByText(/Admin Name\s*:\s*Alice Admin/i);

		// Assert
		expect(adminName).toBeInTheDocument();
	});

	it("renders admin email", () => {
		// Arrange
		renderWithAuth({
			user: {
				name: "Alice Admin",
				email: "alice@example.com",
				phone: "123",
			},
		});

		// Act
		const adminEmail = screen.getByText(
			/Admin Email\s*:\s*alice@example\.com/i,
		);

		// Assert
		expect(adminEmail).toBeInTheDocument();
	});

	it("renders admin contact", () => {
		// Arrange
		renderWithAuth({
			user: {
				name: "Alice Admin",
				email: "alice@example.com",
				phone: "123",
			},
		});

		// Act
		const adminContact = screen.getByText(/Admin Contact\s*:\s*123/i);

		// Assert
		expect(adminContact).toBeInTheDocument();
	});

	it("renders empty name label when auth is empty", () => {
		// Arrange
		renderWithAuth({ user: null });

		// Act
		const emptyName = screen.getByText(/Admin Name\s*:\s*$/i);

		// Assert
		expect(emptyName).toBeInTheDocument();
	});

	it("renders empty email label when auth is empty", () => {
		// Arrange
		renderWithAuth({ user: null });

		// Act
		const emptyEmail = screen.getByText(/Admin Email\s*:\s*$/i);

		// Assert
		expect(emptyEmail).toBeInTheDocument();
	});

	it("renders empty contact label when auth is empty", () => {
		// Arrange
		renderWithAuth({ user: null });

		// Act
		const emptyContact = screen.getByText(/Admin Contact\s*:\s*$/i);

		// Assert
		expect(emptyContact).toBeInTheDocument();
	});
});
