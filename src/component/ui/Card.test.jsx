import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Card from './Card.jsx';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Card title="My Card">Content</Card>);
    expect(screen.getByText('My Card')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders action when provided', () => {
    render(<Card action={<button>Click Me</button>}>Content</Card>);
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
  });

  it('applies custom classes to root element', () => {
    render(<Card className="custom-card-class">Content</Card>);
    const content = screen.getByText('Content');
    expect(content.parentElement).toHaveClass('custom-card-class');
  });

  it('does not render header section if title and action are not provided', () => {
    const { container } = render(<Card>Content</Card>);
    // The header has border-b class
    expect(container.querySelector('.border-b')).not.toBeInTheDocument();
  });
});
