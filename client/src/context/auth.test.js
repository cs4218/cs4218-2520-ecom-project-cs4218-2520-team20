import React from "react";
import { renderHook, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth";
import axios from "axios";


// Nigel Lee, A0259264W
jest.mock("axios", () => ({
  defaults: {
    headers: {
      common: {},
    },
  },
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("Auth Context & Hook", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    axios.defaults.headers.common = {};
  });

  it("should have initial empty state", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current[0].user).toBeNull();
    expect(result.current[0].token).toBe("");
  });

  it("should hydrate state from localStorage on mount", () => {
    const mockAuthData = {
      user: { name: "John", email: "john@example.com" },
      token: "mock-jwt-token",
    };
    
    localStorage.getItem.mockReturnValue(JSON.stringify(mockAuthData));

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current[0].user.name).toBe("John");
    expect(result.current[0].user.email).toBe("john@example.com");
    expect(result.current[0].token).toBe("mock-jwt-token");
  });

  it("should update axios headers when auth token changes", () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
        result.current[1]({
            user: { name: "John", email: "john@example.com" },
            token: "new-token"
        });
    });

    expect(axios.defaults.headers.common["Authorization"]).toBe("new-token");
  });
});