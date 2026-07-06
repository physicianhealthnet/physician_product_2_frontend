import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PatientClinicalDataModal from './PatientClinicalDataModal.jsx';
import { AxiosInstance } from '../../utilities/AxiosInstance';

// Mock Axios
vi.mock('../../utilities/AxiosInstance', () => ({
  AxiosInstance: {
    get: vi.fn()
  }
}));

describe('PatientClinicalDataModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    render(<PatientClinicalDataModal isOpen={false} patientId="123" type="lab" />);
    // Since it uses portal to document.body, we check body
    expect(document.body.querySelector('.fixed.inset-0')).not.toBeInTheDocument();
  });

  it('fetches and displays lab records', async () => {
    const mockLabData = [
      {
        createdAt: '2023-10-01T10:00:00Z',
        labType: 'Blood Test',
        labCenter: 'Main Center',
        drName: 'Dr. Smith',
        status: 'Completed'
      }
    ];

    AxiosInstance.get.mockResolvedValueOnce({ data: { data: mockLabData } });

    render(
      <PatientClinicalDataModal 
        isOpen={true} 
        onClose={mockOnClose} 
        patientId="123" 
        dataType="lab" 
      />
    );

    // Initial loading state
    expect(screen.getByText('Loading records...')).toBeInTheDocument();
    expect(AxiosInstance.get).toHaveBeenCalledWith('/lab-prescription/by-patient/123');

    // Wait for data to render
    await waitFor(() => {
      expect(screen.getByText('Blood Test')).toBeInTheDocument();
      expect(screen.getByText('Main Center')).toBeInTheDocument();
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });
    
    // Check Title
    expect(screen.getByText('Lab Reports')).toBeInTheDocument();
  });

  it('fetches and displays prescription records', async () => {
    const mockRxData = [
      {
        createdAt: '2023-10-02T10:00:00Z',
        doctorName: 'Dr. Jones',
        primaryComplaint: 'Fever',
        medicinesData: [
          { medicationName: 'Paracetamol', dosage: '500mg', days: 3 }
        ],
        dispenseStatus: 'Pending'
      }
    ];

    AxiosInstance.get.mockResolvedValueOnce({ data: { data: mockRxData } });

    render(
      <PatientClinicalDataModal 
        isOpen={true} 
        onClose={mockOnClose} 
        patientId="123" 
        dataType="prescription" 
      />
    );

    expect(AxiosInstance.get).toHaveBeenCalledWith('/prescription/patient/123');

    await waitFor(() => {
      expect(screen.getByText('Dr. Jones')).toBeInTheDocument();
      expect(screen.getByText('Fever')).toBeInTheDocument();
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
      expect(screen.getByText('500mg • 3 Days')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Prescription History')).toBeInTheDocument();
  });

  it('handles empty data', async () => {
    AxiosInstance.get.mockResolvedValueOnce({ data: [] });

    render(
      <PatientClinicalDataModal 
        isOpen={true} 
        onClose={mockOnClose} 
        patientId="123" 
        dataType="xray" 
      />
    );

    expect(AxiosInstance.get).toHaveBeenCalledWith('/scan-prescription/by-patient/123');

    await waitFor(() => {
      expect(screen.getByText('No records found')).toBeInTheDocument();
    });
  });

  it('handles API error', async () => {
    AxiosInstance.get.mockRejectedValueOnce(new Error('API failed'));
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <PatientClinicalDataModal 
        isOpen={true} 
        onClose={mockOnClose} 
        patientId="123" 
        dataType="mri" 
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load mri data.')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
