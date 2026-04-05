// Wang Zhi Wren, A0255368U
// frontend imports
import React from 'react';
import "@testing-library/jest-dom";
import axios from "axios";
import { act, render, fireEvent, waitFor, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from '@client/components/Layout';
import { useAuth } from "@client/context/auth";
import { AuthProvider } from '@client/context/auth';
import { SearchProvider, useSearch } from '@client/context/search';
import { CartProvider, useCart } from '@client/context/cart';
// backend imports
import mongoose from 'mongoose';
import express from "express";
import categoryRoutes from '@server/routes/categoryRoutes.js'
import CategoryModel from "@server/models/categoryModel.js";
import connectDB from '@server/config/db';
import cors from "cors";
import morgan from "morgan";

window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};  

// mongo-db-memory server workaround
const MongoMemoryServer = global.MongoMemoryServer

// db + backend setup
const categories = [{
    name: 'Laptop',
    slug: 'laptop',
}, {
    name: 'Phone',
    slug: 'phone',
}, {
    name: 'Book Cases',
    slug: 'book-cases'
}]
let category_docs = categories.map(x => new CategoryModel(x))
const original_env = Object.assign({}, process.env);
let mongoServer;
let app;
let expressServer;
const mockSearchController = jest.fn(async (req, res) => {
  const { keyword } = req.params;
  res.json([keyword]);
})

// canned response
const canned_auth = {
  user: {
    name: 'The Man',
    email: 'email@1',
    phone: '987654321',
    address: 'Address #1',
    role: 0,
  },
  token: 'Dummy Token',
}
const canned_cart = ['Item 1', 'Item 2', 'Item 3']

// we need to continue mocking localStorage
// from research, jest versions <30 cannot simulate localStorage properly
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => delete store[key]),
    clear: jest.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// helper function - set up render
function RenderStack({children}) {
  return (
    <AuthProvider>
      <SearchProvider>
        <CartProvider>
          <MemoryRouter>
            <Layout>
              {children}
            </Layout>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

// helper function - exploits property of contexts in React, unwraps useSearch value for us
function ExpectValue() {
  const [ value, _ ] = useSearch();
  return (
    <div>
      <div>{value.keyword ? `Keyword: ${value.keyword}` : 'NIL'}</div>
      <div>{JSON.stringify(value.results)}</div>
    </div>
  );
};

// helper function - exploits property of contexts in React, unwraps useCart value for us
function SetCartButton({next_val}) {
  const [ _, setCart ] = useCart();
  return (
    <div>
      <button onClick={() => setCart(next_val)} data-testid="set-cart-btn"></button>
    </div>
  );
};

beforeAll(async () => {
    jest.resetModules();

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri()
    await connectDB();
    await CategoryModel.bulkSave(category_docs);

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));
    app.use("/api/v1/category", categoryRoutes);
    // mocked req string
    app.use(`/api/v1/product/search/:keyword`, mockSearchController);
    await new Promise(res => {
      expressServer = app.listen(6061, () => {
        console.log(`Server running on port 6061`.bgCyan.white);
        res();
      });
    });
    axios.defaults.baseURL = 'http://localhost:6061';
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.setItem('cart', JSON.stringify(canned_cart))
  localStorageMock.setItem('auth', JSON.stringify(canned_auth))
});

afterEach(() => {
  localStorageMock.clear()
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await expressServer.close();
    process.env = original_env;
});

