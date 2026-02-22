import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Contact from "./Contact";

jest.mock("./../components/Layout", () => ({
  __esModule: true,
  default: ({ children, title }) => (
    <div data-testid="mock-layout" data-title={title}>
      {children}
    </div>
  ),
}));

describe("Contact Page", () => {
  test("renders Contact page without crashing", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const mockLayout = screen.getByTestId("mock-layout")

    // Assert
    expect(mockLayout).toBeInTheDocument();
  });

  test("passes correct title prop to Layout", () => {
    // Arrange
    render(<Contact />);

    // Act
    const mockLayout = screen.getByTestId("mock-layout")

    // Assert
    expect(mockLayout).toHaveAttribute("data-title", "Contact us");
  });

  test("renders CONTACT US heading", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);
    
    // Act
    const heading = screen.getByRole("heading", { name: /contact us/i })

    // Assert
    expect(heading).toBeInTheDocument();
  });

  test("renders contact description text", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const text = screen.getByText(/for any query or info about product/i)
    
    // Assert
    expect(text).toBeInTheDocument();
  });

  test("renders email address", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const text = screen.getByText(/www\.help@ecommerceapp\.com/i)

    // Assert
    expect(text).toBeInTheDocument();
  });

  test("renders phone number", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const text = screen.getByText(": 012-3456789")

    // Assert
    expect(text).toBeInTheDocument();
  });

  test("renders toll free support number", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const text = screen.getByText(": 1800-0000-0000 (toll free)")

    // Assert
    expect(text).toBeInTheDocument();
  });

  test("renders contact image with correct alt text", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const image = screen.getByAltText("contactus");

    // Assert
    expect(image).toBeInTheDocument();
  });

  test("contact image has correct src attribute", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const image = screen.getByAltText("contactus");

    // Assert
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  test("renders 3 contact icons", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Contact />);

    // Act
    const icons = document.querySelectorAll("svg");

    // Assert
    expect(icons.length).toBe(3);
  });
});