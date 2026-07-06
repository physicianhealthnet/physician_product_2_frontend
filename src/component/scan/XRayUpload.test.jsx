import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import XRayUpload from './XRayUpload.jsx';
import axios from 'axios';

// Mock Axios
vi.mock('axios');

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');

describe('XRayUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly initially', () => {
    render(<XRayUpload />);
    
    expect(screen.getByText(/AI X-Ray/i)).toBeInTheDocument();
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
    expect(screen.getByText('Report will appear here after analysis')).toBeInTheDocument();
    
    // Analyze button should be disabled initially
    const analyzeButton = screen.getByRole('button', { name: /Analyze X-Ray/i });
    expect(analyzeButton).toBeDisabled();
  });

  it('handles file selection and preview', () => {
    render(<XRayUpload />);
    
    const file = new File(['test image'], 'test-xray.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // URL.createObjectURL should be called
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
    
    // Preview image should be rendered
    const previewImage = screen.getByAltText('X-ray preview');
    expect(previewImage).toBeInTheDocument();
    expect(previewImage.src).toContain('mock-url');
    
    // File name should be displayed
    expect(screen.getByText('test-xray.jpg')).toBeInTheDocument();
    
    // Analyze button should be enabled
    const analyzeButton = screen.getByRole('button', { name: /Analyze X-Ray/i });
    expect(analyzeButton).not.toBeDisabled();
  });

  it('handles clearing the file', () => {
    render(<XRayUpload />);
    
    const file = new File(['test image'], 'test-xray.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Click the clear (X) button - Note: We need to find the button containing the tabler:x icon
    // It's the only button within the preview container, which has a class absolute
    // Wait, let's select it by querying the button that is inside the preview container
    const clearBtn = screen.getByAltText('X-ray preview').nextElementSibling;
    fireEvent.click(clearBtn);
    
    expect(screen.queryByAltText('X-ray preview')).not.toBeInTheDocument();
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument();
  });

  it('submits file and prompt to the API and displays report', async () => {
    const mockReport = "No abnormalities detected.";
    axios.post.mockResolvedValueOnce({ data: { report: mockReport } });

    render(<XRayUpload />);
    
    const file = new File(['test image'], 'test-xray.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const promptInput = screen.getByPlaceholderText(/Focus on the lower right lobe/i);
    fireEvent.change(promptInput, { target: { value: 'Check for fractures' } });
    
    const analyzeButton = screen.getByRole('button', { name: /Analyze X-Ray/i });
    fireEvent.click(analyzeButton);
    
    expect(analyzeButton).toBeDisabled(); // Loading state
    
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      expect(screen.getByText(mockReport)).toBeInTheDocument();
    });
    
    const formData = axios.post.mock.calls[0][1];
    expect(formData.get('xray')).toEqual(file);
    expect(formData.get('customPrompt')).toBe('Check for fractures');
  });

  it('handles API error gracefully', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Invalid file format' } }
    });

    render(<XRayUpload />);
    
    const file = new File(['test image'], 'bad-file.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    const analyzeButton = screen.getByRole('button', { name: /Analyze X-Ray/i });
    fireEvent.click(analyzeButton);
    
    await waitFor(() => {
      expect(screen.getByText('Invalid file format')).toBeInTheDocument();
    });
  });
});
