import { render, screen, fireEvent } from '@testing-library/react';
import Header from './Header';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from "../context/auth";
import { useCart } from "../context/cart";
import { useSearch } from "../context/search";
import useCategory from "../hooks/useCategory";

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
  default: jest.fn(() => [
    { _id: '1', name: 'Electronics', slug: 'electronics' },
    { _id: '2', name: 'Books', slug: 'books' },
    { _id: '3', name: 'Clothing', slug: 'clothing' },
  ])
}));

const renderWithAuth = (authState) => {
  useAuth.mockReturnValue([authState, jest.fn()]);
  useCart.mockReturnValue([[], jest.fn()]);
  useSearch.mockReturnValue([{ keyword: "", results: [] }, jest.fn()]);
  useCategory.mockReturnValue([]);

  render(
    <Router>
      <Header />
    </Router>
  );
};

describe('Header Component', () => { // Alexander Setyawan, A0257149W
  it('renders the main container without crashing', () => {
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const navbar = screen.getByRole('navigation');

    // assert
    expect(navbar).toBeInTheDocument();
  });

  it('renders the "Virtual Vault" link correctly', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const virtualVaultLink = screen.getByText(/Virtual Vault/i);

    // assert
    expect(virtualVaultLink).toBeInTheDocument();
  });

  it('links to the correct route for "Virtual Vault"', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const virtualVaultLink = screen.getByText(/Virtual Vault/i);

    // assert
    expect(virtualVaultLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders SearchInput component correctly', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const searchInput = screen.getByRole('search');

    // assert
    expect(searchInput).toBeInTheDocument();
  });

  it('renders the "Home" link correctly', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const homeLink = screen.getByText(/Home/i);

    // assert
    expect(homeLink).toBeInTheDocument();
  });

  it('links to the correct route for "Home"', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const homeLink = screen.getByText(/Home/i);

    // assert
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders the "Categories" link correctly', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const categoriesLink = screen.getByTestId('categories-link');

    // assert
    expect(categoriesLink).toBeInTheDocument();
  });

  it('displays the dropdown when "Categories" is clicked', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const categoriesLink = screen.getByTestId('categories-link');
    fireEvent.click(categoriesLink);

    // assert
    const dropdownMenu = screen.getByTestId('categories-menu');
    expect(dropdownMenu).toBeInTheDocument();
  });

  it('displays the "All Categories" button in the dropdown', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    fireEvent.click(screen.getByTestId('categories-link'));

    // assert
    const allCategoriesButton = screen.getByTestId('all-categories-link')
    expect(allCategoriesButton).toBeInTheDocument();
  });

  it('displays all individual category buttons in the dropdown', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    fireEvent.click(screen.getByTestId('categories-link'));

    // assert
    const electronicsButton = screen.getByTestId('electronics-link')
    const booksButton = screen.getByTestId('books-link')
    const clothingButton = screen.getByTestId('clothing-link')

    expect(electronicsButton).toBeInTheDocument();
    expect(booksButton).toBeInTheDocument();
    expect(clothingButton).toBeInTheDocument();
  });

  it('displays "All Categories" link in the dropdown', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    fireEvent.click(screen.getByTestId('categories-link'));

    // assert
    const allCategoriesLink = screen.getByText(/All Categories/i);
    expect(allCategoriesLink).toBeInTheDocument();
  });

  it('displays all individual category links in the dropdown', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    fireEvent.click(screen.getByTestId('categories-link'));

    // assert
    const electronicsButton = screen.getByTestId('electronics-link')
    const booksButton = screen.getByTestId('books-link')
    const clothingButton = screen.getByTestId('clothing-link')

    expect(electronicsButton).toHaveTextContent('Electronics');
    expect(booksButton).toHaveTextContent('Books');
    expect(clothingButton).toHaveTextContent('Clothing');
  });

  it('has correct href attributes for individual categories', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    fireEvent.click(screen.getByTestId('categories-link'));

    // assert
    const electronicsLink = screen.getByText('Electronics').closest('a');
    const booksLink = screen.getByText('Books').closest('a');
    const clothingLink = screen.getByText('Clothing').closest('a');
    expect(electronicsLink).toHaveAttribute('href', '/category/electronics');
    expect(booksLink).toHaveAttribute('href', '/category/books');
    expect(clothingLink).toHaveAttribute('href', '/category/clothing');
  });

  it('renders the "Register" link correctly when user is not logged in', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const registerLink = screen.getByText(/Register/i);

    // assert
    expect(registerLink).toBeInTheDocument();
  });

  it('ensures the "Register" link has the correct route when user is not logged in', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const registerLink = screen.getByText(/Register/i);

    // assert
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });

  it('renders the "Login" link correctly when user is not logged in', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const loginLink = screen.getByText(/Login/i);

    // assert
    expect(loginLink).toBeInTheDocument();
  });

  it('ensures the "Login" link has the correct route when user is not logged in', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const loginLink = screen.getByText(/Login/i);

    // assert
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it("renders username button correctly when user is logged in", () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Alice Admin",
        email: "alice@example.com",
        phone: "123",
      },
    });

    // act
    const usernameButton = screen.getByText(/Alice Admin/i);

    // assert
    expect(usernameButton).toBeInTheDocument();
  });

  it("displays the dropdown list when username button is clicked", () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Alice Admin",
        email: "alice@example.com",
        phone: "123",
      },
    });

    // act
    fireEvent.click(screen.getByText(/Alice Admin/i));

    // assert
    const dropdownMenu = screen.getByTestId('dashboard-menu');
    expect(dropdownMenu).toBeInTheDocument();
  });

  it('renders the "Dashboard" button correctly for admin', () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Alice Admin",
        email: "alice@example.com",
        phone: "123",
        role: 1,
      },
    });

    // act
    fireEvent.click(screen.getByText(/Alice Admin/i));

    // assert
    const dashboardButton = screen.getByText(/Dashboard/i);
    expect(dashboardButton).toBeInTheDocument();
  });

  it('ensures the "Dashboard" button has the correct route for admin', () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Alice Admin",
        email: "alice@example.com",
        phone: "123",
        role: 1,
      },
    });

    // act
    fireEvent.click(screen.getByText(/Alice Admin/i));

    // assert
    const dashboardButton = screen.getByText(/Dashboard/i);
    expect(dashboardButton.closest('a')).toHaveAttribute('href', '/dashboard/admin');
  });

  it('renders the "Dashboard" button correctly for user', () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Bob User",
        email: "bob@example.com",
        phone: "456",
        role: 0,
      },
    });

    // act
    fireEvent.click(screen.getByText(/Bob User/i));

    // assert
    const dashboardButton = screen.getByText(/Dashboard/i);
    expect(dashboardButton).toBeInTheDocument();
  });

  it('ensures the "Dashboard" button has the correct route for user', () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Bob User",
        email: "bob@example.com",
        phone: "456",
        role: 0,
      },
    });

    // act
    fireEvent.click(screen.getByText(/Bob User/i));

    // assert
    const dashboardButton = screen.getByText(/Dashboard/i);
    expect(dashboardButton.closest('a')).toHaveAttribute('href', '/dashboard/user');
  });

  it('renders the "Logout" button correctly', () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Alice Admin",
        email: "alice@example.com",
        phone: "123",
        role: 0,
      },
    });

    // act
    fireEvent.click(screen.getByText(/Alice Admin/i));

    // assert
    const logoutButton = screen.getByText(/Logout/i);
    expect(logoutButton).toBeInTheDocument();
  });

  it('ensures the "Logout" button has the correct route', () => { // Alexander Setyawan, A0257149W
    // arrange
    renderWithAuth({
      user: {
        name: "Alice Admin",
        email: "alice@example.com",
        phone: "123",
        role: 0,
      },
    });

    // act
    fireEvent.click(screen.getByText(/Alice Admin/i));

    // assert
    const logoutButton = screen.getByText(/Logout/i);
    expect(logoutButton.closest('a')).toHaveAttribute('href', '/login');
  });

  it('renders the "Cart" link correctly', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const cartLink = screen.getByText(/Cart/i);

    // assert
    expect(cartLink).toBeInTheDocument();
  });

  it('ensures the "Cart" link has the correct route', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const cartLink = screen.getByText(/Cart/i);

    // assert
    expect(cartLink.closest('a')).toHaveAttribute('href', '/cart');
  });

  it('shows a badge count of 0 when the cart is empty', () => { // Alexander Setyawan, A0257149W
    // arrange
    render(
      <Router>
        <Header />
      </Router>
    );

    // act
    const badge = screen.getByTestId("badge")

    // assert
    expect(badge).toHaveTextContent('0');
  });

  it('shows a badge count greater than 0 when the cart has items', () => { // Alexander Setyawan, A0257149W
    // arrange
    useCart.mockReturnValue([[{ id: 1, name: "Product 1", quantity: 1 }], jest.fn()]);
    
    // act
    render(
      <Router>
        <Header />
      </Router>
    );

    // assert
    const badge = screen.getByTestId("badge")
    expect(badge).not.toHaveTextContent('0');
    expect(badge).toHaveTextContent('1');
  });
});