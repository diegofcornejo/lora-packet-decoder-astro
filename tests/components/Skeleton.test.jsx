import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton from '../../src/components/Skeleton.jsx';

describe('Skeleton component', () => {
  it('should render without crashing', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render an SVG element', () => {
    const { container } = render(<Skeleton />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have correct viewBox dimensions', () => {
    const { container } = render(<Skeleton />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('viewBox', '0 0 340 84');
  });

  it('should contain ContentLoader elements', () => {
    const { container } = render(<Skeleton />);
    // ContentLoader renders rect elements
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('should have proper structure for loading animation', () => {
    const { container } = render(<Skeleton />);
    // Check that the component renders something visible
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });
});
