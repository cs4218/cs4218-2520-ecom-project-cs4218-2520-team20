import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Login from "../../client/src/pages/Auth/Login";
import { AuthProvider } from "../../client/src/context/auth";

// Nigel Lee, A0259264W
jest.mock("axios", () => ({
  post: jest.fn(),
  get: jest.fn(),
  defaults: {
    headers: { common: {} },
  },
}));

jest.mock("react-hot-toast");

jest.mock("../../client/src/context/cart", () => ({
  useCart: jest.fn(() => [null, jest.fn()]),
}));

jest.mock("../../client/src/context/search", () => ({
  useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../client/src/hooks/useCategory", () => ({
  __esModule: true,
  default: jest.fn(() => []),
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(() => ({ state: null })),
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });


describe("Frontend Integration: Login Component + Auth Context + Router", () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    axios.defaults.headers.common = {};
  });

  it("should update global AuthContext, LocalStorage, and Axios headers on successful login", async () => {
    const loginResponse = {
      success: true,
      message: "Login Successful",
      user: { id: "123", name: "John Doe", email: "john@example.com" },
      token: "valid-jwt-token-789",
    };
    axios.post.mockResolvedValueOnce({ data: loginResponse });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "auth",
      JSON.stringify(loginResponse)
    );

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe("valid-jwt-token-789");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/");
    expect(toast.success).toHaveBeenCalledWith("Login Successful", expect.any(Object));
  });

  it("should NOT update Context, Axios, or Storage if API returns success: false (Invalid Credentials)", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: "Invalid email or password" },
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "wrongpassword" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
    expect(mockNavigate).not.toHaveBeenCalled();
    
    expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
  });

  it("should NOT update Context, Axios, or Storage if a network error occurs (500 Server Crash)", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    axios.post.mockRejectedValueOnce(new Error("Network Error"));

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(localStorageMock.setItem).not.toHaveBeenCalled();
    expect(axios.defaults.headers.common["Authorization"]).toBe("");
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");

    console.error.mockRestore();
  });

  it("should integrate with Router location.state to redirect user to their previous protected page", async () => {
    const { useLocation } = require("react-router-dom");
    useLocation.mockReturnValue({ state: "/dashboard" });

    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "OK", user: {}, token: "token123" },
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("should automatically read existing LocalStorage and populate Axios headers on mount", async () => {
    const preExistingData = {
      user: { name: "Returning User", email: "return@example.com" },
      token: "pre-existing-token-456",
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(preExistingData));

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<Login />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(axios.defaults.headers.common["Authorization"]).toBe("pre-existing-token-456");
    });
  });
});