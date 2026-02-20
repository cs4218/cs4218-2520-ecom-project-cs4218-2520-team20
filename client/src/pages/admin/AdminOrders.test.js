// Seah Minlong, A0271643E
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import axios from "axios";
import toast from "react-hot-toast";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import AdminOrders from "./AdminOrders";

jest.mock("axios");
jest.mock("react-hot-toast");

jest.mock("../../components/Layout", () => ({ children }) => (
	<div data-testid="LayoutMock">{children}</div>
));

jest.mock("../../components/AdminMenu", () => () => (
	<div data-testid="AdminMenuMock">AdminMenuMock</div>
));

jest.mock("../../context/auth", () => ({
	useAuth: jest.fn(),
}));

jest.mock("antd", () => {
	const Option = ({ children, value }) => (
		<option value={value}>{children}</option>
	);
	const Select = ({ onChange, defaultValue, children }) => (
		<select
			data-testid="status-select"
			defaultValue={defaultValue}
			onChange={(e) => onChange(e.target.value)}
		>
			{children}
		</select>
	);
	Select.Option = Option;
	return { Select };
});

jest.mock("moment", () => {
	const mockMoment = () => ({ fromNow: () => "a few seconds ago" });
	return mockMoment;
});

const { useAuth } = require("../../context/auth");

const mockOrders = [
	{
		_id: "order1",
		status: "Not Processed",
		buyer: { name: "John Doe" },
		createdAt: "2024-01-01T00:00:00.000Z",
		payment: { success: true },
		products: [
			{
				_id: "prod1",
				name: "Test Product",
				description: "A short description",
				price: 99.99,
			},
		],
	},
];

const renderAdminOrders = async (authToken = "test-token") => {
	useAuth.mockReturnValue([{ token: authToken }, jest.fn()]);
	render(
		<MemoryRouter>
			<AdminOrders />
		</MemoryRouter>,
	);
	// Wait for the initial fetch to resolve and orders to render
	if (authToken) {
		await waitFor(() =>
			expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders"),
		);
	}
};

