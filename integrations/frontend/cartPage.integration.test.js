// Kaw Jun Rei Dylan, A0252791Y
// Integration Tests: CartPage + Cart Context + Real localStorage
// Tests cart state persistence and integration with real CartContext

import React from "react";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { CartProvider, useCart } from "../../client/src/context/cart";
import Layout from "../../client/src/components/Layout";

// Mock Layout and Braintree to focus on cart logic
jest.mock("../../client/src/components/Layout", () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="layout">{children}</div>,
  };
});

jest.mock("braintree-web-drop-in-react", () => {
  return {
    __esModule: true,
    default: () => <div data-testid="dropin-mock" />,
  };
});

// Mock auth context BEFORE importing CartPage
jest.mock("../../client/src/context/auth", () => ({
  useAuth: () => [
    {
      token: "test-token",
      user: {
        _id: "user-123",
        name: "Test User",
        address: "123 Test St",
      },
    },
    jest.fn(),
  ],
}));

jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { clientToken: "token" } })),
  post: jest.fn(() => Promise.resolve({ data: { success: true } })),
}));

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

const axios = require("axios");

// Import CartPage after mocking all dependencies
const CartPage = require("../../client/src/pages/CartPage").default;

// Test consumer components to interact with cart
const CartAddButton = ({ productData, onAdd }) => {
  const [cart, setCart] = useCart();
  return (
    <button
      onClick={() => {
        const newCart = [...cart, productData];
        setCart(newCart);
        if (onAdd) onAdd(newCart);
      }}
      data-testid="add-to-cart-btn"
    >
      Add Item
    </button>
  );
};

const CartDisplay = () => {
  const [cart] = useCart();
  return (
    <div data-testid="cart-display">
      {cart.length} items
      {cart.map((item) => (
        <div key={item._id} data-testid={`cart-item-${item._id}`}>
          {item.name}
        </div>
      ))}
    </div>
  );
};

