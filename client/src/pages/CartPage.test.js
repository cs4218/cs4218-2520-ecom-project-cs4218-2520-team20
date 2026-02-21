// Kaw Jun Rei Dylan, A0252791Y

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();
const mockUseCart = jest.fn();
const mockSetCart = jest.fn();
const mockPaymentInstance = {
  requestPaymentMethod: jest.fn(),
};

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

const axios = require("axios");

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

jest.mock("../context/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../context/cart", () => ({
  useCart: () => mockUseCart(),
}));

jest.mock("../components/Layout", () => {
  return {
    __esModule: true,
    default: ({ children }) => <div data-testid="layout-mock">{children}</div>,
  };
});

jest.mock("braintree-web-drop-in-react", () => {
  const ReactLib = require("react");
  return {
    __esModule: true,
    default: ({ onInstance }) => {
      ReactLib.useEffect(() => {
        onInstance(mockPaymentInstance);
      }, [onInstance]);
      return ReactLib.createElement("div", { "data-testid": "dropin-mock" });
    },
  };
});

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
  success: jest.fn(),
  error: jest.fn(),
  Toaster: () => null,
}));

const CartPage = require("./CartPage").default;
const toast = require("react-hot-toast").default;

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

const loggedInAuth = {
  token: "token-123",
  user: {
    name: "Jane",
    address: "123 Main Street",
  },
};

const loggedOutAuth = {
  token: "",
  user: null,
};

const cartItems = [
  {
    _id: "p1",
    name: "Smart Speaker",
    description: "Compact smart speaker with assistant integration.",
    price: 199,
  },
  {
    _id: "p2",
    name: "T-shirt",
    description: "Comfortable cotton t-shirt for daily wear.",
    price: 299,
  },
];

const renderCartPage = ({ authState, cartState }) => {
  mockUseAuth.mockReturnValue([authState, jest.fn()]);
  mockUseCart.mockReturnValue([cartState, mockSetCart]);
  return render(<CartPage />);
};

describe("CartPage - user logged in", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { clientToken: "" } });
  });

  it("shows hello with user name", () => {
    // Arrange
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act
    const heading = screen.getByRole("heading", { level: 1 });

    // Assert
    expect(heading).toHaveTextContent(/Hello\s+Jane/i);
  });

  it("shows cart item count message when cart has items", () => {
    // Arrange
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act
    const countMessage = screen.getByText(/You Have 2 items in your cart/i);

    // Assert
    expect(countMessage).toBeInTheDocument();
  });

  it("shows current address and update address button when address exists", () => {
    // Arrange
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act
    const addressText = screen.getByText("123 Main Street");
    const updateButton = screen.getByRole("button", {
      name: /Update Address/i,
    });

    // Assert
    expect(addressText).toBeInTheDocument();
    expect(updateButton).toBeInTheDocument();
  });

  it("shows update address button when logged in user has no address", () => {
    // Arrange
    renderCartPage({
      authState: {
        token: "token-123",
        user: { name: "Jane", address: "" },
      },
      cartState: cartItems,
    });

    // Act
    const updateButton = screen.getByRole("button", {
      name: /Update Address/i,
    });

    // Assert
    expect(updateButton).toBeInTheDocument();
  });

  it("navigates to profile page when update address button is clicked", () => {
    // Arrange
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });
    const updateButton = screen.getByRole("button", {
      name: /Update Address/i,
    });

    // Act
    fireEvent.click(updateButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/profile");
  });

  it("handles payment successfully", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { clientToken: "client-token-123" } });
    mockPaymentInstance.requestPaymentMethod.mockResolvedValue({
      nonce: "nonce-123",
    });
    axios.post.mockResolvedValue({ data: { success: true } });
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act
    const payButton = await screen.findByRole("button", {
      name: /Make Payment/i,
    });
    fireEvent.click(payButton);

    // Assert
    await waitFor(() => {
      expect(mockPaymentInstance.requestPaymentMethod).toHaveBeenCalled();
    });
    expect(axios.post).toHaveBeenCalledWith(
      "/api/v1/product/braintree/payment",
      {
        nonce: "nonce-123",
        cart: cartItems,
      }
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("cart");
    expect(mockSetCart).toHaveBeenCalledWith([]);
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/user/orders");
    expect(toast.success).toHaveBeenCalledWith(
      "Payment Completed Successfully "
    );
  });
});

describe("CartPage - user logged out", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { clientToken: "" } });
  });

  it("shows hello guest heading", () => {
    // Arrange
    renderCartPage({ authState: loggedOutAuth, cartState: cartItems });

    // Act
    const heading = screen.getByRole("heading", { level: 1 });

    // Assert
    expect(heading).toHaveTextContent(/Hello Guest/i);
  });

  it("shows cart count and login reminder message when logged out", () => {
    // Arrange
    renderCartPage({ authState: loggedOutAuth, cartState: cartItems });

    // Act
    const message = screen.getByText(
      /You Have 2 items in your cart please login to checkout !/i
    );

    // Assert
    expect(message).toBeInTheDocument();
  });

  it("shows login button when logged out", () => {
    // Arrange
    renderCartPage({ authState: loggedOutAuth, cartState: cartItems });

    // Act
    const loginButton = screen.getByRole("button", {
      name: /Please Login to checkout/i,
    });

    // Assert
    expect(loginButton).toBeInTheDocument();
  });

  it("navigates to login page with cart return state when login button is clicked", () => {
    // Arrange
    renderCartPage({ authState: loggedOutAuth, cartState: cartItems });
    const loginButton = screen.getByRole("button", {
      name: /Please Login to checkout/i,
    });

    // Act
    fireEvent.click(loginButton);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith("/login", { state: "/cart" });
  });
});

