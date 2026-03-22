// Wang Zhi Wren, A0255368U
// frontend imports
import React from 'react';
import "@testing-library/jest-dom";
import axios from "axios";
import { act, render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@client/context/auth';
import Profile from '@client/pages/user/Profile';
import toast from "react-hot-toast";
// backend imports
import mongoose from 'mongoose';
import express from "express";
import authRoutes from '@server/routes/authRoute'
import UserModel from "@server/models/userModel";
import connectDB from '@server/config/db';
import JWT from 'jsonwebtoken'
import cors from "cors";
import morgan from "morgan";

window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

// LAYOUT MOCKS
jest.mock('@client/components/Layout', () => ({
  __esModule: true,
  default: ({ children, title, description, keywords, author }) => (
    <div>
      {children}
    </div>
  )
}))

jest.mock('@client/components/UserMenu', () => ({
  __esModule: true,
  default: () => (<div />)
}))

// mongo-db-memory server workaround
const MongoMemoryServer = global.MongoMemoryServer

// dummy jwt secret
const DUMMY_JWT_SECRET = 'PQOW1564QESD7813AS2';

// db + backend setup
const user = {
    name: 'The Man',
    email: 'email@1',
    password: 'Some Password Hash',
    phone: '987654321',
    address: 'Address #1',
    answer: 'A',
    role: 0,
};
let user_docs = new UserModel(user)
const original_env = Object.assign({}, process.env);
let mongoServer;
let app;
let expressServer;

// canned response
function init_auth_user() {
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
  }
}

let user_token = JWT.sign({ _id: user_docs._id }, DUMMY_JWT_SECRET)
let canned_auth = {
  user: init_auth_user(),
  token: user_token,
}

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
function RenderStack() {
  return (
    <AuthProvider>
      <MemoryRouter>
        <Profile/>
      </MemoryRouter>
    </AuthProvider>
  );
};

beforeAll(async () => {
    jest.resetModules();

    process.env.JWT_SECRET = DUMMY_JWT_SECRET

    mongoServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongoServer.getUri()
    await connectDB();
    await user_docs.save();

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use(morgan('dev'));
    app.use("/api/v1/auth", authRoutes);
    await new Promise(res => {
      expressServer = app.listen(6062, () => {
        console.log(`Server running on port 6062`.bgCyan.white);
        res();
      });
    });
    axios.defaults.baseURL = 'http://localhost:6062';
    localStorageMock.setItem('auth', JSON.stringify(canned_auth))
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    await expressServer.close();
    process.env = original_env;
});

