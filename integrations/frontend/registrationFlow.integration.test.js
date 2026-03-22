import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import toast from "react-hot-toast";
import Register from "../../client/src/pages/Auth/Register";

jest.mock("axios");
jest.mock("react-hot-toast");

// Nigel Lee, A0259264W
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("../../client/src/context/auth", () => ({
  useAuth: jest.fn(() => [{ user: null, token: "" }, jest.fn()]),
}));

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

describe("Frontend Integration: Registration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should normalize inputs, call the API, and navigate to /login on success", async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: "Register Successfully, please login" },
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { target: { value: "  John Doe  " } });
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: " john@example.com " } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { target: { value: " 123456789 " } });
    fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { target: { value: " 123 Street " } });

    const dobInput = container.querySelector('#exampleInputDOB1');
    fireEvent.change(dobInput, { target: { value: "2000-01-01" } });

    fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { target: { value: " 42 " } });

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        "/api/v1/auth/register",
        expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
          phone: "123456789",
          address: "123 Street",
          DOB: "2000-01-01",
          answer: "42",
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/login");
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Successfully"));
  });

  it("should NOT navigate and should display API error message if email already exists", async () => {
    const errorMessage = "Email already registered";
    axios.post.mockResolvedValueOnce({
      data: { success: false, message: errorMessage },
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { target: { value: "123456789" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { target: { value: "Street" } });

    const dobInput = container.querySelector('#exampleInputDOB1');
    fireEvent.change(dobInput, { target: { value: "2000-01-01" } });

    fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { target: { value: "42" } });

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  it("should intercept 500 Network Errors securely without crashing the UI", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    axios.post.mockRejectedValueOnce(new Error("Network Timeout"));

    const { container } = render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/enter your name/i), { target: { value: "John" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: "john@example.com" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), { target: { value: "123456789" } });
    fireEvent.change(screen.getByPlaceholderText(/enter your address/i), { target: { value: "Street" } });

    const dobInput = container.querySelector('#exampleInputDOB1');
    fireEvent.change(dobInput, { target: { value: "2000-01-01" } });

    fireEvent.change(screen.getByPlaceholderText(/favorite sports/i), { target: { value: "42" } });

    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());

    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
    expect(mockNavigate).not.toHaveBeenCalled();

    console.error.mockRestore();
  });
});