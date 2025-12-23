'use client';

import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  col: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 10,
    width: 100,
  },
  table: {
    width: '100%',
    marginTop: 20,
    border: '1px solid #e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e0e0e0',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
    padding: 8,
    borderRight: '1px solid #e0e0e0',
  },
  tableCell: {
    padding: 8,
    borderRight: '1px solid #e0e0e0',
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #e0e0e0',
  },
  totalLabel: {
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
    paddingRight: 10,
  },
  totalValue: {
    fontWeight: 'bold',
    width: 100,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTop: '1px solid #e0e0e0',
    paddingTop: 10,
  },
});

const InvoiceDocument = ({ invoice }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>INVOICE</Text>
        <Text style={styles.subtitle}>Mindora Education Pvt. Ltd.</Text>
        <Text style={styles.subtitle}>123 Learning Street, Knowledge City</Text>
        <Text style={styles.subtitle}>GSTIN: 22AAAAA0000A1Z5</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.subtitle}>Bill To:</Text>
          <Text>{invoice.customerName}</Text>
          <Text>{invoice.customerEmail}</Text>
          <Text>Invoice #: {invoice.invoiceNumber}</Text>
          <Text>Date: {format(new Date(invoice.date), 'MMM d, yyyy')}</Text>
        </View>
        <View style={styles.col}>
          <Text style={[styles.subtitle, { textAlign: 'right' }]}>Amount Due:</Text>
          <Text style={{ textAlign: 'right', fontSize: 18, fontWeight: 'bold' }}>
            ₹{invoice.total.toLocaleString('en-IN')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: 'right', marginTop: 10 }]}>
            Status: {invoice.status}
          </Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, { backgroundColor: '#f5f5f5' }]}>
          <Text style={[styles.tableHeader, { width: '50%' }]}>Description</Text>
          <Text style={[styles.tableHeader, { width: '15%', textAlign: 'right' }]}>Qty</Text>
          <Text style={[styles.tableHeader, { width: '20%', textAlign: 'right' }]}>Rate</Text>
          <Text style={[styles.tableHeader, { width: '15%', textAlign: 'right', borderRight: 'none' }]}>Amount</Text>
        </View>
        
        {invoice.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: '50%' }]}>{item.description}</Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{item.quantity}</Text>
            <Text style={[styles.tableCell, { width: '20%', textAlign: 'right' }]}>
              ₹{item.rate.toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', borderRight: 'none' }]}>
              ₹{(item.quantity * item.rate).toLocaleString('en-IN')}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Subtotal:</Text>
        <Text style={styles.totalValue}>₹{invoice.subtotal.toLocaleString('en-IN')}</Text>
      </View>
      
      {invoice.discount > 0 && (
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Discount:</Text>
          <Text style={styles.totalValue}>-₹{invoice.discount.toLocaleString('en-IN')}</Text>
        </View>
      )}
      
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tax (18%):</Text>
        <Text style={styles.totalValue}>₹{invoice.tax.toLocaleString('en-IN')}</Text>
      </View>
      
      <View style={[styles.totalRow, { borderTopWidth: 2, borderTopColor: '#000' }]}>
        <Text style={[styles.totalLabel, { fontSize: 14 }]}>Total:</Text>
        <Text style={[styles.totalValue, { fontSize: 14 }]}>₹{invoice.total.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>Mindora Education Pvt. Ltd. | support@mindora.com | +91 98765 43210</Text>
      </View>
    </Page>
  </Document>
);

export default function InvoicePDF({ payment }) {
  // Format payment data for the invoice
  const invoice = {
    invoiceNumber: `INV-${payment.id.slice(-6).toUpperCase()}`,
    date: payment.date,
    customerName: payment.customerName || 'Customer',
    customerEmail: payment.customerEmail || 'customer@example.com',
    status: payment.status || 'Paid',
    items: [
      {
        description: payment.description,
        quantity: 1,
        rate: payment.amount + (payment.discount || 0),
      },
    ],
    subtotal: payment.amount + (payment.discount || 0),
    discount: payment.discount || 0,
    tax: Math.round((payment.amount * 0.18) * 100) / 100, // 18% GST
    total: payment.amount,
  };

  const fileName = `invoice-${invoice.invoiceNumber}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoiceDocument invoice={invoice} />}
      fileName={fileName}
      style={{ textDecoration: 'none' }}
    >
      {({ blob, url, loading, error }) => (
        <Button variant="outline" size="sm" disabled={loading}>
          {loading ? (
            'Generating...'
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Invoice
            </>
          )}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
