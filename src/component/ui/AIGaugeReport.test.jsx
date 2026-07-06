import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AIGaugeReport from './AIGaugeReport.jsx';

// Mock react-chartjs-2 and chart.js to avoid canvas rendering issues
vi.mock('react-chartjs-2', () => ({
  Doughnut: () => <div data-testid="mock-doughnut">Doughnut Chart</div>
}));

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  ArcElement: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn()
}));

// Mock ResizeObserver for Ant Design components
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('AIGaugeReport Component', () => {
  it('returns null if no items are provided', () => {
    const { container } = render(<AIGaugeReport items={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders title and icon if provided', () => {
    const mockItems = [{ test_name: 'Test 1', value: '10' }];
    render(<AIGaugeReport items={mockItems} title="My Report" icon="solar:test" color="blue" />);
    
    expect(screen.getByText('My Report')).toBeInTheDocument();
  });

  it('renders items correctly', () => {
    const mockItems = [
      {
        test_name: 'Hemoglobin',
        value: 12.5,
        unit: 'g/dL',
        flag: 'low',
        reference: '13.8-17.2',
        impression: 'Slightly low',
        type: 'lab'
      }
    ];

    render(<AIGaugeReport items={mockItems} />);
    
    expect(screen.getByText('Hemoglobin')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
    expect(screen.getByText('12.5')).toBeInTheDocument();
    expect(screen.getByText('g/dL')).toBeInTheDocument();
    
    // Check if the mock chart is rendered
    expect(screen.getByTestId('mock-doughnut')).toBeInTheDocument();
  });

  it('applies correct flag text color', () => {
    const mockItems = [
      { test_name: 'Critical Test', flag: 'critical' }
    ];

    const { container } = render(<AIGaugeReport items={mockItems} />);
    const flagElement = screen.getByText('critical');
    // Ensure the text-red-500 class is applied for critical
    expect(flagElement.className).toContain('text-red-500');
  });

  it('renders clinical impression, drug interactions, and patient solution if provided', () => {
    const mockItems = [
      {
        test_name: 'Pharmacy Med',
        type: 'pharmacy',
        impression: 'Good for pain.',
        drug_interactions: 'Avoid alcohol.',
        patient_solution: 'Take with food.'
      }
    ];

    render(<AIGaugeReport items={mockItems} />);
    
    expect(screen.getByText('Clinical Impression')).toBeInTheDocument();
    expect(screen.getByText('Good for pain.')).toBeInTheDocument();
    
    expect(screen.getByText('Drug Interactions')).toBeInTheDocument();
    expect(screen.getByText('Avoid alcohol.')).toBeInTheDocument();
    
    expect(screen.getByText('Patient Guide')).toBeInTheDocument();
    expect(screen.getByText('Take with food.')).toBeInTheDocument();
  });
});
