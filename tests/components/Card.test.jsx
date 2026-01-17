import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Card from '../../src/components/Card.jsx';
import { Toaster } from 'sonner';

// Wrapper component to include Toaster for toast notifications
const CardWithToaster = (props) => (
  <>
    <Card {...props} />
    <Toaster />
  </>
);

describe('Card component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    navigator.clipboard.writeText.mockResolvedValue();
  });

  describe('rendering', () => {
    it('should render the title', () => {
      render(<Card title="Test Title">Content</Card>);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render children', () => {
      render(<Card title="Title">Child Content</Card>);
      expect(screen.getByText('Child Content')).toBeInTheDocument();
    });

    it('should render multiple children', () => {
      render(
        <Card title="Title">
          <div>Child 1</div>
          <div>Child 2</div>
        </Card>
      );
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('copy button', () => {
    it('should not show copy button when copyableContent is not provided', () => {
      render(<Card title="Title">Content</Card>);
      const button = screen.queryByTitle('Copy to clipboard');
      expect(button).not.toBeInTheDocument();
    });

    it('should show copy button when copyableContent is provided', () => {
      render(<Card title="Title" copyableContent="Some content">Content</Card>);
      const button = screen.getByTitle('Copy to clipboard');
      expect(button).toBeInTheDocument();
    });

    it('should copy content to clipboard when clicked', async () => {
      const content = 'Content to copy';
      render(<CardWithToaster title="Title" copyableContent={content}>Content</CardWithToaster>);
      
      const button = screen.getByTitle('Copy to clipboard');
      fireEvent.click(button);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(content);
    });

    it('should show check icon after successful copy', async () => {
      render(<CardWithToaster title="Title" copyableContent="Content">Content</CardWithToaster>);
      
      const button = screen.getByTitle('Copy to clipboard');
      fireEvent.click(button);

      // Wait for state update
      await waitFor(() => {
        const checkIcon = button.querySelector('svg path[d*="4.5 12.75"]');
        expect(checkIcon).toBeInTheDocument();
      });
    });

    it('should not copy when content is empty string', async () => {
      render(<CardWithToaster title="Title" copyableContent="">Content</CardWithToaster>);
      
      // Button should not be shown for empty content
      const button = screen.queryByTitle('Copy to clipboard');
      // Empty string is falsy so button won't be shown
      expect(button).not.toBeInTheDocument();
    });

    it('should not copy when content is only whitespace', async () => {
      render(<CardWithToaster title="Title" copyableContent="   ">Content</CardWithToaster>);
      
      const button = screen.getByTitle('Copy to clipboard');
      fireEvent.click(button);

      // Should show warning, not copy
      expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    });

    it('should handle clipboard error gracefully', async () => {
      navigator.clipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<CardWithToaster title="Title" copyableContent="Content">Content</CardWithToaster>);
      
      const button = screen.getByTitle('Copy to clipboard');
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should prevent double-clicking during copy animation', async () => {
      render(<CardWithToaster title="Title" copyableContent="Content">Content</CardWithToaster>);
      
      const button = screen.getByTitle('Copy to clipboard');
      
      // First click
      fireEvent.click(button);
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
      
      // Wait for state update
      await waitFor(() => {
        const checkIcon = button.querySelector('svg path[d*="4.5 12.75"]');
        expect(checkIcon).toBeInTheDocument();
      });
      
      // Second click during animation (isCopied is true)
      fireEvent.click(button);
      // Should still only be called once
      expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    });
  });

  describe('styling', () => {
    it('should have card class', () => {
      const { container } = render(<Card title="Title">Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('card');
    });

    it('should have overflow-auto class', () => {
      const { container } = render(<Card title="Title">Content</Card>);
      const card = container.firstChild;
      expect(card.className).toContain('overflow-auto');
    });
  });
});
