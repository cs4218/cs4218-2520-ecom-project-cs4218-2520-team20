import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchProvider, useSearch } from "./search";

// Fake consumer to read context state
const ReadConsumer = () => {
  const [state] = useSearch();

  return (
    <>
      <span data-testid="keyword">{state.keyword}</span>
      <span data-testid="results-length">{state.results.length}</span>
    </>
  );
};

// Fake consumer to update context state
const UpdateConsumer = () => {
  const [state, setState] = useSearch();

  return (
    <button
      onClick={() =>
        setState({
          ...state,
          keyword: "react",
          results: ["result1", "result2"],
        })
      }
    >
      Update State
    </button>
  );
};

describe("SearchContext & SearchProvider", () => {
  test("renders children inside SearchProvider", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <SearchProvider>
        <div data-testid="child">Child Component</div>
      </SearchProvider>
    );

    // Act
    const childElement = screen.getByTestId("child");

    // Assert
    expect(childElement).toBeInTheDocument();
  });

  test("initializes keyword as empty string", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <SearchProvider>
        <ReadConsumer />
      </SearchProvider>
    );

    // Act
    const keyword = screen.getByTestId("keyword");

    // Assert
    expect(keyword.textContent).toBe("");
  });

  test("initializes results as empty array", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <SearchProvider>
        <ReadConsumer />
      </SearchProvider>
    );

    // Act
    const resultsLength = screen.getByTestId("results-length");

    // Assert
    expect(resultsLength.textContent).toBe("0");
  });

  test("updates keyword when setState is called", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <SearchProvider>
        <ReadConsumer />
        <UpdateConsumer />
      </SearchProvider>
    );

    // Act
    fireEvent.click(screen.getByText("Update State"));

    // Assert
    expect(screen.getByTestId("keyword").textContent).toBe("react");
  });

  test("updates results when setState is called", () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <SearchProvider>
        <ReadConsumer />
        <UpdateConsumer />
      </SearchProvider>
    );

    // Act
    fireEvent.click(screen.getByText("Update State"));

    // Assert
    expect(screen.getByTestId("results-length").textContent).toBe("2");
  });

  test("useSearch returns state object and setState function", () => { // Alexander Setyawan, A0257149W
    // Arrange
    let contextValue;

    const TestComponent = () => {
      contextValue = useSearch();
      return null;
    };

    render(
      <SearchProvider>
        <TestComponent />
      </SearchProvider>
    );

    // Act
    const [state, setState] = contextValue;

    // Assert
    expect(state).toHaveProperty("keyword");
    expect(state).toHaveProperty("results");
    expect(typeof setState).toBe("function");
  });

  test("allows multiple consecutive state updates", () => { // Alexander Setyawan, A0257149W
    // Arrange
    const MultiUpdateConsumer = () => {
      const [state, setState] = useSearch();

      return (
        <button
          onClick={() =>
            setState({
              ...state,
              keyword: "updated",
            })
          }
        >
          Change Keyword
        </button>
      );
    };

    render(
      <SearchProvider>
        <ReadConsumer />
        <MultiUpdateConsumer />
      </SearchProvider>
    );

    // Act
    fireEvent.click(screen.getByText("Change Keyword"));
    fireEvent.click(screen.getByText("Change Keyword"));

    // Assert
    expect(screen.getByTestId("keyword").textContent).toBe("updated");
  });
});