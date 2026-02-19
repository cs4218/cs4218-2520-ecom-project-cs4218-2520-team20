// Kaw Jun Rei Dylan, A0252791Y

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { CartProvider, useCart } from "./cart";

const TestConsumer = () => {
  const [cart, setCart] = useCart();

  return (
    <div>
      <span data-testid="cart">{JSON.stringify(cart)}</span>
      <button
        onClick={() =>
          setCart([
            ...cart,
            {
              _id: "prod-1",
              name: "Smart Speaker",
              slug: "smart-speaker",
              price: 199,
              description: "Compact smart speaker with assistant integration.",
              category: "cat-1",
            },
          ])
        }
      >
        add-item
      </button>
    </div>
  );
};

describe("cart context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn();
  });

  it("starts with an empty cart when localStorage has no cart", async () => {
    // Arrange
    localStorage.getItem.mockReturnValue(null);

    // Act
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("cart")).toHaveTextContent("[]");
    });
    expect(localStorage.getItem).toHaveBeenCalledWith("cart");
  });

  it("hydrates cart from localStorage on mount", async () => {
    // Arrange
    localStorage.getItem.mockReturnValue(
      JSON.stringify([
        {
          _id: "prod-1",
          name: "Smart Speaker",
          slug: "smart-speaker",
          price: 199,
          description: "Compact smart speaker with assistant integration.",
          category: "cat-1",
        },
      ])
    );

    // Act
    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("cart")).toHaveTextContent("Smart Speaker");
    });
  });

  it("updates cart when setCart is called through useCart", async () => {
    // Arrange
    localStorage.getItem.mockReturnValue(null);

    render(
      <CartProvider>
        <TestConsumer />
      </CartProvider>
    );

    // Act
    fireEvent.click(screen.getByText("add-item"));

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("cart")).toHaveTextContent("Smart Speaker");
    });
  });
});
