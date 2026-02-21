import { render, screen } from '@testing-library/react';
import About from './About';
import Layout from './../components/Layout';
import React from 'react';

jest.mock('./../components/Layout', () => {
  return ({ title, children }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
});

describe('About Component', () => {
  it('renders the About component and displays the correct title', () => { // Alexander Setyawan, A0257149W
    // Arrange
    const expectedTitle = 'About us - Ecommerce app';

    // Act
    render(<About />);

    // Assert
    expect(screen.getByText(expectedTitle)).toBeInTheDocument();
  });

  it('displays the correct image', () => { // Alexander Setyawan, A0257149W
    // Arrange
    const imageAltText = 'contactus';
    const imageSrc = '/images/about.jpeg';

    // Act
    render(<About />);

    // Assert
    const imgElement = screen.getByAltText(imageAltText);
    expect(imgElement).toBeInTheDocument();
    expect(imgElement).toHaveAttribute('src', imageSrc);
  });

  it('should render text content correctly', () => { // Alexander Setyawan, A0257149W
    // Arrange
    const expectedText = 'Add text';

    // Act
    render(<About />);

    // Assert
    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });

  it('should contain an image in the first column', () => { // Alexander Setyawan, A0257149W
    // Arrange
    const imageAltText = 'contactus';

    // Act
    render(<About />);

    // Assert
    const imageElement = screen.getByAltText(imageAltText);
    expect(imageElement).toBeInTheDocument();
  });

  it('should not crash if Layout component has no children', () => { // Alexander Setyawan, A0257149W
    // Arrange
    jest.mock('./../components/Layout', () => () => null);

    // Act
    render(<About />);

    // Assert
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});