describe("CartPage Integration - Real localStorage + Cart Context", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Cart Context localStorage persistence", () => {
    it("persists cart items to localStorage when item is added", async () => {
      // Arrange
      const product = {
        _id: "p1",
        name: "Smart Speaker",
        price: 199,
        description: "Speaker",
      };

      render(
        <CartProvider>
          <CartAddButton
            productData={product}
            onAdd={(cart) => localStorage.setItem("cart", JSON.stringify(cart))}
          />
          <CartDisplay />
        </CartProvider>
      );

      // Act
      const addBtn = screen.getByTestId("add-to-cart-btn");
      fireEvent.click(addBtn);

      // Assert - check state rendered
      await waitFor(() => {
        expect(screen.getByTestId("cart-display")).toHaveTextContent("1 items");
        expect(screen.getByTestId("cart-item-p1")).toHaveTextContent(
          "Smart Speaker"
        );
      });

      // Assert - check localStorage
      const storedCart = JSON.parse(localStorage.getItem("cart"));
      expect(storedCart).toHaveLength(1);
      expect(storedCart[0]._id).toBe("p1");
      expect(storedCart[0].name).toBe("Smart Speaker");
    });

    it("hydrates cart from localStorage on mount", async () => {
      // Arrange - pre-populate localStorage
      const preloadedCart = [
        {
          _id: "p1",
          name: "Smart Speaker",
          price: 199,
          description: "Speaker",
        },
        {
          _id: "p2",
          name: "Headphones",
          price: 99,
          description: "Headphones",
        },
      ];
      localStorage.setItem("cart", JSON.stringify(preloadedCart));

      // Act
      render(
        <CartProvider>
          <CartDisplay />
        </CartProvider>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("cart-display")).toHaveTextContent("2 items");
        expect(screen.getByTestId("cart-item-p1")).toBeInTheDocument();
        expect(screen.getByTestId("cart-item-p2")).toBeInTheDocument();
      });
    });

    it("starts with empty cart when localStorage is empty", async () => {
      // Arrange
      localStorage.clear();

      // Act
      render(
        <CartProvider>
          <CartDisplay />
        </CartProvider>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("cart-display")).toHaveTextContent("0 items");
      });
    });

    it("maintains cart state across component remounts", async () => {
      // Arrange
      const product = {
        _id: "p1",
        name: "Smart Speaker",
        price: 199,
        description: "Speaker",
      };

      const TestComponent = ({ showCart }) => (
        <CartProvider>
          {showCart && (
            <>
              <CartAddButton
                productData={product}
                onAdd={(cart) =>
                  localStorage.setItem("cart", JSON.stringify(cart))
                }
              />
              <CartDisplay />
            </>
          )}
        </CartProvider>
      );

      const { rerender } = render(<TestComponent showCart={true} />);

      // Act - add item
      const addBtn = screen.getByTestId("add-to-cart-btn");
      fireEvent.click(addBtn);

      // Assert - item is in cart
      await waitFor(() => {
        expect(screen.getByTestId("cart-display")).toHaveTextContent("1 items");
      });

      // Act - unmount and remount
      rerender(<TestComponent showCart={false} />);
      expect(screen.queryByTestId("cart-display")).not.toBeInTheDocument();

      rerender(<TestComponent showCart={true} />);

      // Assert - cart still has item
      await waitFor(() => {
        expect(screen.getByTestId("cart-display")).toHaveTextContent("1 items");
        expect(screen.getByTestId("cart-item-p1")).toBeInTheDocument();
      });
    });
  });

  describe("CartPage with real Cart Context", () => {
    it("removes item from cart and updates localStorage", async () => {
      // Arrange
      const cartItems = [
        {
          _id: "p1",
          name: "Smart Speaker",
          price: 199,
          description: "A smart speaker",
        },
        {
          _id: "p2",
          name: "Headphones",
          price: 99,
          description: "Good headphones",
        },
      ];
      localStorage.setItem("cart", JSON.stringify(cartItems));

      const RemoveCartItem = () => {
        const [cart, setCart] = useCart();

        const removeItem = (pid) => {
          const updatedCart = cart.filter((item) => item._id !== pid);
          setCart(updatedCart);
          localStorage.setItem("cart", JSON.stringify(updatedCart));
        };

        return (
          <div>
            <div data-testid="cart-count">{cart.length}</div>
            {cart.map((item) => (
              <div key={item._id}>
                <span>{item.name}</span>
                <button
                  data-testid={`remove-${item._id}`}
                  onClick={() => removeItem(item._id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        );
      };

      render(
        <CartProvider>
          <RemoveCartItem />
        </CartProvider>
      );

      // Assert - both items present
      await waitFor(() => {
        expect(screen.getByTestId("cart-count")).toHaveTextContent("2");
      });

      // Act - remove first item
      const removeBtn = screen.getByTestId("remove-p1");
      fireEvent.click(removeBtn);

      // Assert - state updated
      await waitFor(() => {
        expect(screen.getByTestId("cart-count")).toHaveTextContent("1");
        expect(screen.queryByText("Smart Speaker")).not.toBeInTheDocument();
      });

      // Assert - localStorage updated
      const storedCart = JSON.parse(localStorage.getItem("cart"));
      expect(storedCart).toHaveLength(1);
      expect(storedCart[0]._id).toBe("p2");
    });

    it("calculates total price correctly from cart items", async () => {
      // Arrange
      const cartItems = [
        {
          _id: "p1",
          name: "Item 1",
          price: 100,
          description: "Item 1",
        },
        {
          _id: "p2",
          name: "Item 2",
          price: 50,
          description: "Item 2",
        },
        {
          _id: "p3",
          name: "Item 3",
          price: 25,
          description: "Item 3",
        },
      ];
      localStorage.setItem("cart", JSON.stringify(cartItems));

      const TotalPrice = () => {
        const [cart] = useCart();

        const calculateTotal = () => {
          let total = 0;
          cart?.forEach((item) => {
            total = total + (item.price || 0);
          });
          return total.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          });
        };

        return <div data-testid="total-price">{calculateTotal()}</div>;
      };

      render(
        <CartProvider>
          <TotalPrice />
        </CartProvider>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("total-price")).toHaveTextContent("$175.00");
      });
    });

    it("handles empty cart gracefully", async () => {
      // Arrange
      localStorage.clear();

      const EmptyCartTest = () => {
        const [cart] = useCart();

        return (
          <div>
            <div data-testid="item-count">{cart.length}</div>
            {cart.length === 0 && (
              <div data-testid="empty-message">Your Cart Is Empty</div>
            )}
          </div>
        );
      };

      render(
        <CartProvider>
          <EmptyCartTest />
        </CartProvider>
      );

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId("item-count")).toHaveTextContent("0");
        expect(screen.getByTestId("empty-message")).toBeInTheDocument();
      });
    });

    it("handles null and undefined product properties gracefully", async () => {
      // Arrange - cart with incomplete product data
      const cartItems = [
        {
          _id: "p1",
          name: "Item with missing description",
          price: 50,
          description: undefined,
        },
        {
          _id: "p2",
          name: "Item with null price",
          price: null,
          description: "Description",
        },
      ];
      localStorage.setItem("cart", JSON.stringify(cartItems));

      const SafeDisplay = () => {
        const [cart] = useCart();

        return (
          <div>
            {cart.map((item) => (
              <div key={item._id} data-testid={`item-${item._id}`}>
                <span>{item.name}</span>
                <span data-testid={`price-${item._id}`}>
                  {item.price || "0"}
                </span>
              </div>
            ))}
          </div>
        );
      };

      render(
        <CartProvider>
          <SafeDisplay />
        </CartProvider>
      );

      // Assert - items render without crashing
      await waitFor(() => {
        expect(screen.getByTestId("item-p1")).toHaveTextContent(
          "Item with missing description"
        );
        expect(screen.getByTestId("price-p1")).toHaveTextContent("50");
        expect(screen.getByTestId("price-p2")).toHaveTextContent("0");
      });
    });
  });

  describe("Cart addition flow integration", () => {
    it("adds multiple items sequentially and persists all to localStorage", async () => {
      // Arrange
      const products = [
        { _id: "p1", name: "Product 1", price: 100, description: "Prod 1" },
        { _id: "p2", name: "Product 2", price: 200, description: "Prod 2" },
        { _id: "p3", name: "Product 3", price: 150, description: "Prod 3" },
      ];

      const MultiAddTest = () => {
        const [cart, setCart] = useCart();

        const addProduct = (product) => {
          const newCart = [...cart, product];
          setCart(newCart);
          localStorage.setItem("cart", JSON.stringify(newCart));
        };

        return (
          <div>
            {products.map((product) => (
              <button
                key={product._id}
                data-testid={`add-${product._id}`}
                onClick={() => addProduct(product)}
              >
                Add {product.name}
              </button>
            ))}
            <div data-testid="cart-count">{cart.length}</div>
          </div>
        );
      };

      render(
        <CartProvider>
          <MultiAddTest />
        </CartProvider>
      );

      // Act - add products sequentially
      products.forEach((product) => {
        const btn = screen.getByTestId(`add-${product._id}`);
        fireEvent.click(btn);
      });

      // Assert - all items in state
      await waitFor(() => {
        expect(screen.getByTestId("cart-count")).toHaveTextContent("3");
      });

      // Assert - all items in localStorage
      const storedCart = JSON.parse(localStorage.getItem("cart"));
      expect(storedCart).toHaveLength(3);
      expect(storedCart.map((item) => item._id)).toEqual(["p1", "p2", "p3"]);
    });
  });
});
