import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LabAppointmentDashboard from './LabAppointmentDashboard.jsx';
import { AxiosInstance } from '../../utilities/AxiosInstance';

// Mock the AxiosInstance
vi.mock('../../utilities/AxiosInstance', () => ({
  AxiosInstance: {
    get: vi.fn()
  }
}));

describe('LabAppointmentDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and fetches stats on mount', async () => {
    // Setup mock response
    const mockMetrics = {
      todayTotal: 150,
      morning: 50,
      afternoon: 60,
      evening: 40,
      notScheduled: 5,
      missing: 10,
      reportNotReady: 15,
      notReviewed: 20
    };
    
    AxiosInstance.get.mockResolvedValueOnce({
      data: { data: mockMetrics }
    });

    render(<LabAppointmentDashboard />);

    // Verify header is rendered
    expect(screen.getByText('Lab Appointment')).toBeInTheDocument();
    
    // Verify API call was made
    expect(AxiosInstance.get).toHaveBeenCalledWith('/lab-prescription/stats');
    expect(AxiosInstance.get).toHaveBeenCalledTimes(1);

    // Verify stats are updated and rendered using waitFor
    await waitFor(() => {
      // Current Stats
      expect(screen.getByText('150')).toBeInTheDocument(); // Today Total
      expect(screen.getByText('50')).toBeInTheDocument();  // Morning
      expect(screen.getByText('60')).toBeInTheDocument();  // Afternoon
      expect(screen.getByText('40')).toBeInTheDocument();  // Evening
      
      // Pipeline Buckets
      expect(screen.getByText('5')).toBeInTheDocument();   // Not Scheduled
      expect(screen.getByText('10')).toBeInTheDocument();  // Missing
      expect(screen.getByText('15')).toBeInTheDocument();  // Report Not Ready
      expect(screen.getByText('20')).toBeInTheDocument();  // Not Reviewed
    });
  });

  it('handles API errors gracefully without crashing', async () => {
    // Setup mock error response
    AxiosInstance.get.mockRejectedValueOnce(new Error('Network Error'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<LabAppointmentDashboard />);

    // API should have been called
    expect(AxiosInstance.get).toHaveBeenCalledWith('/lab-prescription/stats');

    // Default stats (0) should remain
    await waitFor(() => {
      expect(screen.getAllByText('0').length).toBeGreaterThan(0);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
