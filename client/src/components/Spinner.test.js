import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Spinner from "./Spinner";
import { useNavigate, useLocation } from "react-router-dom";
import { act } from "react-dom/test-utils";

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe("Spinner Component", () => {
  let mockNavigate;

  beforeEach(() => {
    jest.useFakeTimers();
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({ pathname: "/protected" });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test("renders initial countdown value (3)", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner />);

    // Act
    const heading = screen.getByText(/redirecting to you in 3 second/i);

    // Assert
    expect(heading).toBeInTheDocument();
  });

  test("renders loading spinner", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner />);

    // Act
    const spinner = screen.getByRole("status");

    // Assert
    expect(spinner).toBeInTheDocument();
  });

  test("decreases count after 1 second", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner />);

    // Act
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Assert
    expect(
      screen.getByText(/redirecting to you in 2 second/i)
    ).toBeInTheDocument();
  });

  test("reaches 0 after 3 seconds", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner />);

    // Act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert
    expect(
      screen.getByText(/redirecting to you in 0 second/i)
    ).toBeInTheDocument();
  });

  test("calls navigate when countdown reaches 0", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner />);

    // Act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  test("navigates to /login by default", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner />);

    // Act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith("/login", {
      state: "/protected",
    });
  });

  test("navigates to custom path when path prop is provided", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner path="dashboard" />);

    // Act
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard", {
      state: "/protected",
    });
  });

  test("does not navigate before countdown reaches 0", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(<Spinner />);

    // Act
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Assert
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("clears interval on unmount", () => { // Alexander Setyawan, A0257149W
    // Arrange
    const clearSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<Spinner />);

    // Act
    unmount();

    // Assert
    expect(clearSpy).toHaveBeenCalled();
  });
});