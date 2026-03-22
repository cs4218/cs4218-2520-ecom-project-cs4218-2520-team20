// Wang Zhi Wren, A0255368U
import React from 'react';
import "@testing-library/jest-dom";
import { act, render, fireEvent, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@client/components/Layout';
import { useAuth } from "@client/context/auth";

jest.mock('@client/context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn()])
}));

jest.mock('@client/context/cart', () => ({
  useCart: jest.fn(() => [null, jest.fn()])
}));
    
jest.mock('@client/context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('@client/hooks/useCategory', () => ({
  __esModule: true, // importing useCategory via ES Module
  default: jest.fn(() => [
    { _id: '1', name: 'Electronics', slug: 'electronics' },
    { _id: '2', name: 'Books', slug: 'books' },
    { _id: '3', name: 'Clothing', slug: 'clothing' },
  ])
}));

describe("Layout Component", () => {
  it("renders children inside main body", async () => {
    await act(async () => render(
      <MemoryRouter>
        <Layout>
          <div data-testid="child">Child Content</div>
        </Layout>
      </MemoryRouter>
    ));
    const child = screen.getByTestId("child");

    expect(child).toBeInTheDocument();
  });

  describe("Nested Header component", () => {
    it("exists in the document", async () => {
      const { findByText } = await act(async () => render(
        <MemoryRouter>
          <Layout>
            <div data-testid="child">Child Content</div>
          </Layout>
        </MemoryRouter>
      ));

      const header = await findByText('🛒 Virtual Vault')
      expect(header).toBeInTheDocument();
    });
    
    it("renders the SearchInput components", async () => {
      const { findAllByPlaceholderText, findAllByText } = await act(async () => render(
        <MemoryRouter>
          <Layout>
            <div data-testid="child">Child Content</div>
          </Layout>
        </MemoryRouter>
      ));

      const search_field = await findAllByPlaceholderText('Search', { selector: 'input' });
      const search_btn = await findAllByText('Search', { selector: 'button' });
      expect(search_field).toHaveLength(1);
      expect(search_btn).toHaveLength(1);
    });
    
    it("renders all components of the Header", async () => {
      const { findByText } = await act(async () => render(
        <MemoryRouter>
          <Layout>
            <div data-testid="child">Child Content</div>
          </Layout>
        </MemoryRouter>
      ));

      const title = findByText('🛒 Virtual Vault')
      const home = findByText('Home')
      const category = findByText('Categories')
      const dropdown = findByText('All Categories')
      const register = findByText('Register')
      const login = findByText('Login')
      expect(await title).toBeVisible();
      expect(await home).toBeVisible();
      expect(await category).toBeVisible();
      expect(await dropdown).toBeVisible();
      expect(await register).toBeVisible();
      expect(await login).toBeVisible();
    });
    
    it("renders logged-in information instead if auth token exists", async () => {
      useAuth.mockReturnValueOnce([{ user: { name: 'The Man', role: 1 } }, jest.fn()])

      const { findByText } = await act(async () => render(
        <MemoryRouter>
          <Layout>
            <div data-testid="child">Child Content</div>
          </Layout>
        </MemoryRouter>
      ));

      const register = findByText('Register')
      const login = findByText('Login')
      const name = findByText('The Man')
      await expect(register).rejects.toThrow();
      await expect(login).rejects.toThrow();
      await expect(name).resolves.toBeVisible()
    });

    it("populates the categories of the header properly", async () => {
      const { findByTestId } = await act(async () => render(
        <MemoryRouter>
          <Layout>
            <div data-testid="child">Child Content</div>
          </Layout>
        </MemoryRouter>
      ));

      const categories = await findByTestId('categories-menu')
      expect(categories.children.length).toBe(4)
      await expect(findByTestId('all-categories-link')).resolves.toBeInTheDocument()
      await expect(findByTestId('electronics-link')).resolves.toBeInTheDocument()
      await expect(findByTestId('books-link')).resolves.toBeInTheDocument()
      await expect(findByTestId('clothing-link')).resolves.toBeInTheDocument()
    });
  })

  it("renders Footer component", async () => {
    const { findByText } = await act(async () => render(
      <MemoryRouter>
        <Layout>
          <div data-testid="child">Child Content</div>
        </Layout>
      </MemoryRouter>
    ));

    const disclaimer = await findByText("All Rights Reserved © TestingComp");
    const about = await findByText("About");
    const contact = await findByText("Contact");
    const policy = await findByText("Privacy Policy");

    expect(disclaimer).toBeVisible();
    expect(about).toBeVisible();
    expect(contact).toBeVisible();
    expect(policy).toBeVisible();
  });
});
