import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Profile from './Profile';

// CANNED RESPONSES
const canned_auth = {
    user: {
        name: 'John Doe',
        phone: '12345678',
        email: 'a@b.com',
        address: 'P. Sherman, 42 Wallaby Way, Sydney'
    },
    token: 'test_token_value'
}

const update_user = {
    name: 'John Snow',
    phone: '87654321',
    email: 'c@d.com',
    address: '221B Baker St., London',
    password: 'updated_password'
}
// LAYOUT MOCKS
jest.mock('../../components/Layout', () => ({
    __esModule: true,
    default: ({ children, title, description, keywords, author }) => (
        <div>
            {children}
        </div>
    )
}))

jest.mock('../../components/UserMenu', () => ({
    __esModule: true,
    default: () => (<div/>)
}))

// LIBRARY MOCKS
jest.mock('axios');
jest.mock('react-hot-toast');
jest.spyOn(JSON, 'parse').mockImplementation(jest.fn(() => canned_auth))
jest.spyOn(JSON, 'stringify').mockImplementation(jest.fn())

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

// HOOK MOCKS
const mocked_setter = jest.fn()

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [canned_auth, mocked_setter])
}));

describe('Profile Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render user data successfully', () => {
        const { getByPlaceholderText } = render(<Profile/>);
        expect(getByPlaceholderText('Enter Your Name').value).toBe(canned_auth.user.name);
        expect(getByPlaceholderText('Enter Your Email').value).toBe(canned_auth.user.email);
        expect(getByPlaceholderText('Enter Your Password').value).toBeFalsy()
        expect(getByPlaceholderText('Enter Your Phone').value).toBe(canned_auth.user.phone);
        expect(getByPlaceholderText('Enter Your Address').value).toBe(canned_auth.user.address);
    });

    describe('PUT Requests when pressing Update', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should be made exactly once', async () => {
            const { getByText } = render(<Profile/>);
            fireEvent.click(getByText('UPDATE'));
            await waitFor(() => expect(axios.put).toHaveBeenCalledTimes(1));
        });

        it('can be made with an updated name field', async () => {
            const { getByPlaceholderText, getByText } = render(<Profile/>);

            fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: update_user.name } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalled());
            const params = axios.put.mock.calls[0][1];
            expect(params).toHaveProperty('name', update_user.name);
        });

        it('can be made with an updated email field', async () => {
            const { getByPlaceholderText, getByText } = render(<Profile/>);

            fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: update_user.email } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalled());
            const params = axios.put.mock.calls[0][1];
            expect(params).toHaveProperty('email', update_user.email);
        });

        it('can be made with an updated password field', async () => {
            const { getByPlaceholderText, getByText } = render(<Profile/>);

            fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: update_user.password } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalled());
            const params = axios.put.mock.calls[0][1];
            expect(params).toHaveProperty('password', update_user.password);
        });

        it('can be made with an updated phone field', async () => {
            const { getByPlaceholderText, getByText } = render(<Profile/>);

            fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: update_user.phone } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalled());
            const params = axios.put.mock.calls[0][1];
            expect(params).toHaveProperty('phone', update_user.phone);
        });

        it('can be made with an updated address field', async () => {
            const { getByPlaceholderText, getByText } = render(<Profile/>);

            fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: update_user.address } });
            fireEvent.click(getByText('UPDATE'));

            await waitFor(() => expect(axios.put).toHaveBeenCalled());
            const params = axios.put.mock.calls[0][1];
            expect(params).toHaveProperty('address', update_user.address);
        });
    })
})
