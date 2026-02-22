// Wang Zhi Wren, A0255368U
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Dashboard from './Dashboard';
import { useAuth } from '../../context/auth';

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

// HOOK MOCKS
const mocked_setter = jest.fn()

jest.mock('../../context/auth', () => ({
  useAuth: jest.fn(() => [canned_auth, mocked_setter])
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render user data successfully', () => {
    const { getByText } = render(<Dashboard />);

    expect(getByText('John Doe')).toBeDefined();
    expect(getByText('12345678')).toBeDefined();
    expect(getByText('a@b.com')).toBeDefined();
    expect(getByText('P. Sherman, 42 Wallaby Way, Sydney')).toBeDefined();
  });

  it('should not render data if no user is found', async () => {
    useAuth.mockReturnValueOnce([{user: {}}, mocked_setter])

    const { queryByText } = render(<Dashboard />);

    expect(queryByText('John Doe')).toBeNull();
    expect(queryByText('12345678')).toBeNull();
    expect(queryByText('a@b.com')).toBeNull();
    expect(queryByText('P. Sherman, 42 Wallaby Way, Sydney')).toBeNull();
  });
})
