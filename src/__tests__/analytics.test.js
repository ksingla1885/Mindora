import { render, screen, waitFor } from '@testing-library/react';
import { TestAnalytics } from '../components/analytics/TestAnalytics';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';

// Mock the API response
const mockAnalyticsData = {
  data: {
    totalAttempts: 150,
    averageScore: 75.5,
    completionRate: 85,
    averageTimeSpent: 120,
    scoreDistribution: [5, 15, 30, 45, 35, 15, 5],
    difficultyAnalysis: [
      { difficulty: 'EASY', averageScore: 85 },
      { difficulty: 'MEDIUM', averageScore: 72 },
      { difficulty: 'HARD', averageScore: 62 },
    ],
    questionAnalysis: Array(10).fill(0).map((_, i) => ({
      questionId: `q${i + 1}`,
      questionNumber: i + 1,
      difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
      correctPercentage: 60 + (i * 3),
      averageTimeSpent: 45 + (i * 2),
      totalAttempts: 150 - (i * 5),
      attemptCount: 150 - (i * 5),
    })),
    attemptsOverTime: Array(7).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attempts: 10 + Math.floor(Math.random() * 20),
      completed: 8 + Math.floor(Math.random() * 15),
      averageScore: 0.6 + (Math.random() * 0.3),
      averageTimeSpent: 60 + Math.floor(Math.random() * 120),
    })),
    insights: [
      { type: 'success', message: 'Test completion rate is above average (85%)' },
      { type: 'warning', message: 'Hard questions have lower accuracy (62%)' },
    ],
  },
};

// Set up mock server
const server = setupServer(
  rest.get('/api/analytics/test/:testId', (req, res, ctx) => {
    return res(ctx.json(mockAnalyticsData));
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished
afterAll(() => server.close());

describe('TestAnalytics Component', () => {
  it('renders loading state initially', () => {
    render(<TestAnalytics testId="test123" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays analytics data after loading', async () => {
    render(<TestAnalytics testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Analytics')).toBeInTheDocument();
    });

    // Verify main metrics are displayed
    expect(screen.getByText('150')).toBeInTheDocument(); // Total attempts
    expect(screen.getByText('75.5%')).toBeInTheDocument(); // Average score
    expect(screen.getByText('85%')).toBeInTheDocument(); // Completion rate
    expect(screen.getByText('2m 0s')).toBeInTheDocument(); // Avg time spent
  });

  it('switches between tabs', async () => {
    render(<TestAnalytics testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Analytics')).toBeInTheDocument();
    });

    // Switch to Questions tab
    const questionsTab = screen.getByRole('tab', { name: /questions/i });
    questionsTab.click();
    
    // Verify question analysis is displayed
    await waitFor(() => {
      expect(screen.getByText('Question Performance Heatmap')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Override the default handler to return an error
    server.use(
      rest.get('/api/analytics/test/:testId', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ error: 'Server Error' }));
      })
    );

    render(<TestAnalytics testId="test123" />);
    
    // Verify error state is shown
    await waitFor(() => {
      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
      expect(screen.getByText('Failed to load analytics data. Please try again.')).toBeInTheDocument();
    });
  });

  it('allows time range filtering', async () => {
    render(<TestAnalytics testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Analytics')).toBeInTheDocument();
    });

    // Open time range selector
    const timeRangeSelect = screen.getByLabelText('Select time range');
    timeRangeSelect.click();
    
    // Select 30 days
    const thirtyDaysOption = screen.getByText('Last 30 days');
    thirtyDaysOption.click();
    
    // Verify API was called with new time range
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('timeRange=30d'),
        expect.anything()
      );
    });
  });
});

describe('Export Functionality', () => {
  beforeEach(() => {
    // Mock window.URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
    
    // Mock document.createElement and appendChild/removeChild
    const mockClick = jest.fn();
    const originalCreateElement = document.createElement;
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return {
          setAttribute: jest.fn(),
          click: mockClick,
          style: {},
          download: '',
          href: '',
        };
      }
      return originalCreateElement(tagName);
    });
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();
  });

  it('exports data as CSV', async () => {
    render(<TestAnalytics testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Analytics')).toBeInTheDocument();
    });

    // Click export CSV button
    const exportCsvButton = screen.getByRole('button', { name: /export as csv/i });
    exportCsvButton.click();
    
    // Verify CSV export was triggered
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('exports data as PDF', async () => {
    // Mock jsPDF
    const mockSave = jest.fn();
    jest.mock('jspdf', () => {
      return jest.fn().mockImplementation(() => ({
        text: jest.fn(),
        autoTable: jest.fn(),
        save: mockSave,
        setFontSize: jest.fn(),
        setTextColor: jest.fn(),
      }));
    });
    
    render(<TestAnalytics testId="test123" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Analytics')).toBeInTheDocument();
    });

    // Click export PDF button
    const exportPdfButton = screen.getByRole('button', { name: /export as pdf/i });
    exportPdfButton.click();
    
    // Verify PDF export was triggered
    expect(mockSave).toHaveBeenCalled();
  });
});

describe('Real-time Updates', () => {
  it('subscribes to WebSocket updates', async () => {
    // Mock WebSocket
    const mockWebSocket = {
      onopen: jest.fn(),
      onmessage: jest.fn(),
      onclose: jest.fn(),
      onerror: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    };
    
    global.WebSocket = jest.fn(() => mockWebSocket);
    
    render(<TestAnalytics testId="test123" />);
    
    // Verify WebSocket connection was established
    expect(global.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('test123')
    );
    
    // Simulate WebSocket message
    const updateMessage = {
      type: 'analytics_update',
      payload: {
        totalAttempts: 151,
        updatedAt: new Date().toISOString(),
      },
    };
    
    // Trigger WebSocket message
    mockWebSocket.onmessage({ data: JSON.stringify(updateMessage) });
    
    // Verify UI was updated
    await waitFor(() => {
      expect(screen.getByText('151')).toBeInTheDocument();
    });
  });
});
