// Wang Zhi Wren, A0255368U
import React from 'react';
import { act, render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import '@testing-library/jest-dom/extend-expect';
import Orders from './Orders';
import moment from 'moment'


// CANNED RESPONSES
const canned_auth = {
  token: 'test_token_value'
}
const timestamps = {
  default: '2026-01-01T00:00:00.000Z',
  now: '2026-01-02T00:00:00.000Z'
}

function construct_products(number, unique = true) {
  const result = [];
  for (let i = 0; i < number; i++) {
    result.push({
      _id: `${unique ? i : number}`,
      name: `Name ${unique ? i : number}`,
      description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
      price: (unique ? i : number) + 1
    });
  }
  return result;
}

function construct_order(id, success = true, num_products = 1, unique = true) {
  return {
    _id: id,
    status: `Test ${id}`,
    buyer: { name: 'John Doe' },
    createdAt: timestamps.default,
    payment: { success: success },
    products: construct_products(num_products, unique)
  }
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

  it('should not render table headers if orders are empty', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const { queryAllByText } = await act(async () => render(<Orders />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const header_no = queryAllByText('#')
    const header_status = queryAllByText('Status')
    const header_buyer = queryAllByText('Buyer')
    const header_date = queryAllByText('Date')
    const header_payment = queryAllByText('Payment')
    const header_quantity = queryAllByText('Quantity')
    expect(header_no).toHaveLength(0)
    expect(header_status).toHaveLength(0)
    expect(header_buyer).toHaveLength(0)
    expect(header_date).toHaveLength(0)
    expect(header_payment).toHaveLength(0)
    expect(header_quantity).toHaveLength(0)
  })

  it('should render table headers when there are orders', async () => {
    axios.get.mockResolvedValueOnce({
      data: [
        construct_order(1), construct_order(2), construct_order(3)
      ]
    });

    const { queryAllByText } = await act(async () => render(<Orders />));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    const header_no = queryAllByText('#')
    const header_status = queryAllByText('Status')
    const header_buyer = queryAllByText('Buyer')
    const header_date = queryAllByText('Date')
    const header_payment = queryAllByText('Payment')
    const header_quantity = queryAllByText('Quantity')
    expect(header_no).toHaveLength(3)
    expect(header_status).toHaveLength(3)
    expect(header_buyer).toHaveLength(3)
    expect(header_date).toHaveLength(3)
    expect(header_payment).toHaveLength(3)
    expect(header_quantity).toHaveLength(3)
  });

  it('should fail gracefully if axios fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('error string'));
    const spy = jest.spyOn(console, 'log').mockImplementation(x => { })

    const { queryAllByText } = await act(async () => render(<Orders />));

    const header_no = queryAllByText('#')
    const header_status = queryAllByText('Status')
    const header_buyer = queryAllByText('Buyer')
    const header_date = queryAllByText('Date')
    const header_payment = queryAllByText('Payment')
    const header_quantity = queryAllByText('Quantity')
    expect(header_no).toHaveLength(0)
    expect(header_status).toHaveLength(0)
    expect(header_buyer).toHaveLength(0)
    expect(header_date).toHaveLength(0)
    expect(header_payment).toHaveLength(0)
    expect(header_quantity).toHaveLength(0)
    expect(console.log).toHaveBeenCalledWith('error string')

    spy.mockRestore()
  });

  it('should display order details of a successful order', async () => {
    const order = construct_order(1)
    axios.get.mockResolvedValueOnce({ data: [order] });

    const { getAllByText, getByText } = await act(async () => render(<Orders />));

    expect(getAllByText('1')).toHaveLength(2);
    expect(getByText(`${order.status}`)).toBeDefined();
    expect(getByText('John Doe')).toBeDefined();
    expect(getByText('a day ago')).toBeDefined();
    expect(getByText('Success')).toBeDefined();
  });

  it('should display order details of a failed order', async () => {
    const order = construct_order(1, false)
    axios.get.mockResolvedValueOnce({ data: [order] });

    const { getAllByText, getByText } = await act(async () => render(<Orders />));

    expect(getAllByText('1')).toHaveLength(2);
    expect(getByText(`${order.status}`)).toBeDefined();
    expect(getByText('John Doe')).toBeDefined();
    expect(getByText('a day ago')).toBeDefined();
    expect(getByText('Failed')).toBeDefined();
  });

  it('should display multiple order details', async () => {
    const order_1 = construct_order(1)
    const order_2 = construct_order(2)
    const order_3 = construct_order(3)
    axios.get.mockResolvedValueOnce({ data: [order_1, order_2, order_3] });

    const { getAllByText, getByText } = await act(async () => render(<Orders />));

    expect(getAllByText('1')).toHaveLength(4);
    expect(getAllByText('2')).toHaveLength(1);
    expect(getAllByText('3')).toHaveLength(1);
    expect(getByText(`Test 1`)).toBeDefined();
    expect(getByText(`Test 2`)).toBeDefined();
    expect(getByText(`Test 3`)).toBeDefined();
    expect(getAllByText('John Doe')).toHaveLength(3);
  });

  it('should display order details of a successful order with multiple products', async () => {
    const order = construct_order(1, true, 3, false)
    axios.get.mockResolvedValueOnce({ data: [order] });

    const { getAllByText } = await act(async () => render(<Orders />));

    expect(getAllByText('1')).toHaveLength(1);
    expect(getAllByText(`Test 1`)).toHaveLength(1);
    expect(getAllByText('John Doe')).toHaveLength(1);
    expect(getAllByText('a day ago')).toHaveLength(1);
    expect(getAllByText('Success')).toHaveLength(1);
    expect(getAllByText('3')).toHaveLength(1);
  });

  it('should display (non-unique) product details of a successful order', async () => {
    const order = construct_order(1, true, 3, false)
    axios.get.mockResolvedValueOnce({ data: [order] });
    const expected_desc = `Lorem ipsum dolor sit amet, co`

    const { getAllByText } = await act(async () => render(<Orders />));

    expect(getAllByText('Name 3')).toHaveLength(3);
    expect(getAllByText(expected_desc)).toHaveLength(3);
    expect(getAllByText('Price : 4')).toHaveLength(3);
  });
});
