import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';

// Nigel Lee, A0259264W
// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));

// Lab 2 Solution
jest.mock('../../hooks/useCategory', () => ({
    __esModule: true, 
    default: jest.fn(() => [])
  }));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
      

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText, container } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '123456789' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    
    const dobInput = container.querySelector('#exampleInputDOB1');
    fireEvent.change(dobInput, { target: { value: '2000-01-01' } });
    
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Register Successfully, please login');
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it('should display error message on failed registration', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });

    const { getByText, getByPlaceholderText, container } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John Doe' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '123456789' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    
    const dobInput = container.querySelector('#exampleInputDOB1');
    fireEvent.change(dobInput, { target: { value: '2000-01-01' } });

    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    console.error.mockRestore();
  });

  it('should not call API if fields are missing or only spaces', async () => {
    const { getByText, getByPlaceholderText, container } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '123456789' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: '123 Street' } });
    fireEvent.change(container.querySelector('#exampleInputDOB1'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Football' } });

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: '   ' } });

    fireEvent.click(getByText('REGISTER'));

    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/fill all required fields/i));
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('should show error toast if password is less than 6 characters', async () => {
    const { getByText, getByPlaceholderText, container } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>
    );

    const inputs = [
        { label: 'Enter Your Name', val: 'John' },
        { label: 'Enter Your Email', val: 'john@example.com' },
        { label: 'Enter Your Password', val: '12345' },
        { label: 'Enter Your Phone', val: '123456789' },
        { label: 'Enter Your Address', val: '123 Street' },
        { label: 'What is Your Favorite sports', val: 'Football' }
    ];

    inputs.forEach(i => fireEvent.change(getByPlaceholderText(i.label), { target: { value: i.val } }));
    fireEvent.change(container.querySelector('#exampleInputDOB1'), { target: { value: '2000-01-01' } });

    fireEvent.click(getByText('REGISTER'));

    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("at least 6 characters"));
    expect(axios.post).not.toBeCalled();
  });

  it('should trim whitespace from input fields before sending to API', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText, container } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>
    );

    const dirtyData = {
        name: '  John Doe  ',
        email: ' john@example.com ',
        phone: ' 123456789 ',
        address: ' 123 Street ',
        answer: ' Football '
    };

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: dirtyData.name } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: dirtyData.email } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: dirtyData.phone } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: dirtyData.address } });
    fireEvent.change(container.querySelector('#exampleInputDOB1'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: dirtyData.answer } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123456789',
          address: '123 Street',
          answer: 'Football'
        })
      );
    });
  });

  it('should display server error message when success is false', async () => {
    const errorMsg = 'Email already registered';
    axios.post.mockResolvedValueOnce({ 
        data: { success: false, message: errorMsg } 
    });

    const { getByText, getByPlaceholderText, container } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: 'John' } });
    fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: 'password123' } });
    fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: '123456789' } });
    fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: 'Street' } });
    fireEvent.change(container.querySelector('#exampleInputDOB1'), { target: { value: '2000-01-01' } });
    fireEvent.change(getByPlaceholderText('What is Your Favorite sports'), { target: { value: 'Sport' } });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(errorMsg);
  });
});