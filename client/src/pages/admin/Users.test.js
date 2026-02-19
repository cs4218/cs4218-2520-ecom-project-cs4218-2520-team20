import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import Users from './Users';
import moment from 'moment'


// CANNED RESPONSES
const canned_auth = {
  token: 'test_token_value'
}
const timestamps = {
  default: '2026-01-01T08:00:00.000Z',
  now: '2026-01-14T08:00:00.000Z'
}

function construct_users(total, num_admins = 0) {
  const result = [];
  for (let i = 0; i < total; i++) {
    const id = i + 1
    result.push({
      _id: `${id}`,
      name: `Buzz Lightyear ${id}`,
      email: `${id}@${i < num_admins ? 'admin' : 'user'}.com`,
      phone: `1234567${id}`,
      address: `Aisle 7, Shelf 4, Section ${id}`,
      role: i < num_admins ? 1 : 0,
      createdAt: timestamps.default,
    });
  }
  return result;
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

jest.mock('../../components/AdminMenu', () => ({
  __esModule: true,
  default: () => (<div />)
}))

// LIBRARY MOCKS
jest.mock('axios');

// HOOK MOCKS
const mocked_setter = jest.fn()

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [canned_auth, mocked_setter])
}));

describe('Orders Component', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(timestamps.now));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.setSystemTime(jest.getRealSystemTime());
    jest.useRealTimers();
  });

  it('should not render table headers if no users are found', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

    const { queryAllByText } = await act(async () => render(<Users />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const header_name = queryAllByText('Name');
    const header_email = queryAllByText('Email');
    const header_phone = queryAllByText('Phone');
    const header_address = queryAllByText('Address');
    const header_role = queryAllByText('Role');
    const header_date = queryAllByText('Date Created');
    expect(header_name).toHaveLength(0);
    expect(header_email).toHaveLength(0);
    expect(header_phone).toHaveLength(0);
    expect(header_address).toHaveLength(0);
    expect(header_role).toHaveLength(0);
    expect(header_date).toHaveLength(0);
  });

  it('should display loading message when no users are found', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: [] } });

    const { queryAllByText } = await act(async () => render(<Users />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const loading_msg = queryAllByText('Loading list of users...');
    expect(loading_msg).toHaveLength(1);
  });

  it('should render exactly 1 set of table headers when there are users', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: construct_users(3) } });

    const { queryAllByText } = await act(async () => render(<Users />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const header_name = queryAllByText('Name');
    const header_email = queryAllByText('Email');
    const header_phone = queryAllByText('Phone');
    const header_address = queryAllByText('Address');
    const header_role = queryAllByText('Role');
    const header_date = queryAllByText('Date Created');
    expect(header_name).toHaveLength(1);
    expect(header_email).toHaveLength(1);
    expect(header_phone).toHaveLength(1);
    expect(header_address).toHaveLength(1);
    expect(header_role).toHaveLength(1);
    expect(header_date).toHaveLength(1);
  });

  it('should fail gracefully if axios fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('error string'));
    const spy = jest.spyOn(console, 'error').mockImplementation(x => { })

    const { queryAllByText } = await act(async () => render(<Users />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const loading_msg = queryAllByText('Loading list of users...');
    expect(loading_msg).toHaveLength(1);
    expect(console.error).toHaveBeenCalledWith('error string')

    spy.mockRestore()
  });

  it('should fail gracefully if axios returns false', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: false, message: 'error string' } });
    const spy = jest.spyOn(console, 'error').mockImplementation(x => { })

    const { queryAllByText } = await act(async () => render(<Users />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const loading_msg = queryAllByText('Loading list of users...');
    expect(loading_msg).toHaveLength(1);
    expect(console.error).toHaveBeenCalledWith('error string')

    spy.mockRestore()
  });

  it('should display order details of a successful order', async () => {
    axios.get.mockResolvedValueOnce({ data: { success: true, data: construct_users(3) } });

    const { queryAllByText } = await act(async () => render(<Users />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const roles = queryAllByText('User');
    const dates = queryAllByText('01/01/2026');
    expect(roles).toHaveLength(3);
    expect(dates).toHaveLength(3);

    for (let i = 1; i <= 3; i++) {
      const name = queryAllByText(`Buzz Lightyear ${i}`);
      const email = queryAllByText(`${i}@user.com`);
      const phone = queryAllByText(`1234567${i}`);
      const address = queryAllByText(`Aisle 7, Shelf 4, Section ${i}`);
      expect(name).toHaveLength(1);
      expect(email).toHaveLength(1);
      expect(phone).toHaveLength(1);
      expect(address).toHaveLength(1);
    }
  });

  describe('Role Rendering', () => {
    it('should display user role when role is 0', async () => {
      axios.get.mockResolvedValueOnce({ data: { success: true, data: construct_users(1) } });

      const { queryAllByText } = await act(async () => render(<Users />));
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      const user_roles = queryAllByText('User');
      expect(user_roles).toHaveLength(1);
    });

    it('should display admin role when role is 1', async () => {
      axios.get.mockResolvedValueOnce({ data: { success: true, data: construct_users(1, 1) } });

      const { queryAllByText } = await act(async () => render(<Users />));
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      const admin_roles = queryAllByText('Admin');
      expect(admin_roles).toHaveLength(1);
    });

    it('should display unknown role when role is -1', async () => {
      const modded_data = construct_users(1)
      modded_data[0].role = -1
      axios.get.mockResolvedValueOnce({ data: { success: true, data: modded_data } });
      const spy = jest.spyOn(console, 'error').mockImplementation(x => { })

      const { queryAllByText } = await act(async () => render(<Users />));
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      const unknown_roles = queryAllByText('Unknown');
      expect(unknown_roles).toHaveLength(1);

      spy.mockRestore()
    });

    it('should display unknown role when role is 2', async () => {
      const modded_data = construct_users(1)
      modded_data[0].role = 2
      axios.get.mockResolvedValueOnce({ data: { success: true, data: modded_data } });
      const spy = jest.spyOn(console, 'error').mockImplementation(x => { })

      const { queryAllByText } = await act(async () => render(<Users />));
      await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

      const unknown_roles = queryAllByText('Unknown');
      expect(unknown_roles).toHaveLength(1);

      spy.mockRestore()
    });
  });
});
