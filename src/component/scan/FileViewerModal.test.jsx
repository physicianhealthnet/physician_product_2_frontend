import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FileViewerModal from './FileViewerModal.jsx';

import cornerstone from 'cornerstone-core';

// Mock all cornerstone related libraries to avoid JSDOM crashes
vi.mock('cornerstone-core', () => {
  return {
    default: {
      enable: vi.fn(),
      disable: vi.fn(),
      loadImage: vi.fn().mockResolvedValue({}),
      displayImage: vi.fn(),
    },
    enable: vi.fn(),
    disable: vi.fn(),
    loadImage: vi.fn().mockResolvedValue({}),
    displayImage: vi.fn(),
  };
});

vi.mock('cornerstone-wado-image-loader', () => {
  return {
    default: {
      external: {},
      configure: vi.fn(),
      webWorkerManager: {
        initialize: vi.fn()
      }
    }
  };
});

vi.mock('dicom-parser', () => {
  return { default: {} };
});

vi.mock('cornerstone-math', () => {
  return { default: {} };
});

vi.mock('hammerjs', () => {
  return { default: {} };
});

vi.mock('cornerstone-tools', () => {
  return {
    default: {
      external: {},
      init: vi.fn(),
      addTool: vi.fn(),
      setToolActive: vi.fn(),
      WwwcTool: class {},
      ZoomTool: class {},
      PanTool: class {}
    }
  };
});

describe('FileViewerModal Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<FileViewerModal fileUrl="test.jpg" onClose={mockOnClose} />);
    // Component sets loading to false almost immediately for images, 
    // but let's check if the modal header renders
    expect(screen.getByText("Let's review")).toBeInTheDocument();
    expect(screen.getByText("test.jpg")).toBeInTheDocument();
  });

  it('renders an image when passed an image url', async () => {
    render(<FileViewerModal fileUrl="https://example.com/scan.png" onClose={mockOnClose} />);
    
    await waitFor(() => {
      const img = screen.getByAltText('Scan Report');
      expect(img).toBeInTheDocument();
      expect(img.src).toBe('https://example.com/scan.png');
    });
  });

  it('renders an iframe when passed a pdf url', async () => {
    render(<FileViewerModal fileUrl="https://example.com/report.pdf" onClose={mockOnClose} />);
    
    await waitFor(() => {
      const iframe = screen.getByTitle('PDF Report Viewer');
      expect(iframe).toBeInTheDocument();
      expect(iframe.src).toBe('https://example.com/report.pdf');
    });
  });

  it('renders fallback for unknown file types', async () => {
    render(<FileViewerModal fileUrl="https://example.com/data.xyz" onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Unknown File Type')).toBeInTheDocument();
      expect(screen.getByText(/The provided file extension is not explicitly handled/i)).toBeInTheDocument();
    });
  });

  it('initializes cornerstone when passed a dicom file', async () => {
    render(<FileViewerModal fileUrl="https://example.com/scan.dcm" onClose={mockOnClose} />);
    
    await waitFor(() => {
      // It should call cornerstone.enable on the viewer ref
      expect(cornerstone.enable).toHaveBeenCalled();
      // It should load the image with wadouri protocol
      expect(cornerstone.loadImage).toHaveBeenCalledWith('wadouri:https://example.com/scan.dcm');
      // It should display the image
      expect(cornerstone.displayImage).toHaveBeenCalled();
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(<FileViewerModal fileUrl="test.jpg" onClose={mockOnClose} />);
    
    // The close button has the close-circle icon, let's find it by role or class
    // It's the button containing the close icon, usually the last button in the header
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons[buttons.length - 1]; 
    
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
