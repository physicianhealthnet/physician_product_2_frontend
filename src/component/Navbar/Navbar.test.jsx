import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navbar from './Navbar.jsx';

// Mock Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' })
}));

// Mock Redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useSelector: vi.fn((selector) => selector({ theme: { theme: 'light' } })),
  useDispatch: () => mockDispatch
}));

// Mock Redux Actions
vi.mock('../../redux/slices/toggleSlice', () => ({
  toggleSidebar: vi.fn(() => ({ type: 'toggle/toggleSidebar' }))
}));

// Mock Antd message
vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    message: {
      success: vi.fn()
    }
  };
});

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders correctly with default user info', () => {
    render(<Navbar />);
    
    // Title is present
    expect(screen.getByText('PHN')).toBeInTheDocument();
    
    // Default user info is rendered
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByText('Master')).toBeInTheDocument();
  });

  it('renders correctly with specific user info from sessionStorage', () => {
    sessionStorage.setItem('user', JSON.stringify({ userName: 'Dr. Smith', userType: 'doctor' }));
    
    render(<Navbar />);
    
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Doctor')).toBeInTheDocument();
  });

  it('handles sidebar toggle', () => {
    render(<Navbar />);
    
    // The toggle button has the MenuUnfoldOutlined icon, but we can query it by role
    const buttons = screen.getAllByRole('button');
    // First button is the toggle button
    fireEvent.click(buttons[0]);
    
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'toggle/toggleSidebar' });
  });

  it('handles brand logo click to navigate home', () => {
    render(<Navbar />);
    
    const brand = screen.getByText('PHN').closest('div');
    fireEvent.click(brand);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('displays user roles correctly for different types', () => {
    const roles = {
      receptionist: 'Receptionist',
      accountant: 'Accountant',
      generalManager: 'General Manager',
      master: 'CEO'
    };

    Object.entries(roles).forEach(([type, expected]) => {
      sessionStorage.setItem('user', JSON.stringify({ userName: 'TestUser', userType: type }));
      const { unmount } = render(<Navbar />);
      
      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  // Since Dropdown requires complex interactions to show the menu, we will verify the dropdown trigger exists.
  // Testing AntD dropdown menu clicks in JSDOM can be brittle, so we test the UI elements are present.
  it('renders user dropdown trigger', () => {
    render(<Navbar />);
    
    // Find the dropdown wrapper by looking for the avatar
    const avatar = document.querySelector('.ant-avatar');
    expect(avatar).toBeInTheDocument();
  });
});
