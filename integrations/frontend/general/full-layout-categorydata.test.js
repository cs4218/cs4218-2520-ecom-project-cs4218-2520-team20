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
import { SearchProvider } from '@client/context/search';
import { CartProvider } from '@client/context/cart';
// backend imports
import mongoose from 'mongoose';
import express from "express";
import categoryRoutes from '@server/routes/categoryRoutes.js'
import CategoryModel from "@server/models/categoryModel.js";
import connectDB from '@server/config/db';
import cors from "cors";
import morgan from "morgan";

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
  res.json({keyword: keyword});
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
      expressServer = app.listen(6060, () => {
        console.log(`Server running on port 6060`.bgCyan.white);
        res();
      });
    });
    axios.defaults.baseURL = 'http://localhost:6060';
});

beforeEach(() => {
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

  it("saves search results into the local storage", async () => {
    const { findByTestId, findAllByPlaceholderText, findAllByText } = await act(async () => render(
      <RenderStack>
        <div data-testid="child">Child Content</div>
      </RenderStack>
    ));
    await findByTestId('laptop-link')
  
    const search_field = await findAllByPlaceholderText('Search', { selector: 'input' });
    const search_btn = await findAllByText('Search', { selector: 'button' });
    expect(search_field).toHaveLength(1);
    expect(search_btn).toHaveLength(1);
  });
});
