import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from './Login.jsx';
import { AxiosInstance } from '../../../utilities/AxiosInstance.js';
import { message } from 'antd';

// Mock React Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock Axios
vi.mock('../../../utilities/AxiosInstance.js', () => ({
  AxiosInstance: {
    post: vi.fn()
  }
}));

// Mock Antd Message
vi.mock('antd', () => ({
  message: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

// Mock AuthHero to avoid unnecessary rendering overhead
vi.mock('./AuthHero', () => ({
  default: () => <div data-testid="auth-hero">Auth Hero Mock</div>
}));

// Mock ForgotPassword
vi.mock('./ForgotPassword', () => ({
  default: ({ setForgotPassSwaper }) => (
    <div data-testid="forgot-password">
      <button onClick={() => setForgotPassSwaper(false)}>Back to Login</button>
    </div>
  )
}));

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('renders login tab by default', () => {
    render(<Login />);
    expect(screen.getByTestId('auth-hero')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@company.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('switches to register tab', () => {
    render(<Login />);
    const registerTabButton = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerTabButton);
    expect(screen.getByPlaceholderText('Dr. John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('9876543210')).toBeInTheDocument();
  });

  it('handles successful login and redirects to /book-appointment for master', async () => {
    AxiosInstance.post.mockResolvedValueOnce({
      data: {
        user: { userType: 'master', email: 'test@test.com' }
      }
    });

    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('name@company.com');
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    const form = emailInput.closest('form');
    fireEvent.submit(form);

    expect(AxiosInstance.post).toHaveBeenCalledWith('/user/login', {
      email: 'test@test.com',
      password: 'password123',
      userType: 'master'
    });

    await waitFor(() => {
      expect(sessionStorage.getItem('master')).toContain('test@test.com');
      expect(mockNavigate).toHaveBeenCalledWith('/book-appointment');
      expect(message.success).toHaveBeenCalledWith('Welcome back!');
    });
  });

  it('handles successful login and redirects based on redirectUrl in sessionStorage', async () => {
    sessionStorage.setItem('redirectUrl', '/dashboard');
    AxiosInstance.post.mockResolvedValueOnce({
      data: {
        user: { userType: 'doctor', email: 'doc@test.com' }
      }
    });

    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('name@company.com');
    fireEvent.change(emailInput, { target: { value: 'doc@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } });
    
    const roleSelect = screen.getByDisplayValue('Master Admin');
    fireEvent.change(roleSelect, { target: { value: 'doctor' } });

    // Wait for department to appear
    const deptSelect = screen.getByDisplayValue('Select Department');
    fireEvent.change(deptSelect, { target: { value: 'Cardiologist' } });

    const form = emailInput.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      expect(sessionStorage.getItem('redirectUrl')).toBeNull();
    });
  });

  it('handles failed login', async () => {
    AxiosInstance.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid credentials' } }
    });

    render(<Login />);
    
    const emailInput = screen.getByPlaceholderText('name@company.com');
    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    
    const form = emailInput.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(AxiosInstance.post).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('renders ForgotPassword when forgot password link is clicked', () => {
    render(<Login />);
    const forgotLink = screen.getByText('Forgot password?');
    
    fireEvent.click(forgotLink);
    
    expect(screen.getByTestId('forgot-password')).toBeInTheDocument();
  });
});
