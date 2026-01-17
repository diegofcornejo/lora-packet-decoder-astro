import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import History from '../../src/components/History.jsx';

describe('History component', () => {
  const mockHistory = [
    {
      id: 1,
      name: 'Execution 1',
      data: 'data1',
      appKey: '',
      nwkKey: '',
      decoded: '',
      decodedBuffer: '',
      properties: [],
      favorite: false,
    },
    {
      id: 2,
      name: 'Execution 2',
      data: 'data2',
      appKey: 'appkey',
      nwkKey: 'nwkkey',
      decoded: 'decoded',
      decodedBuffer: 'buffer',
      properties: [],
      favorite: true,
    },
  ];

  const defaultProps = {
    history: mockHistory,
    onLoad: vi.fn(),
    onDelete: vi.fn(),
    onRename: vi.fn(),
    onFavorite: vi.fn(),
    onLoadDefaults: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.prompt = vi.fn();
  });

  describe('rendering', () => {
    it('should render History title', () => {
      render(<History {...defaultProps} />);
      expect(screen.getByText('History')).toBeInTheDocument();
    });

    it('should render history limit note', () => {
      render(<History {...defaultProps} />);
      expect(screen.getByText('Showing last 5 executions.')).toBeInTheDocument();
    });

    it('should render all history items', () => {
      render(<History {...defaultProps} />);
      expect(screen.getByText('Execution 1')).toBeInTheDocument();
      expect(screen.getByText('Execution 2')).toBeInTheDocument();
    });

    it('should render empty message when no history', () => {
      render(<History {...defaultProps} history={[]} />);
      expect(screen.getByText('No previous decodings.')).toBeInTheDocument();
    });

    it('should render load defaults button', () => {
      render(<History {...defaultProps} />);
      expect(screen.getByTitle('Load default examples')).toBeInTheDocument();
    });
  });

  describe('load action', () => {
    it('should call onLoad when clicking on item name', () => {
      render(<History {...defaultProps} />);
      fireEvent.click(screen.getByText('Execution 1'));
      expect(defaultProps.onLoad).toHaveBeenCalledWith(1);
    });

    it('should call onLoad with correct id for different items', () => {
      render(<History {...defaultProps} />);
      fireEvent.click(screen.getByText('Execution 2'));
      expect(defaultProps.onLoad).toHaveBeenCalledWith(2);
    });
  });

  describe('delete action', () => {
    it('should call onDelete when clicking delete button', () => {
      render(<History {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('Delete execution');
      fireEvent.click(deleteButtons[0]);
      expect(defaultProps.onDelete).toHaveBeenCalledWith(1);
    });
  });

  describe('rename action', () => {
    it('should call onRename with new name when confirmed', () => {
      global.prompt.mockReturnValue('New Name');
      render(<History {...defaultProps} />);
      
      const renameButtons = screen.getAllByTitle('Rename execution');
      fireEvent.click(renameButtons[0]);
      
      expect(global.prompt).toHaveBeenCalledWith('Enter a new name for this execution:');
      expect(defaultProps.onRename).toHaveBeenCalledWith(1, 'New Name');
    });

    it('should not call onRename when cancelled (null)', () => {
      global.prompt.mockReturnValue(null);
      render(<History {...defaultProps} />);
      
      const renameButtons = screen.getAllByTitle('Rename execution');
      fireEvent.click(renameButtons[0]);
      
      expect(defaultProps.onRename).not.toHaveBeenCalled();
    });

    it('should not call onRename when empty string', () => {
      global.prompt.mockReturnValue('');
      render(<History {...defaultProps} />);
      
      const renameButtons = screen.getAllByTitle('Rename execution');
      fireEvent.click(renameButtons[0]);
      
      expect(defaultProps.onRename).not.toHaveBeenCalled();
    });

    it('should not call onRename when only whitespace', () => {
      global.prompt.mockReturnValue('   ');
      render(<History {...defaultProps} />);
      
      const renameButtons = screen.getAllByTitle('Rename execution');
      fireEvent.click(renameButtons[0]);
      
      expect(defaultProps.onRename).not.toHaveBeenCalled();
    });
  });

  describe('favorite action', () => {
    it('should call onFavorite when clicking favorite button', () => {
      render(<History {...defaultProps} />);
      const favoriteButtons = screen.getAllByTitle(/favorite/i);
      fireEvent.click(favoriteButtons[0]);
      expect(defaultProps.onFavorite).toHaveBeenCalledWith(1);
    });

    it('should show filled star for favorited items', () => {
      render(<History {...defaultProps} />);
      // Item 2 is favorited - should have "Unmark as favorite" title
      expect(screen.getByTitle('Unmark as favorite')).toBeInTheDocument();
    });

    it('should show empty star for non-favorited items', () => {
      render(<History {...defaultProps} />);
      // Item 1 is not favorited - should have "Mark as favorite" title
      expect(screen.getByTitle('Mark as favorite')).toBeInTheDocument();
    });
  });

  describe('load defaults action', () => {
    it('should call onLoadDefaults when clicking reload button', () => {
      render(<History {...defaultProps} />);
      fireEvent.click(screen.getByTitle('Load default examples'));
      expect(defaultProps.onLoadDefaults).toHaveBeenCalled();
    });
  });

  describe('umami tracking', () => {
    it('should have umami event on load execution', () => {
      render(<History {...defaultProps} />);
      const itemName = screen.getByText('Execution 1');
      expect(itemName).toHaveAttribute('data-umami-event', 'load-execution');
    });

    it('should have umami event on favorite button', () => {
      render(<History {...defaultProps} />);
      const favoriteButton = screen.getByTitle('Mark as favorite');
      expect(favoriteButton).toHaveAttribute('data-umami-event', 'mark-as-favorite');
    });

    it('should have umami event on rename button', () => {
      render(<History {...defaultProps} />);
      const renameButtons = screen.getAllByTitle('Rename execution');
      expect(renameButtons[0]).toHaveAttribute('data-umami-event', 'rename-execution');
    });

    it('should have umami event on delete button', () => {
      render(<History {...defaultProps} />);
      const deleteButtons = screen.getAllByTitle('Delete execution');
      expect(deleteButtons[0]).toHaveAttribute('data-umami-event', 'delete-execution');
    });

    it('should have umami event on load defaults button', () => {
      render(<History {...defaultProps} />);
      const loadDefaultsButton = screen.getByTitle('Load default examples');
      expect(loadDefaultsButton).toHaveAttribute('data-umami-event', 'load-default-examples');
    });
  });

  describe('accessibility', () => {
    it('should have accessible button titles', () => {
      render(<History {...defaultProps} />);
      
      expect(screen.getByTitle('Load default examples')).toBeInTheDocument();
      expect(screen.getByTitle('Mark as favorite')).toBeInTheDocument();
      expect(screen.getByTitle('Unmark as favorite')).toBeInTheDocument();
      expect(screen.getAllByTitle('Rename execution')).toHaveLength(2);
      expect(screen.getAllByTitle('Delete execution')).toHaveLength(2);
    });
  });
});
