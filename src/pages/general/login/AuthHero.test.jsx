import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AuthHero from './AuthHero.jsx';

describe('AuthHero Component', () => {
  it('renders the branding correctly', () => {
    render(<AuthHero />);
    expect(screen.getByText('Physician Health Net')).toBeInTheDocument();
    expect(screen.getByText('Your Clinic,')).toBeInTheDocument();
    expect(screen.getByText('Smarter.')).toBeInTheDocument();
  });

  it('renders the subtitle', () => {
    render(<AuthHero />);
    expect(screen.getByText(/The all-in-one clinic management platform/i)).toBeInTheDocument();
  });

  it('renders all the features', () => {
    render(<AuthHero />);
    expect(screen.getByText('Manage patient appointments effortlessly')).toBeInTheDocument();
    expect(screen.getByText('Coordinate across doctors, staff & roles')).toBeInTheDocument();
    expect(screen.getByText('Access patient records & billing in one place')).toBeInTheDocument();
    expect(screen.getByText('Track clinic performance & reports')).toBeInTheDocument();
  });

  it('renders the footer note', () => {
    render(<AuthHero />);
    expect(screen.getByText(/All Rights Reserved/i)).toBeInTheDocument();
  });
});
