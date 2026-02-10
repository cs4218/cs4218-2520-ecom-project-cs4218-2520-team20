import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import CategoryForm from "./CategoryForm";

describe("CategoryForm Component", () => {
	const mockHandleSubmit = jest.fn(
		(e) => e && e.preventDefault && e.preventDefault(),
	);
	const mockSetValue = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("renders form input", () => {
		// Arrange
		render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value=""
				setValue={mockSetValue}
			/>,
		);

		// Act
		const input = screen.getByPlaceholderText("Enter new category");

		// Assert
		expect(input).toBeInTheDocument();
	});

	test("renders submit button", () => {
		// Arrange
		render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value=""
				setValue={mockSetValue}
			/>,
		);

		// Act
		const submitButton = screen.getByRole("button", { name: /submit/i });

		// Assert
		expect(submitButton).toBeInTheDocument();
	});

	test("displays initial value in input field", () => {
		// Arrange
		render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value="Test Category"
				setValue={mockSetValue}
			/>,
		);

		// Act
		const input = screen.getByDisplayValue("Test Category");

		// Assert
		expect(input).toBeInTheDocument();
	});

	test("calls setValue when input changes", () => {
		// Arrange
		render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value=""
				setValue={mockSetValue}
			/>,
		);
		const input = screen.getByPlaceholderText("Enter new category");

		// Act
		fireEvent.change(input, { target: { value: "New Category" } });

		// Assert
		expect(mockSetValue).toHaveBeenCalledWith("New Category");
	});

	test("calls handleSubmit when form is submitted", () => {
		// Arrange
		render(
			<CategoryForm
				handleSubmit={mockHandleSubmit}
				value="Test Category"
				setValue={mockSetValue}
			/>,
		);
		const submitButton = screen.getByRole("button", { name: /submit/i });

		// Act
		fireEvent.click(submitButton);

		// Assert
		expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
	});
});