describe("Profile component", () => {
  it("Populates with data from the local storage", async () => {
    const { getByPlaceholderText } = await act(async () => render(
      <RenderStack/>
    ));

    await waitFor(() => expect(getByPlaceholderText('Enter Your Name').value).toBe(canned_auth.user.name))
    await waitFor(() => expect(getByPlaceholderText('Enter Your Email').value).toBe(canned_auth.user.email))
    await waitFor(() => expect(getByPlaceholderText('Enter Your Phone').value).toBe(canned_auth.user.phone))
    await waitFor(() => expect(getByPlaceholderText('Enter Your Address').value).toBe(canned_auth.user.address))
    await waitFor(() => expect(getByPlaceholderText('Enter Your Password').value).toBeFalsy())
  });

  describe("Update to DB", () => {
    afterEach(async () => {
      await UserModel.deleteMany({});
      user_docs = new UserModel(user);
      const save_req = user_docs.save();
      user_token = JWT.sign({ _id: user_docs._id }, DUMMY_JWT_SECRET);
      canned_auth = {
        user: init_auth_user(),
        token: user_token,
      };
      localStorageMock.setItem('auth', JSON.stringify(canned_auth));
      await save_req;
    });

    it('should not make changes to the DB if update is pressed without any changes to the fields', async () => {
      const spy = jest.spyOn(toast, "success");
      const { getByPlaceholderText, getByText } = await act(async () => render(
        <RenderStack/>
      ));
      await waitFor(() => expect(getByPlaceholderText('Enter Your Name').value).toBe(canned_auth.user.name))

      fireEvent.click(getByText('UPDATE'));

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      // there should still be an exact match
      const full_db = UserModel.find({});
      const entry = UserModel.find(user);
      await expect(full_db).resolves.toHaveLength(1);
      await expect(entry).resolves.toHaveLength(1);

      // cleanup - remove spy
      spy.mockRestore()
    })

    it('should not make changes to the DB if no data is fed through the page', async () => {
      const spy = jest.spyOn(toast, "success");
      const { getByPlaceholderText, getByText } = await act(async () => render(
        <RenderStack/>
      ));
      await waitFor(() => expect(getByPlaceholderText('Enter Your Name').value).toBe(canned_auth.user.name))

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: '' } });
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: '' } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '' } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '' } });
      fireEvent.click(getByText('UPDATE'));

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      // there should still be an exact match
      const full_db = UserModel.find({});
      const entry = UserModel.find(user);
      await expect(full_db).resolves.toHaveLength(1);
      await expect(entry).resolves.toHaveLength(1);

      // cleanup - remove spy
      spy.mockRestore()
    })
    
    it('should make changes to the DB if data is fed into the fields', async () => {
      const spy = jest.spyOn(toast, "success");
      const update_user = {
          name: 'The Other Man',
          phone: '65423845',
          address: 'Address #2',
      };
      const { getByPlaceholderText, getByText } = await act(async () => render(
        <RenderStack/>
      ));
      await waitFor(() => expect(getByPlaceholderText('Enter Your Name').value).toBe(canned_auth.user.name))

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: update_user.name } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: update_user.phone } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: update_user.address } });
      fireEvent.click(getByText('UPDATE'));

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      // there should only be one entry in the DB
      const full_db = UserModel.find({});
      const entry = UserModel.find(update_user);
      const old = UserModel.find(user);
      await expect(full_db).resolves.toHaveLength(1);
      await expect(entry).resolves.toHaveLength(1);
      await expect(old).resolves.toHaveLength(0);

      // cleanup - remove spy
      spy.mockRestore()
    })

    it('should update the local storage properly after changes are made to the DB', async () => {
      const spy = jest.spyOn(toast, "success");
      const update_user = {
          name: 'The Other Man',
          phone: '65423845',
          address: 'Address #2',
      };
      const { getByPlaceholderText, getByText } = await act(async () => render(
        <RenderStack/>
      ));
      await waitFor(() => expect(getByPlaceholderText('Enter Your Name').value).toBe(canned_auth.user.name))

      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: update_user.name } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: update_user.phone } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: update_user.address } });
      fireEvent.click(getByText('UPDATE'));

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      const ls_auth = JSON.parse(localStorage.getItem('auth'));
      expect(ls_auth).toHaveProperty('token', user_token);
      expect(ls_auth).toHaveProperty('user');
      const ls_user = ls_auth.user;
      // this is a contract from the login controller
      expect(ls_user).toHaveProperty('_id', `${user_docs._id}`);
      expect(ls_user).toHaveProperty('name', 'The Other Man');
      expect(ls_user).toHaveProperty('email', 'email@1');
      expect(ls_user).toHaveProperty('phone', '65423845');
      expect(ls_user).toHaveProperty('address', 'Address #2');
      expect(ls_user).toHaveProperty('role', 0);

      // cleanup - remove spy
      spy.mockRestore()
    })
  })

  describe("Check -ve Saves to Local Storage", () => {
    const update_user = {
        name: 'The Other Man',
        phone: '65423845',
        address: 'Address #2',
    };

    const runArrange = async () => {
      const spy = jest.spyOn(toast, "success");
      const { getByPlaceholderText, getByText } = await act(async () => render(
        <RenderStack/>
      ));
      await waitFor(() => expect(getByPlaceholderText('Enter Your Name').value).toBe(canned_auth.user.name))
      return [ spy, getByPlaceholderText, getByText ]
    }

    const runAct = async (getByPlaceholderText, getByText) => {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: update_user.name } });
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: update_user.phone } });
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: update_user.address } });
      fireEvent.click(getByText('UPDATE'));
      await waitFor(() => expect(toast.success).toHaveBeenCalled());
    }

    afterEach(async () => {
      await UserModel.deleteMany({});
      user_docs = new UserModel(user);
      const save_req = user_docs.save();
      user_token = JWT.sign({ _id: user_docs._id }, DUMMY_JWT_SECRET);
      canned_auth = {
        user: init_auth_user(),
        token: user_token,
      };
      localStorageMock.setItem('auth', JSON.stringify(canned_auth));
      await save_req;
    });

    it('should not store password hash', async () => {
      const [ spy, getByPlaceholderText, getByText ] = await runArrange()

      await runAct(getByPlaceholderText, getByText)

      const ls_auth = JSON.parse(localStorage.getItem('auth'));
      expect(ls_auth).toHaveProperty('user');
      const ls_user = ls_auth.user;
      expect(ls_user).not.toHaveProperty('password');

      // cleanup - remove spy
      spy.mockRestore()
    })

    it('should not store answer to security question', async () => {
      const [ spy, getByPlaceholderText, getByText ] = await runArrange()

      await runAct(getByPlaceholderText, getByText)

      const ls_auth = JSON.parse(localStorage.getItem('auth'));
      expect(ls_auth).toHaveProperty('user');
      const ls_user = ls_auth.user;
      expect(ls_user).not.toHaveProperty('password');

      // cleanup - remove spy
      spy.mockRestore()
    })
  })
});
