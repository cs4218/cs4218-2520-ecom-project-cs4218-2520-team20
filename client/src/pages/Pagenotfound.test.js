import { render, screen, fireEvent } from '@testing-library/react';
import Pagenotfound from './Pagenotfound';
import { BrowserRouter as Router, MemoryRouter } from 'react-router-dom';

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));

jest.mock('../hooks/useCategory', () => ({
    __esModule: true, // importing useCategory via ES Module
    default: jest.fn(() => [])
  }));

describe('Pagenotfound Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render 404 page with correct title', () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <Router>
        <Pagenotfound />
      </Router>
    );

    // Act
    const title = screen.getByText('404')
    const heading = screen.getByText('Oops ! Page Not Found')

    // Assert
    expect(title).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
  });

  test('should render "Go Back" button with correct link', () => { // Alexander Setyawan, A0257149W
    // Arrange
    render(
      <Router>
        <Pagenotfound />
      </Router>
    );

    // Act
    const goBackButton = screen.getByRole('link', { name: /Go Back/i });

    // Assert
    expect(goBackButton).toBeInTheDocument();
    expect(goBackButton).not.toBeDisabled();
    expect(goBackButton).toHaveAttribute('href', '/');
  });

  test('should navigate to home page on "Go Back" button click', () => { // Alexander Setyawan, A0257149W
    // Arrange
    const { getByRole } = render(
      <MemoryRouter initialEntries={['/404']}>
        <Pagenotfound />
      </MemoryRouter>
    );

    // Act
    fireEvent.click(getByRole('link', { name: /Go Back/i }));

    // Assert
    expect(window.location.pathname).toBe('/');
  });
});