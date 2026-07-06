import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardWrapper from './DashboardWrapper.jsx';

// Mock the child components to verify which one is rendered
vi.mock('../pages/doctor/home/DoctorDashboard', () => ({
  default: () => <div data-testid="doctor-dashboard">Doctor Dashboard Mock</div>
}));

vi.mock('../pages/receptionist/home/ReceptionistDashboard', () => ({
  default: () => <div data-testid="receptionist-dashboard">Receptionist Dashboard Mock</div>
}));

describe('DashboardWrapper Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders ReceptionistDashboard when role is receptionist', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'receptionist' }));
    
    render(<DashboardWrapper />);
    
    expect(screen.getByTestId('receptionist-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('doctor-dashboard')).not.toBeInTheDocument();
  });

  it('renders ReceptionistDashboard when role is staff', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'staff' }));
    
    render(<DashboardWrapper />);
    
    expect(screen.getByTestId('receptionist-dashboard')).toBeInTheDocument();
  });

  it('renders DoctorDashboard when role is doctor', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'doctor' }));
    
    render(<DashboardWrapper />);
    
    expect(screen.getByTestId('doctor-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('receptionist-dashboard')).not.toBeInTheDocument();
  });

  it('renders DoctorDashboard when role is master (default fallback)', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'master' }));
    
    render(<DashboardWrapper />);
    
    expect(screen.getByTestId('doctor-dashboard')).toBeInTheDocument();
  });

  it('renders DoctorDashboard when sessionStorage throws error or is empty (default fallback)', () => {
    // We don't set anything in sessionStorage, so userType will be null
    render(<DashboardWrapper />);
    
    expect(screen.getByTestId('doctor-dashboard')).toBeInTheDocument();
  });

  it('reads userType from master role if user object does not have it', () => {
    sessionStorage.setItem('user', JSON.stringify({ someData: 123 })); // No userType
    sessionStorage.setItem('master', JSON.stringify({ userType: 'receptionist' }));
    
    render(<DashboardWrapper />);
    
    expect(screen.getByTestId('receptionist-dashboard')).toBeInTheDocument();
  });
});
