// Wang Zhi Wren, A0255368U
import React from "react";
import { render, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils'
import * as Auth from "../../context/auth";
import { Outlet } from "react-router-dom";
import axios from "axios";
import Spinner from '../Spinner';
import PrivateRoute from './Private';

// CANNED RESPONSES
const canned_auth = {
    token: 'test_token_value'
}

const mock_provider = jest.fn()

// LAYOUT MOCKS
jest.mock('react-router-dom', () => ({
    Outlet: jest.fn((props) => (<div>Outlet</div>))
}));

jest.mock('../Spinner', () => ({
    __esModule: true,
    default: jest.fn((props) => (<div>Spinner</div>))
}))

// LIBRARY MOCKS
jest.mock('axios');

// HOOK MOCKS
const mock_auth = jest.spyOn(Auth, 'useAuth')

describe('Private Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should successfully render the Outlet element from the library when an auth token exists', async () => {
        mock_auth.mockReturnValue([canned_auth, mock_provider]);
        axios.get.mockResolvedValueOnce({ data: { ok: true } });

        await act(async () => { render(<PrivateRoute/>) });

        await waitFor(() => expect(axios.get).toHaveBeenCalled());
        expect(Outlet).toHaveBeenCalledTimes(1);
    });

    it('should not render the Outlet element when axios responds with no OK', async () => {
        mock_auth.mockReturnValue([canned_auth, mock_provider]);
        axios.get.mockResolvedValueOnce({ data: { ok: false } });

        await act(async () => { render(<PrivateRoute/>) });

        await waitFor(() => expect(axios.get).toHaveBeenCalled());
        expect(Outlet).not.toHaveBeenCalled();
        expect(Spinner).toHaveBeenCalledTimes(1);
    });

    it('should not render the Outlet element when an auth token does not exists', async () => {
        const empty_auth = { token: "" }
        mock_auth.mockReturnValueOnce([empty_auth, mock_provider]);

        await act(async () => { render(<PrivateRoute/>) });

        await waitFor(() => expect(axios.get).not.toHaveBeenCalled());
        expect(Outlet).not.toHaveBeenCalled();
        expect(Spinner).toHaveBeenCalledTimes(1);
    });

    it('should gracefully fail and render the Spinner element when axios encounters an error', async () => {
        mock_auth.mockReturnValueOnce([canned_auth, mock_provider]);
        axios.get.mockRejectedValueOnce('some network error');

        await act(async () => { render(<PrivateRoute/>) });

        await waitFor(() => expect(axios.get).toHaveBeenCalled());
        expect(Outlet).not.toHaveBeenCalled();
        expect(Spinner).toHaveBeenCalledTimes(1);
    });
})