describe("AdminOrders", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(console, "log").mockImplementation(() => {});
		axios.get.mockResolvedValue({ data: mockOrders });
	});

	afterEach(() => {
		console.log.mockRestore();
	});

	it("renders the Layout component", async () => {
		// Arrange + Act
		await renderAdminOrders();

		// Assert
		expect(screen.getByTestId("LayoutMock")).toBeInTheDocument();
	});

	it("renders the AdminMenu component", async () => {
		// Arrange + Act
		await renderAdminOrders();

		// Assert
		expect(screen.getByTestId("AdminMenuMock")).toBeInTheDocument();
	});

	it("renders the All Orders heading", async () => {
		// Arrange
		await renderAdminOrders();

		// Act
		await waitFor(() => expect(axios.get).toHaveBeenCalled());

		// Assert
		expect(screen.getByText("All Orders")).toBeInTheDocument();
	});

	it("fetches all orders on mount when auth token is present", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await waitFor(() =>
			expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/all-orders"),
		);
	});

	it("does not fetch orders when auth token is absent", async () => {
		// Arrange
		await renderAdminOrders(null);

		// Assert
		expect(axios.get).not.toHaveBeenCalled();
	});

	it("renders order buyer name", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await screen.findByText("John Doe");
		expect(screen.getByText("John Doe")).toBeInTheDocument();
	});

	it("renders payment success when payment.success is true", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await screen.findByText("Success");
		expect(screen.getByText("Success")).toBeInTheDocument();
	});

	it("renders payment failed when payment.success is false", async () => {
		// Arrange
		axios.get.mockResolvedValueOnce({
			data: [
				{
					...mockOrders[0],
					_id: "order2",
					payment: { success: false },
				},
			],
		});
		await renderAdminOrders();

		// Assert
		await screen.findByText("Failed");
		expect(screen.getByText("Failed")).toBeInTheDocument();
	});

	it("renders payment failed when payment is null", async () => {
		// Arrange
		axios.get.mockResolvedValueOnce({
			data: [{ ...mockOrders[0], payment: null }],
		});
		await renderAdminOrders();

		// Assert
		await screen.findByText("Failed");
		expect(screen.getByText("Failed")).toBeInTheDocument();
	});

	it("renders order product quantity", async () => {
		// Arrange
		axios.get.mockResolvedValueOnce({
			data: [
				{
					...mockOrders[0],
					products: [
						{
							_id: "p1",
							name: "Prod 1",
							description: "desc",
							price: 10,
						},
						{
							_id: "p2",
							name: "Prod 2",
							description: "desc",
							price: 20,
						},
					],
				},
			],
		});
		await renderAdminOrders();

		// Assert
		await screen.findByText("John Doe");
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("renders product name in order card", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await screen.findByText("Test Product");
		expect(screen.getByText("Test Product")).toBeInTheDocument();
	});

	it("renders product description in order card", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await screen.findByText("A short description");
		expect(screen.getByText("A short description")).toBeInTheDocument();
	});

	it("truncates product description to 30 characters", async () => {
		// Arrange
		axios.get.mockResolvedValueOnce({
			data: [
				{
					...mockOrders[0],
					products: [
						{
							_id: "prod2",
							name: "Long Desc Product",
							description:
								"This description is over thirty characters long",
							price: 50,
						},
					],
				},
			],
		});
		await renderAdminOrders();

		// Assert
		await screen.findByText("This description is over thirt");
		expect(
			screen.getByText("This description is over thirt"),
		).toBeInTheDocument();
	});

	it("renders product price in order card", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await screen.findByText("Price : 99.99");
		expect(screen.getByText("Price : 99.99")).toBeInTheDocument();
	});

	it("renders product image with correct src", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		const img = await screen.findByAltText("Test Product");
		expect(img).toHaveAttribute(
			"src",
			"/api/v1/product/product-photo/prod1",
		);
	});

	it("renders the date using moment fromNow", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await screen.findByText("a few seconds ago");
		expect(screen.getByText("a few seconds ago")).toBeInTheDocument();
	});

	it("renders the status dropdown with all status options", async () => {
		// Arrange
		await renderAdminOrders();

		// Assert
		await screen.findByText("John Doe");
		expect(screen.getByText("Not Processed")).toBeInTheDocument();
		expect(screen.getByText("Processing")).toBeInTheDocument();
		expect(screen.getByText("Shipped")).toBeInTheDocument();
		expect(screen.getByText("Delivered")).toBeInTheDocument();
		expect(screen.getByText("Cancelled")).toBeInTheDocument();
	});

	it("renders order index (1-based) in table", async () => {
		// Arrange
		const multipleOrders = [
			mockOrders[0],
			{
				_id: "order2",
				status: "Shipped",
				buyer: { name: "Jane Smith" },
				createdAt: "2024-01-02T00:00:00.000Z",
				payment: { success: true },
				products: [],
			},
		];
		axios.get.mockResolvedValueOnce({ data: multipleOrders });
		await renderAdminOrders();

		// Assert
		await screen.findByText("Jane Smith");
		const cells = screen.getAllByRole("cell");
		expect(cells[0]).toHaveTextContent("1");
		expect(cells[6]).toHaveTextContent("2");
	});

	it("renders multiple orders", async () => {
		// Arrange
		const multipleOrders = [
			mockOrders[0],
			{
				_id: "order2",
				status: "Processing",
				buyer: { name: "Jane Smith" },
				createdAt: "2024-01-02T00:00:00.000Z",
				payment: { success: false },
				products: [],
			},
		];
		axios.get.mockResolvedValueOnce({ data: multipleOrders });
		await renderAdminOrders();

		// Assert
		await screen.findByText("John Doe");
		expect(screen.getByText("Jane Smith")).toBeInTheDocument();
	});

	it("renders correctly when orders list is empty", async () => {
		// Arrange
		axios.get.mockResolvedValueOnce({ data: [] });
		await renderAdminOrders();

		// Assert - wait for pending state update to flush
		await waitFor(() => {
			expect(screen.getByText("All Orders")).toBeInTheDocument();
		});
		expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
	});

	it("updates order status and re-fetches orders", async () => {
		// Arrange
		axios.put.mockResolvedValueOnce({ data: {} });
		await renderAdminOrders();

		await screen.findByText("John Doe");

		// Act
		const select = screen.getByTestId("status-select");
		fireEvent.change(select, { target: { value: "Processing" } });

		// Wait for the re-fetch triggered by handleChange to complete
		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

		// Assert
		expect(axios.put).toHaveBeenCalledWith(
			"/api/v1/auth/order-status/order1",
			{ status: "Processing" },
		);
	});

	it("shows error toast when fetching orders fails", async () => {
		// Arrange
		axios.get.mockRejectedValueOnce(new Error("Network Error"));
		await renderAdminOrders();

		// Assert
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				"Something went wrong in getting orders",
			),
		);
	});

	it("shows error toast when updating order status fails", async () => {
		// Arrange
		axios.put.mockRejectedValueOnce(new Error("Update Error"));
		await renderAdminOrders();

		await screen.findByText("John Doe");

		// Act
		const select = screen.getByTestId("status-select");
		fireEvent.change(select, { target: { value: "Shipped" } });

		// Assert
		await waitFor(() =>
			expect(toast.error).toHaveBeenCalledWith(
				"Something went wrong in updating order status",
			),
		);
	});

	it("does not show error toast on successful status update", async () => {
		// Arrange
		axios.put.mockResolvedValueOnce({ data: {} });
		await renderAdminOrders();

		await screen.findByText("John Doe");

		// Act
		const select = screen.getByTestId("status-select");
		fireEvent.change(select, { target: { value: "Shipped" } });

		// Wait for the re-fetch triggered by handleChange to complete
		await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));

		// Assert
		expect(toast.error).not.toHaveBeenCalled();
	});
});
