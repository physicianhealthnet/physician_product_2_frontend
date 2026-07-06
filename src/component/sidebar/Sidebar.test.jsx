import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

// Mock Redux
const mockDispatch = vi.fn();
let mockIsOpen = true;
let mockChatIsOpen = false;
let mockUnreadCount = 0;

vi.mock('react-redux', () => ({
  useSelector: (selector) => {
    // A simple mock for useSelector that returns state based on what it's selecting
    const state = {
      toggle: { isOpen: mockIsOpen },
      chat: { isOpen: mockChatIsOpen, unreadCount: mockUnreadCount }
    };
    return selector(state);
  },
  useDispatch: () => mockDispatch
}));

// Mock the chatSlice action
vi.mock('../../redux/slices/chatSlice', () => ({
  toggleChat: vi.fn(() => ({ type: 'chat/toggleChat' }))
}));

// Mock PHNChat so we don't render its heavy dependencies
vi.mock('../chat/PHNChat', () => ({
  default: ({ isOpen, onClose }) => (
    <div data-testid="phn-chat" data-isopen={isOpen}>
      <button onClick={onClose} data-testid="close-chat">Close Chat</button>
    </div>
  )
}));

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockIsOpen = true;
    mockChatIsOpen = false;
    mockUnreadCount = 0;
  });

  it('renders correctly for receptionist role', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'receptionist' }));
    
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Verify Receptionist specific menu items exist
    expect(screen.getByText('Patient Registration')).toBeInTheDocument();
    // Verify a Doctor specific item does NOT exist
    expect(screen.queryByText('Scan Center')).not.toBeInTheDocument();
  });

  it('renders correctly for doctor role and tests submenu toggle', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'doctor' }));
    
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Verify Doctor specific menu items exist
    expect(screen.getByText('Scan Center')).toBeInTheDocument();
    
    // Scan Center has a submenu. The "For Doctor" link inside it should not be visible initially (because it's animated/hidden)
    // Actually Framer motion might not hide it entirely from the DOM but it animates height to 0.
    // We can test if clicking the parent toggles the submenu state.
    const scanCenterTab = screen.getByText('Scan Center');
    
    fireEvent.click(scanCenterTab);
    
    // Now the submenu items should be present in the document
    expect(screen.getByText('For Technician')).toBeInTheDocument();
  });

  it('handles chat toggle button', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'master' }));
    mockUnreadCount = 5;
    
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // Verify Clinic Support button exists
    const supportButton = screen.getByText('Clinic Support');
    expect(supportButton).toBeInTheDocument();

    // Verify unread count badge is rendered
    expect(screen.getByText('5')).toBeInTheDocument();

    // Click it
    fireEvent.click(supportButton);
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'chat/toggleChat' });
  });

  it('renders in closed state when isOpen is false', () => {
    sessionStorage.setItem('user', JSON.stringify({ userType: 'master' }));
    mockIsOpen = false;
    
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    // The text 'Clinic Support' should NOT be rendered when closed
    expect(screen.queryByText('Clinic Support')).not.toBeInTheDocument();
    
    // We should just have the icon, but unread count badge should still be there if > 0
    // wait, if mockUnreadCount = 0 here, let's verify brand changes
    // When open, it renders 'PHN', when closed it renders 'PHN' but differently styled.
    expect(screen.getAllByText('PHN')).toHaveLength(1);
  });
});
