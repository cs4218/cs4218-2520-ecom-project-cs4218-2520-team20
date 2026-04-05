import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import axios from "axios";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import PrivateRoute from "../../client/src/components/Routes/Private";
import { useAuth } from "../../client/src/context/auth";

// Nigel Lee, A0259264W
jest.mock("axios");
jest.mock("../../client/src/context/auth", () => ({
  useAuth: jest.fn(),
}));
jest.mock("../../client/src/components/Spinner", () => () => <div data-testid="spinner">Loading...</div>);
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div data-testid="outlet">Protected Content</div>,
}));

describe("PrivateRoute Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render Spinner and NOT call API if user has no token", () => {
    useAuth.mockReturnValue([{ user: null, token: "" }, jest.fn()]);
    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should call API and render Outlet if backend returns ok: true", async () => {
    useAuth.mockReturnValue([{ user: { name: "John" }, token: "valid-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });
    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
  });

  it("should call API and render Spinner if backend returns ok: false", async () => {
    useAuth.mockReturnValue([{ user: { name: "John" }, token: "expired-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });
    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
    });
  });

  it("should render Spinner and catch errors if the API throws an exception", async () => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    useAuth.mockReturnValue([{ user: { name: "John" }, token: "valid-token" }, jest.fn()]);
    axios.get.mockRejectedValueOnce(new Error("Network Error"));
    render(
      <MemoryRouter>
        <PrivateRoute />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth");
      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.queryByTestId("outlet")).not.toBeInTheDocument();
      expect(console.log).toHaveBeenCalledWith("Network Error");
    });
    console.log.mockRestore();
  });
});