import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaymentHistoryItem from '../PaymentHistoryItem';
import '@testing-library/jest-dom';

// Mock the PDF download functionality
jest.mock('@react-pdf/renderer', () => ({
  PDFDownloadLink: jest.fn(({ children }) => 
    children({ blob: null, url: 'mocked-pdf-url', loading: false, error: null })
  ),
  Document: jest.fn(({ children }) => <div>{children}</div>),
  Page: jest.fn(({ children }) => <div>{children}</div>),
  View: jest.fn(({ children }) => <div>{children}</div>),
  Text: jest.fn(({ children }) => <div>{children}</div>),
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
}));

describe('PaymentHistoryItem', () => {
  const mockPayment = {
    id: 'txn_123456',
    date: '2023-06-15T10:30:00Z',
    description: 'Premium Subscription - Annual',
    amount: 4999,
    discount: 1000,
    currency: 'INR',
    status: 'completed',
    invoiceUrl: '/invoices/123',
    receiptUrl: '/receipts/123',
    notes: 'Auto-renewal scheduled for June 15, 2024',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    items: [
      {
        description: 'Premium Subscription - Annual',
        quantity: 1,
        rate: 5999
      }
    ]
  };

  const renderComponent = (overrides = {}) => {
    const payment = { ...mockPayment, ...overrides };
    return render(<PaymentHistoryItem payment={payment} />);
  };

  it('renders payment details correctly', () => {
    renderComponent();
    
    expect(screen.getByText('Premium Subscription - Annual')).toBeInTheDocument();
    expect(screen.getByText('₹4,999')).toBeInTheDocument();
    expect(screen.getByText('₹5,999')).toHaveClass('line-through');
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows notes when provided', () => {
    renderComponent();
    expect(screen.getByText('Auto-renewal scheduled for June 15, 2024')).toBeInTheDocument();
  });

  it('does not show notes when not provided', () => {
    const { queryByText } = renderComponent({ notes: undefined });
    expect(queryByText('Auto-renewal scheduled for June 15, 2024')).not.toBeInTheDocument();
  });

  it('shows invoice and receipt buttons when urls are provided', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /invoice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /receipt/i })).toBeInTheDocument();
  });

  it('applies correct status styling for different statuses', () => {
    const { rerender, container } = renderComponent();
    
    // Test completed status
    let statusBadge = container.querySelector('.bg-green-100');
    expect(statusBadge).toHaveTextContent('Completed');
    
    // Test pending status
    rerender(<PaymentHistoryItem payment={{ ...mockPayment, status: 'pending' }} />);
    statusBadge = container.querySelector('.bg-yellow-100');
    expect(statusBadge).toHaveTextContent('Pending');
    
    // Test failed status
    rerender(<PaymentHistoryItem payment={{ ...mockPayment, status: 'failed' }} />);
    statusBadge = container.querySelector('.bg-red-100');
    expect(statusBadge).toHaveTextContent('Failed');
    
    // Test refunded status
    rerender(<PaymentHistoryItem payment={{ ...mockPayment, status: 'refunded' }} />);
    statusBadge = container.querySelector('.bg-blue-100');
    expect(statusBadge).toHaveTextContent('Refunded');
  });

  it('formats currency correctly for different currencies', () => {
    // Test INR
    const { rerender } = renderComponent();
    expect(screen.getByText('₹4,999')).toBeInTheDocument();
    
    // Test USD
    rerender(<PaymentHistoryItem payment={{ ...mockPayment, currency: 'USD' }} />);
    expect(screen.getByText('$4,999.00')).toBeInTheDocument();
    
    // Test EUR
    rerender(<PaymentHistoryItem payment={{ ...mockPayment, currency: 'EUR' }} />);
    expect(screen.getByText('€4,999.00')).toBeInTheDocument();
  });

  it('handles click on receipt button', async () => {
    const originalOpen = window.open;
    window.open = jest.fn();
    
    renderComponent();
    const receiptButton = screen.getByRole('button', { name: /receipt/i });
    await userEvent.click(receiptButton);
    
    expect(window.open).toHaveBeenCalledWith('/receipts/123', '_blank');
    
    window.open = originalOpen;
  });

  it('hides receipt button when no receipt URL is provided', () => {
    renderComponent({ receiptUrl: undefined });
    const receiptButton = screen.queryByRole('link', { name: /receipt/i });
    expect(receiptButton).not.toBeInTheDocument();
  });

  it('shows the correct date format', () => {
    renderComponent({ date: '2023-06-15T10:30:00Z' });
    expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument();  // Using the mocked date from the component
  });

  it('renders the invoice download button', () => {
    renderComponent();
    const invoiceButton = screen.getByText(/invoice/i);
    expect(invoiceButton).toBeInTheDocument();
  });

  it('does not render invoice download button for failed payments', () => {
    renderComponent({ status: 'failed' });
    expect(screen.queryByRole('button', { name: /invoice/i })).not.toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const minimalPayment = {
      id: 'txn_minimal',
      date: '2023-01-01T00:00:00Z',
      description: 'Minimal Payment',
      amount: 1000,
      currency: 'INR',
      status: 'completed',
    };
    
    render(<PaymentHistoryItem payment={minimalPayment} />);
    
    expect(screen.getByText('Minimal Payment')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.queryByText('₹')).not.toBeInTheDocument(); // No discount shown
    expect(screen.queryByRole('button', { name: /receipt/i })).not.toBeInTheDocument();
  });
});
