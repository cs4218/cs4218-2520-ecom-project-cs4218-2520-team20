import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

const renderWithRouter = (ui) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('Footer Component', () => {
  test('renders footer container', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const footerText = screen.getByText(/All Rights Reserved/i);

    // Assert
    expect(footerText).toBeInTheDocument();
  });

  test('displays correct copyright text', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const text = screen.getByText('All Rights Reserved © TestingComp');

    // Assert
    expect(text).toBeInTheDocument();
  });

  test('renders About link', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const aboutLink = screen.getByText('About');

    // Assert
    expect(aboutLink).toBeInTheDocument();
  });

  test('About link has correct route', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const aboutLink = screen.getByText('About');

    // Assert
    expect(aboutLink.closest('a')).toHaveAttribute('href', '/about');
  });

  test('renders Contact link', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const contactLink = screen.getByText('Contact');

    // Assert
    expect(contactLink).toBeInTheDocument();
  });

  test('Contact link has correct route', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const contactLink = screen.getByText('Contact');

    // Assert
    expect(contactLink.closest('a')).toHaveAttribute('href', '/contact');
  });

  test('renders Privacy Policy link', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const policyLink = screen.getByText('Privacy Policy');

    // Assert
    expect(policyLink).toBeInTheDocument();
  });

  test('Privacy Policy link has correct route', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const policyLink = screen.getByText('Privacy Policy');

    // Assert
    expect(policyLink.closest('a')).toHaveAttribute('href', '/policy');
  });

  test('renders exactly three navigation links', () => { // Alexander Setyawan, A0257149W
    // Arrange
    renderWithRouter(<Footer />);

    // Act
    const links = screen.getAllByRole('link');

    // Assert
    expect(links.length).toBe(3);
  });
});