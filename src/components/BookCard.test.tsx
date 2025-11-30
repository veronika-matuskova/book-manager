import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookCard from './BookCard';
import type { BookWithDetails, ReadingStatus } from '../types';

// Helper to wrap component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BookCard', () => {
  const mockBook: BookWithDetails = {
    id: 'book-1',
    title: 'Test Book',
    author: 'Test Author',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should render book title and author', () => {
    renderWithRouter(<BookCard book={mockBook} />);
    
    // Use getAllByText and check that title appears
    const titles = screen.getAllByText('Test Book');
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('should render without cover image', () => {
    const { container } = renderWithRouter(<BookCard book={mockBook} />);
    
    // Should show placeholder div (not an image)
    const placeholder = container.querySelector('div[style*="width: 100px"][style*="height: 150px"]');
    expect(placeholder).toBeInTheDocument();
    expect(screen.queryByAltText('Test Book')).not.toBeInTheDocument();
  });

  it('should render with cover image', () => {
    const bookWithCover = {
      ...mockBook,
      coverImageUrl: 'https://example.com/cover.jpg'
    };
    
    renderWithRouter(<BookCard book={bookWithCover} />);
    
    const image = screen.getByAltText('Test Book');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });

  it('should handle image load error', () => {
    const bookWithCover = {
      ...mockBook,
      coverImageUrl: 'https://example.com/invalid.jpg'
    };
    
    renderWithRouter(<BookCard book={bookWithCover} />);
    
    const image = screen.getByAltText('Test Book');
    fireEvent.error(image);
    
    // Image should be hidden and placeholder shown
    expect(image).not.toBeVisible();
  });

  it('should display reading status badge when userBook is present', () => {
    const bookWithStatus: BookWithDetails = {
      ...mockBook,
      userBook: {
        id: 'ub-1',
        userId: 'user-1',
        bookId: 'book-1',
        status: 'read' as ReadingStatus,
        progress: 100,
        addedAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    renderWithRouter(<BookCard book={bookWithStatus} />);
    
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('should display all reading statuses correctly', () => {
    const statuses: ReadingStatus[] = ['to-read', 'currently-reading', 'read', 'didnt-finish'];
    
    statuses.forEach(status => {
      const book: BookWithDetails = {
        ...mockBook,
        userBook: {
          id: 'ub-1',
          userId: 'user-1',
          bookId: 'book-1',
          status,
          progress: status === 'read' ? 100 : status === 'currently-reading' ? 50 : 0,
          addedAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      const { unmount } = renderWithRouter(<BookCard book={book} />);
      
      const labels: Record<ReadingStatus, string> = {
        'to-read': 'To Read',
        'currently-reading': 'Currently Reading',
        'read': 'Read',
        'didnt-finish': "Didn't Finish"
      };
      
      expect(screen.getByText(labels[status])).toBeInTheDocument();
      unmount();
    });
  });

  it('should display progress bar for currently-reading books', () => {
    const bookWithProgress: BookWithDetails = {
      ...mockBook,
      userBook: {
        id: 'ub-1',
        userId: 'user-1',
        bookId: 'book-1',
        status: 'currently-reading' as ReadingStatus,
        progress: 65,
        addedAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    renderWithRouter(<BookCard book={bookWithProgress} />);
    
    expect(screen.getByText('65% complete')).toBeInTheDocument();
  });

  it('should display series information', () => {
    const bookWithSeries: BookWithDetails = {
      ...mockBook,
      series: {
        id: 'series-1',
        name: 'Test Series',
        author: 'Series Author',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    renderWithRouter(<BookCard book={bookWithSeries} />);
    
    expect(screen.getByText(/Series: Test Series/)).toBeInTheDocument();
  });

  it('should display genres', () => {
    const bookWithGenres: BookWithDetails = {
      ...mockBook,
      genres: [
        { id: 'genre-1', name: 'Fantasy', createdAt: new Date() },
        { id: 'genre-2', name: 'Adventure', createdAt: new Date() }
      ]
    };
    
    renderWithRouter(<BookCard book={bookWithGenres} />);
    
    expect(screen.getByText('Fantasy')).toBeInTheDocument();
    expect(screen.getByText('Adventure')).toBeInTheDocument();
  });

  it('should display publication year and pages', () => {
    const bookWithDetails: BookWithDetails = {
      ...mockBook,
      publicationYear: 2024,
      pages: 300
    };
    
    renderWithRouter(<BookCard book={bookWithDetails} />);
    
    expect(screen.getByText(/2024/)).toBeInTheDocument();
    expect(screen.getByText(/300 pages/)).toBeInTheDocument();
  });

  it('should display format', () => {
    const bookWithFormat: BookWithDetails = {
      ...mockBook,
      format: 'digital' as any,
      publicationYear: 2024
    };
    
    renderWithRouter(<BookCard book={bookWithFormat} />);
    
    expect(screen.getByText(/digital/)).toBeInTheDocument();
  });

  it('should display started and finished dates', () => {
    const bookWithDates: BookWithDetails = {
      ...mockBook,
      userBook: {
        id: 'ub-1',
        userId: 'user-1',
        bookId: 'book-1',
        status: 'read' as ReadingStatus,
        progress: 100,
        startedDate: new Date('2024-01-01'),
        finishedDate: new Date('2024-01-15'),
        addedAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    renderWithRouter(<BookCard book={bookWithDates} />);
    
    expect(screen.getByText(/Started:/)).toBeInTheDocument();
    expect(screen.getByText(/Finished:/)).toBeInTheDocument();
  });

  it('should show checkbox when showCheckbox is true', () => {
    renderWithRouter(<BookCard book={mockBook} showCheckbox={true} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should not show checkbox by default', () => {
    renderWithRouter(<BookCard book={mockBook} />);
    
    const checkbox = screen.queryByRole('checkbox');
    expect(checkbox).not.toBeInTheDocument();
  });

  it('should call onSelect when checkbox is clicked', () => {
    const handleSelect = vi.fn();
    
    renderWithRouter(
      <BookCard 
        book={mockBook} 
        showCheckbox={true}
        onSelect={handleSelect}
      />
    );
    
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(handleSelect).toHaveBeenCalledWith('book-1', true);
  });

  it('should reflect isSelected state in checkbox', () => {
    renderWithRouter(
      <BookCard 
        book={mockBook} 
        showCheckbox={true}
        isSelected={true}
      />
    );
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should apply opacity when selected', () => {
    const { container } = renderWithRouter(
      <BookCard 
        book={mockBook} 
        showCheckbox={true}
        isSelected={true}
      />
    );
    
    const card = container.querySelector('.card');
    expect(card).toHaveStyle({ opacity: '0.7' });
  });

  it('should display "Owned" badge when isOwned is true', () => {
    const ownedBook: BookWithDetails = {
      ...mockBook,
      isOwned: true
    };
    
    renderWithRouter(<BookCard book={ownedBook} />);
    
    expect(screen.getByText('Owned')).toBeInTheDocument();
  });

  it('should truncate long titles in placeholder', () => {
    const longTitleBook: BookWithDetails = {
      ...mockBook,
      title: 'This is a very long book title that should be truncated'
    };
    
    const { container } = renderWithRouter(<BookCard book={longTitleBook} />);
    
    // Should show first 20 characters + ... in placeholder
    const placeholders = container.querySelectorAll('div[style*="width: 100px"][style*="height: 150px"]');
    const placeholder = Array.from(placeholders).find(el => 
      el.textContent?.includes('This is a very long b') || el.textContent?.includes('...')
    );
    expect(placeholder).toBeDefined();
    if (placeholder) {
      expect(placeholder.textContent?.length).toBeLessThanOrEqual(23); // 20 chars + "..."
    }
  });

  it('should link to book detail page', () => {
    renderWithRouter(<BookCard book={mockBook} />);
    
    // There are multiple links with the book title, get all and check href
    const links = screen.getAllByRole('link');
    const bookLinks = links.filter(link => link.getAttribute('href') === '/book/book-1');
    expect(bookLinks.length).toBeGreaterThan(0);
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalBook: BookWithDetails = {
      id: 'book-1',
      title: 'Minimal Book',
      author: 'Author',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    renderWithRouter(<BookCard book={minimalBook} />);
    
    // Book should render without optional fields
    const titles = screen.getAllByText('Minimal Book');
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.getByText('Author')).toBeInTheDocument();
    // Should not crash or show errors
  });
});

