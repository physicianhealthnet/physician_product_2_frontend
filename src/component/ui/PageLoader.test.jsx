import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PageLoader from './PageLoader.jsx';

describe('PageLoader Component', () => {
  it('renders correctly', () => {
    render(<PageLoader />);
    
    // Check if the loading text is present
    expect(screen.getByText('Loading')).toBeInTheDocument();
    
    // Check if the container is present
    const loadingHeading = screen.getByText('Loading');
    expect(loadingHeading).toHaveClass('animate-pulse');
  });
});