describe("CartPage - shared behaviors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { clientToken: "" } });
  });

  it("shows 'Your Cart Is Empty' when cart has no items", () => {
    // Arrange
    renderCartPage({ authState: loggedInAuth, cartState: [] });

    // Act
    const emptyMessage = screen.getByText(/Your Cart Is Empty/i);

    // Assert
    expect(emptyMessage).toBeInTheDocument();
  });

  it("renders products when cart has items", () => {
    // Arrange
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act
    const firstProduct = screen.getByText("Smart Speaker");
    const secondProduct = screen.getByText("T-shirt");

    // Assert
    expect(firstProduct).toBeInTheDocument();
    expect(secondProduct).toBeInTheDocument();
  });

  it("calculates and displays total cart value correctly", () => {
    // Arrange
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act
    const totalValue = screen.getByText(/Total\s*:\s*\$498\.00/i);

    // Assert
    expect(totalValue).toBeInTheDocument();
  });

  it("removes a product correctly from cart", async () => {
    // Arrange
    let currentCart = [...cartItems];
    mockUseAuth.mockReturnValue([loggedInAuth, jest.fn()]);
    mockUseCart.mockImplementation(() => [
      currentCart,
      (nextCart) => {
        currentCart = nextCart;
        mockSetCart(nextCart);
      },
    ]);
    const { rerender } = render(<CartPage />);
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });

    // Act
    fireEvent.click(removeButtons[0]);
    rerender(<CartPage />);

    // Assert
    expect(mockSetCart).toHaveBeenCalledWith([cartItems[1]]);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "cart",
      JSON.stringify([cartItems[1]])
    );
    expect(screen.queryByText("Smart Speaker")).not.toBeInTheDocument();
    expect(screen.getByText("T-shirt")).toBeInTheDocument();
  });
});

describe("CartPage - payment button visibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render payment button when client token is empty", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { clientToken: "" } });
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Assert
    expect(
      screen.queryByRole("button", { name: /Make Payment/i })
    ).not.toBeInTheDocument();
  });

  it("does not render payment button when auth token is false", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { clientToken: "client-token-123" } });
    renderCartPage({ authState: loggedOutAuth, cartState: cartItems });

    // Act
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Assert
    expect(
      screen.queryByRole("button", { name: /Make Payment/i })
    ).not.toBeInTheDocument();
  });

  it("does not render payment button when cart is empty", async () => {
    // Arrange
    axios.get.mockResolvedValue({ data: { clientToken: "client-token-123" } });
    renderCartPage({ authState: loggedInAuth, cartState: [] });

    // Act
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });

    // Assert
    expect(
      screen.queryByRole("button", { name: /Make Payment/i })
    ).not.toBeInTheDocument();
  });

  describe("error handling", () => {
    it("logs error when braintree token fetch fails", async () => {
      // Arrange: spy on console and make token endpoint fail
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error("token-fail"));

      // Act: render component which fetches the token
      renderCartPage({ authState: loggedInAuth, cartState: cartItems });

      // Assert: error path executed and logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });

    it("logs error when payment flow fails during handlePayment", async () => {
      // Arrange: spy on console, ensure token exists, and make payment instance fail
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});
      axios.get.mockResolvedValue({
        data: { clientToken: "client-token-123" },
      });
      mockPaymentInstance.requestPaymentMethod.mockRejectedValueOnce(
        new Error("pay-fail")
      );

      // Act: render and click Make Payment to trigger handlePayment
      renderCartPage({ authState: loggedInAuth, cartState: cartItems });
      const payButton = await screen.findByRole("button", {
        name: /Make Payment/i,
      });
      fireEvent.click(payButton);

      // Assert: handlePayment caught the error and logged it
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });
      consoleSpy.mockRestore();
    });
  });
});

describe("CartPage - uncovered error branches", () => {
  it("logs error when totalPrice toLocaleString throws", () => {
    // Arrange: make Number.prototype.toLocaleString throw and spy on console
    const original = Number.prototype.toLocaleString;
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    Number.prototype.toLocaleString = function () {
      throw new Error("toLocale-fail");
    };

    // Provide minimal auth/cart state so component renders
    renderCartPage({ authState: loggedInAuth, cartState: cartItems });

    // Act & Assert: rendering should call totalPrice and hit catch
    expect(consoleSpy).toHaveBeenCalled();

    // Cleanup
    Number.prototype.toLocaleString = original;
    consoleSpy.mockRestore();
  });

  it("logs error when removeCartItem's localStorage.setItem throws", async () => {
    // Arrange: make localStorage.setItem throw and spy on console
    const originalSetItem = window.localStorage.setItem;
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    window.localStorage.setItem = jest.fn(() => {
      throw new Error("ls-set-fail");
    });

    renderCartPage({ authState: loggedInAuth, cartState: cartItems });
    const removeButtons = screen.getAllByRole("button", { name: /Remove/i });

    // Act: click remove to trigger removeCartItem and its catch
    fireEvent.click(removeButtons[0]);

    // Assert
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Cleanup
    window.localStorage.setItem = originalSetItem;
    consoleSpy.mockRestore();
  });
});
