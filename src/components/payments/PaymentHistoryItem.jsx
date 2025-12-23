'use client';

import { format } from 'date-fns';
import { Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoicePDF from './InvoicePDF';

export default function PaymentHistoryItem({ payment }) {
  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-blue-100 text-blue-800',
  };

  const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-gray-900">{payment.description}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[payment.status] || 'bg-gray-100 text-gray-800'}`}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(payment.date), 'MMM d, yyyy')} • {payment.id}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
            {payment.discount > 0 && (
              <p className="text-sm text-gray-500 line-through">
                {formatCurrency(payment.amount + payment.discount, payment.currency)}
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {payment.status === 'completed' && (
              <InvoicePDF payment={{
                ...payment,
                customerName: 'John Doe', // Replace with actual user data
                customerEmail: 'john@example.com' // Replace with actual user data
              }} />
            )}
            {payment.receiptUrl && (
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={payment.receiptUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Receipt</span>
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {payment.notes && (
        <div className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">
          {payment.notes}
        </div>
      )}
    </div>
  );
}
