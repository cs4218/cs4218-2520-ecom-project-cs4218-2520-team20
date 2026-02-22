import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Policy from "./Policy";

// Nigel Lee, A0259264W
jest.mock("./../components/Layout", () => {
  return ({ children, title }) => (
    <section data-testid="main-layout" data-seo-title={title}>
      {children}
    </section>
  );
});

describe("Privacy Policy Page - UI Verification", () => {
  const EXPECTED_SEO_TITLE = "Privacy Policy";
  const PLACEHOLDER_TEXT = "add privacy policy";

  test("should be wrapped in Layout with correct SEO metadata", () => {
    render(<Policy />);
    const layoutWrapper = screen.getByTestId("main-layout");
    
    expect(layoutWrapper).toBeInTheDocument();
    expect(layoutWrapper).toHaveAttribute("data-seo-title", EXPECTED_SEO_TITLE);
  });

  test("should exhibit the correct 2-column grid layout and responsive classes", () => {
    const { container } = render(<Policy />);
    
    const row = container.querySelector(".row.contactus");
    const imageColumn = container.querySelector(".col-md-6");
    const textColumn = container.querySelector(".col-md-4");

    expect(row).toBeInTheDocument();
    expect(row).toContainElement(imageColumn);
    expect(row).toContainElement(textColumn);
  });

  test("should display the contact image with fluid width style", () => {
    render(<Policy />);
    const banner = screen.getByRole("img");

    expect(banner).toHaveAttribute("src", "/images/contactus.jpeg");
    expect(banner).toHaveAttribute("alt", "contactus");
    expect(banner.style.width).toBe("100%");
  });

  test("should render exactly seven policy information paragraphs", () => {
    render(<Policy />);
    
    const entries = screen.queryAllByText(new RegExp(PLACEHOLDER_TEXT, "i"));
    
    expect(entries).toHaveLength(7);
    entries.forEach(item => expect(item.tagName).toBe("P"));
  });
});