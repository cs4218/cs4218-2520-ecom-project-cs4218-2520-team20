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
    // Act
    render(<Contact />);

    // Assert
    expect(screen.getByTestId("mock-layout")).toBeInTheDocument();
  });

  test("passes correct title prop to Layout", () => {
    // Act
    render(<Contact />);

    // Assert
    expect(screen.getByTestId("mock-layout"))
      .toHaveAttribute("data-title", "Contact us");
  });

  test("renders CONTACT US heading", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    expect(
      screen.getByRole("heading", { name: /contact us/i })
    ).toBeInTheDocument();
  });

  test("renders contact description text", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    expect(
      screen.getByText(/for any query or info about product/i)
    ).toBeInTheDocument();
  });

  test("renders email address", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    expect(
      screen.getByText(/www\.help@ecommerceapp\.com/i)
    ).toBeInTheDocument();
  });

  test("renders phone number", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    expect(
      screen.getByText(": 012-3456789")
    ).toBeInTheDocument();
  });

  test("renders toll free support number", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    expect(
      screen.getByText(": 1800-0000-0000 (toll free)")
    ).toBeInTheDocument();
  });

  test("renders contact image with correct alt text", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
  });

  test("contact image has correct src attribute", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    const image = screen.getByAltText("contactus");
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
  });

  test("renders 3 contact icons", () => { // Alexander Setyawan, A0257149W
    // Act
    render(<Contact />);

    // Assert
    const icons = document.querySelectorAll("svg");
    expect(icons.length).toBe(3);
  });
});