import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { 
  FadeInTransition, 
  SlideInTransition, 
  ScaleTransition, 
  StaggerContainer, 
  StaggerItem 
} from './Transitions.jsx';

describe('Transitions Components', () => {
  it('renders children within FadeInTransition', () => {
    render(
      <FadeInTransition>
        <div data-testid="child">Fade Content</div>
      </FadeInTransition>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByText('Fade Content')).toBeInTheDocument();
  });

  it('renders children within SlideInTransition in different directions', () => {
    const { unmount } = render(
      <SlideInTransition direction="up">
        <span>Up Slide</span>
      </SlideInTransition>
    );
    expect(screen.getByText('Up Slide')).toBeInTheDocument();
    unmount();

    render(
      <SlideInTransition direction="left">
        <span>Left Slide</span>
      </SlideInTransition>
    );
    expect(screen.getByText('Left Slide')).toBeInTheDocument();
  });

  it('renders children within ScaleTransition', () => {
    render(
      <ScaleTransition>
        <button>Scaled Button</button>
      </ScaleTransition>
    );
    expect(screen.getByText('Scaled Button')).toBeInTheDocument();
  });

  it('renders children within StaggerContainer and StaggerItem', () => {
    render(
      <StaggerContainer className="test-container">
        <StaggerItem className="test-item">
          <p>Item 1</p>
        </StaggerItem>
        <StaggerItem>
          <p>Item 2</p>
        </StaggerItem>
      </StaggerContainer>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