describe("Layout Component", () => {
  describe('successfully fetches categories from the database', () => {
    it("With extra database item", async () => {
      const toy_doc = new CategoryModel({
        name: 'Toy',
        slug: 'toy'
      });
      await toy_doc.save();

      const { findByTestId } = await act(async () => render(
        <RenderStack>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));


      const laptop = findByTestId('laptop-link')
      const phone = findByTestId('phone-link')
      const bookcases = findByTestId('book-cases-link')
      const toy = findByTestId('toy-link')
      await expect(laptop).resolves.toBeInTheDocument()
      await expect(phone).resolves.toBeInTheDocument()
      await expect(bookcases).resolves.toBeInTheDocument()
      await expect(toy).resolves.toBeInTheDocument()

      // cleanup - remove added document
      await CategoryModel.deleteOne(toy_doc)
    });
  
    it("With no added database item", async () => {
      const { findByTestId } = await act(async () => render(
        <RenderStack>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));

      const laptop = findByTestId('laptop-link')
      const phone = findByTestId('phone-link')
      const bookcases = findByTestId('book-cases-link')
      const toy = findByTestId('toy-link')
      await expect(laptop).resolves.toBeInTheDocument()
      await expect(phone).resolves.toBeInTheDocument()
      await expect(bookcases).resolves.toBeInTheDocument()
      await expect(toy).rejects.toThrow()
    });

    it("With no category items in DB", async () => {
      await CategoryModel.deleteMany({});

      const { findByTestId } = await act(async () => render(
        <RenderStack>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));

      const laptop = findByTestId('laptop-link')
      const phone = findByTestId('phone-link')
      const bookcases = findByTestId('book-cases-link')
      const toy = findByTestId('toy-link')
      await expect(laptop).rejects.toThrow()
      await expect(phone).rejects.toThrow()
      await expect(bookcases).rejects.toThrow()
      await expect(toy).rejects.toThrow()

      // cleanup
      category_docs = categories.map(x => new CategoryModel(x));
      await CategoryModel.bulkSave(category_docs);
    });
  });

  it("propagates Search results into the SearchContext", async () => {
    const spy = jest.spyOn(axios, "get")
    const { findByTestId, findByPlaceholderText, findByText } = await act(async () => render(
      <RenderStack>
        <ExpectValue/>
        <div data-testid="child">Child Content</div>
      </RenderStack>
    ));
    // use this to wait for the layout to complete render from backend.
    await findByTestId('laptop-link')
    const search_field = await findByPlaceholderText('Search', { selector: 'input' });
    const search_btn = await findByText('Search', { selector: 'button' });

    fireEvent.change(search_field, { target: { value: 'Football' } });
    fireEvent.click(search_btn);

    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('/api/v1/product/search/Football'));
    await waitFor(() => expect(mockSearchController).toHaveBeenCalled());
    const expect_value_keyword = findByText('Keyword: Football')
    const expect_value_result = findByText(JSON.stringify(['Football']))
    await expect(expect_value_keyword).resolves.toBeInTheDocument()
    await expect(expect_value_result).resolves.toBeInTheDocument()

    // cleanup
    spy.mockRestore()
  });

  describe('Auth localStorage', () => {
    afterEach(() => {
      localStorageMock.setItem('auth', JSON.stringify(canned_auth))
    })

    it("displays elements accordingly with an auth object in local storage", async () => {
      const { findByTestId, findByText } = await act(async () => render(
        <RenderStack>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));
      // use this to wait for the layout to complete render from backend.
      await findByTestId('laptop-link')
    
      const register = findByText('Register')
      const login = findByText('Login')
      const name = findByText('The Man')
      const logout = findByText('Logout')
      await expect(register).rejects.toThrow();
      await expect(login).rejects.toThrow();
      await expect(name).resolves.toBeVisible();
      await expect(logout).resolves.toBeVisible();
    });

    it("displays elements accordingly if no auth object is in local storage", async () => {
      localStorageMock.removeItem('auth');

      const { findByTestId, findByText } = await act(async () => render(
        <RenderStack>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));
      // use this to wait for the layout to complete render from backend.
      await findByTestId('laptop-link')
    
      const register = findByText('Register')
      const login = findByText('Login')
      const name = findByText('The Man')
      const logout = findByText('Logout')
      await expect(register).resolves.toBeVisible();
      await expect(login).resolves.toBeVisible();
      await expect(name).rejects.toThrow();
      await expect(logout).rejects.toThrow();
    });

    it("should delete the auth object on logout and update elements accordingly", async () => {
      const { findByTestId, findByText } = await act(async () => render(
        <RenderStack>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));
      // use this to wait for the layout to complete render from backend.
      await findByTestId('laptop-link')
      const logout = await findByText('Logout')

      fireEvent.click(logout)

      await waitFor(() => expect(localStorageMock.getItem('auth')).toBeFalsy());
      const register = findByText('Register')
      const login = findByText('Login')
      await expect(register).resolves.toBeVisible();
      await expect(login).resolves.toBeVisible();
    });
  })
  
  describe('Cart localStorage', () => {
    afterEach(() => {
      localStorageMock.setItem('cart', JSON.stringify(canned_cart))
    })

    it("displays the number of elements in the cart in the header", async () => {
      const { findByTestId } = await act(async () => render(
        <RenderStack>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));
      // use this to wait for the layout to complete render from backend.
      await findByTestId('laptop-link')
    
      const cart_badge = await findByTestId('badge')
      expect(cart_badge).toBeVisible();
      await waitFor(() => expect(cart_badge).toHaveTextContent('3'));
    });

    it("should successfully increase badge number as cart gets items added", async () => {
      const { findByTestId } = await act(async () => render(
        <RenderStack>
          <SetCartButton next_val={JSON.stringify(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'])}/>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));
      // use this to wait for the layout to complete render from backend.
      await findByTestId('laptop-link')
      const cart_badge = await findByTestId('badge')
      // confirm badge number is 3 before adding items to cart
      expect(cart_badge).toBeVisible();
      await waitFor(() => expect(cart_badge).toHaveTextContent('3'));

      const cart_btn = await findByTestId('set-cart-btn')
      fireEvent.click(cart_btn)

      await waitFor(() => expect(cart_badge).toHaveTextContent('5'));
    });

    it("should successfully decrease badge number as cart gets items removed", async () => {
      const { findByTestId } = await act(async () => render(
        <RenderStack>
          <SetCartButton next_val={JSON.stringify(['Item 1'])}/>
          <div data-testid="child">Child Content</div>
        </RenderStack>
      ));
      // use this to wait for the layout to complete render from backend.
      await findByTestId('laptop-link')
      const cart_badge = await findByTestId('badge')
      // confirm badge number is 3 before adding items to cart
      expect(cart_badge).toBeVisible();
      await waitFor(() => expect(cart_badge).toHaveTextContent('3'));

      const cart_btn = await findByTestId('set-cart-btn')
      fireEvent.click(cart_btn)
      
      await waitFor(() => expect(cart_badge).toHaveTextContent('1'));
    });
  })
});
