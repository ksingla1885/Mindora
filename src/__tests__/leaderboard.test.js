import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { EnhancedLeaderboard } from '../components/leaderboard/EnhancedLeaderboard';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

// Mock data for the leaderboard
const mockLeaderboardData = {
  leaderboard: Array(20).fill(0).map((_, i) => ({
    id: `user${i + 1}`,
    rank: i + 1,
    name: `User ${i + 1}`,
    score: 100 - i * 2,
    timeSpent: 1200 - i * 50,
    correctAnswers: 8 + Math.floor(i / 2),
    totalQuestions: 10,
    lastAttempt: new Date(Date.now() - (i * 3600000)).toISOString(),
    attempts: 3 + (i % 4),
    accuracy: Math.min(100, 70 + (i * 2)),
    improvement: -5 + (i % 3) * 3,
  })),
  currentUser: {
    id: 'user5',
    rank: 5,
    name: 'Current User',
    score: 92,
    timeSpent: 1000,
    correctAnswers: 9,
    totalQuestions: 10,
    lastAttempt: new Date().toISOString(),
    attempts: 4,
    accuracy: 90,
    improvement: 2,
  },
  total: 20,
  page: 1,
  pageSize: 10,
};

// Set up mock server
const server = setupServer(
  rest.get('/api/leaderboard/:testId', (req, res, ctx) => {
    const search = req.url.searchParams.get('search') || '';
    const page = parseInt(req.url.searchParams.get('page') || '1');
    const timeRange = req.url.searchParams.get('timeRange') || 'all';
    
    // Filter by search query if provided
    let filteredData = { ...mockLeaderboardData };
    
    if (search) {
      filteredData.leaderboard = filteredData.leaderboard.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase())
      );
      filteredData.total = filteredData.leaderboard.length;
    }
    
    // Apply pagination
    const start = (page - 1) * filteredData.pageSize;
    const end = start + filteredData.pageSize;
    filteredData.leaderboard = filteredData.leaderboard.slice(start, end);
    filteredData.page = page;
    
    return res(ctx.json(filteredData));
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

describe('EnhancedLeaderboard Component', () => {
  it('renders loading state initially', () => {
    render(<EnhancedLeaderboard testId="test123" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays leaderboard data after loading', async () => {
    render(<EnhancedLeaderboard testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    // Verify leaderboard data is displayed
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('1st')).toBeInTheDocument();
  });

  it('displays current user stats', async () => {
    render(<EnhancedLeaderboard testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Your Rank')).toBeInTheDocument();
    });

    // Verify current user stats are displayed
    expect(screen.getByText('5th')).toBeInTheDocument();
    expect(screen.getByText('Current User')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
  });

  it('searches for users', async () => {
    render(<EnhancedLeaderboard testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    // Type in search input
    const searchInput = screen.getByPlaceholderText('Search by name...');
    fireEvent.change(searchInput, { target: { value: 'User 3' } });
    
    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('User 3')).toBeInTheDocument();
      expect(screen.queryByText('User 1')).not.toBeInTheDocument();
    });
  });

  it('changes time range filter', async () => {
    render(<EnhancedLeaderboard testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    // Open time range select
    const timeRangeSelect = screen.getByLabelText('Time Range');
    fireEvent.mouseDown(timeRangeSelect);
    
    // Select 30 days option
    const thirtyDaysOption = screen.getByText('Last 30 Days');
    fireEvent.click(thirtyDaysOption);
    
    // Verify API was called with new time range
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=30d'),
        expect.anything()
      );
    });
  });

  it('paginates through results', async () => {
    render(<EnhancedLeaderboard testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    // Click next page
    const nextPageButton = screen.getByLabelText('Go to next page');
    fireEvent.click(nextPageButton);
    
    // Verify API was called with page 2
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.anything()
      );
    });
  });

  it('sorts by different columns', async () => {
    render(<EnhancedLeaderboard testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    // Click on Score header to sort by score
    const scoreHeader = screen.getByText('Score');
    fireEvent.click(scoreHeader);
    
    // Verify API was called with sortBy=score
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=score'),
        expect.anything()
      );
    });
  });

  it('handles API errors gracefully', async () => {
    // Override the default handler to return an error
    server.use(
      rest.get('/api/leaderboard/:testId', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
      })
    );

    render(<EnhancedLeaderboard testId="test123" />);
    
    // Verify error state is shown
    await waitFor(() => {
      expect(screen.getByText('Error Loading Leaderboard')).toBeInTheDocument();
      expect(screen.getByText('Failed to load leaderboard data. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no results found', async () => {
    // Override the default handler to return empty results
    server.use(
      rest.get('/api/leaderboard/:testId', (req, res, ctx) => {
        return res(ctx.json({
          leaderboard: [],
          total: 0,
          page: 1,
          pageSize: 10,
        }));
      })
    );

    render(<EnhancedLeaderboard testId="test123" />);
    
    // Verify empty state is shown
    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});

describe('Leaderboard Responsiveness', () => {
  const originalInnerWidth = global.innerWidth;
  
  afterEach(() => {
    // Reset window size after each test
    global.innerWidth = originalInnerWidth;
    global.dispatchEvent(new Event('resize'));
  });
  
  it('shows simplified view on mobile', async () => {
    // Set mobile viewport
    global.innerWidth = 500;
    global.dispatchEvent(new Event('resize'));
    
    render(<EnhancedLeaderboard testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });
    
    // Verify mobile-specific elements are present
    expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument();
    
    // Verify some columns are hidden on mobile
    expect(screen.queryByText('Time Spent')).not.toBeInTheDocument();
    expect(screen.queryByText('Accuracy')).not.toBeInTheDocument();
  });
});
