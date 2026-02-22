import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";

jest.mock("./Header", () => () => (
  <div data-testid="header">Header</div>
));

jest.mock("./Footer", () => () => (
  <div data-testid="footer">Footer</div>
));

jest.mock("react-helmet", () => ({
  Helmet: ({ children }) => (
    <div data-testid="helmet">{children}</div>
  ),
}));

jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe("Layout Component", () => {
  test("renders Header component", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout />);

    // Act
    const header = screen.getByTestId("header");

    // Assert
    expect(header).toBeInTheDocument();
  });

  test("renders Footer component", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout />);

    // Act
    const footer = screen.getByTestId("footer");

    // Assert
    expect(footer).toBeInTheDocument();
  });

  test("renders children inside main", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <Layout>
        <div data-testid="child">Child Content</div>
      </Layout>
    );

    // Act
    const child = screen.getByTestId("child");

    // Assert
    expect(child).toBeInTheDocument();
  });

  test("renders Toaster component", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout />);

    // Act
    const toaster = screen.getByTestId("toaster");

    // Assert
    expect(toaster).toBeInTheDocument();
  });

  test("uses default title when no title prop is passed", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout />);

    // Act
    const title = screen.getByText("Ecommerce app - shop now");

    // Assert
    expect(title).toBeInTheDocument();
  });

  test("renders custom title in Helmet", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout title="Custom Title" />);

    // Act
    const title = screen.getByText("Custom Title");

    // Assert
    expect(title).toBeInTheDocument();
  });

  test("renders description meta tag with correct content", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout description="Test description" />);

    // Act
    const meta = screen.getByText((content, element) =>
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("name") === "description" &&
      element.getAttribute("content") === "Test description"
    );

    // Assert
    expect(meta).toBeInTheDocument();
  });

  test("renders keywords meta tag with correct content", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout keywords="react,jest" />);

    // Act
    const meta = screen.getByText((content, element) =>
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("name") === "keywords" &&
      element.getAttribute("content") === "react,jest"
    );

    // Assert
    expect(meta).toBeInTheDocument();
  });

  test("renders author meta tag with correct content", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Layout author="John Doe" />);

    // Act
    const meta = screen.getByText((content, element) =>
      element.tagName.toLowerCase() === "meta" &&
      element.getAttribute("name") === "author" &&
      element.getAttribute("content") === "John Doe"
    );

    // Assert
    expect(meta).toBeInTheDocument();
  });
});