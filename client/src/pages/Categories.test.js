import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";
import { afterEach } from "node:test";

jest.mock("../hooks/useCategory", () =>
  jest.fn(() => [
    { _id: "1", name: "Gadgets", slug: "gadgets" },
    { _id: "2", name: "Clothing", slug: "clothing" },
  ])
);

jest.mock("../components/Layout", () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="layout-mock">{children}</div>,
  };
});

describe("Categories page", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("renders the categories", () => {
    render(
      <MemoryRouter>
        <Categories />
      </MemoryRouter>
    );

    expect(screen.getByText("Gadgets")).toBeInTheDocument();
    expect(screen.getByText("Clothing")).toBeInTheDocument();
  });
});
