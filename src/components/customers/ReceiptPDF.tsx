import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Receipt } from '@/services/firestoreService';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    padding: 40,
    backgroundColor: '#fff',
    color: '#222',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    color: '#2563eb',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerDate: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 500,
  },
  blueLine: {
    height: 2,
    backgroundColor: '#2563eb',
    marginVertical: 12,
    borderRadius: 2,
  },
  section: {
    marginBottom: 18,
  },
  label: {
    color: '#666',
    fontWeight: 500,
    fontSize: 11,
    marginBottom: 2,
  },
  value: {
    color: '#222',
    fontWeight: 600,
    fontSize: 13,
    marginBottom: 8,
  },
  amountBox: {
    marginTop: 18,
    marginBottom: 18,
    padding: 12,
    border: '1px solid #2563eb',
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#f5faff',
  },
  amountLabel: {
    color: '#2563eb',
    fontWeight: 500,
    fontSize: 12,
    marginBottom: 2,
  },
  amountValue: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 1,
  },
  notes: {
    marginTop: 10,
    color: '#444',
    fontSize: 11,
    fontStyle: 'italic',
  },
  divider: {
    borderBottom: '1px solid #e5e7eb',
    marginVertical: 16,
  },
  footer: {
    marginTop: 32,
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
});

interface ReceiptPDFProps {
  receipt: Receipt;
}

const ReceiptPDF: React.FC<ReceiptPDFProps> = ({ receipt }) => {
  const safe = (val: any) => (val !== undefined && val !== null ? String(val) : 'N/A');
  const formatDate = (date: any) => {
    try {
      if (!date) return 'N/A';
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toLocaleDateString('en-GB');
      if (date.toDate) return date.toDate().toLocaleDateString('en-GB');
      return safe(date);
    } catch {
      return 'N/A';
    }
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code || '₹';
    }
  };

  // Format amount with thousands separator
  const formatAmount = (amount: any) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return num.toLocaleString('en-IN');
  };

  const currency = receipt.currency || 'INR';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Payment Receipt</Text>
          <Text style={styles.headerDate}>{formatDate(receipt.date)}</Text>
        </View>
        <View style={styles.blueLine}></View>
        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.label}>Receipt #</Text>
          <Text style={styles.value}>{safe(receipt.reference_number)}</Text>

          <Text style={styles.label}>Invoice #</Text>
          <Text style={styles.value}>{safe(receipt.invoice_id)}</Text>

          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{safe(receipt.customer_name)}</Text>

          <Text style={styles.label}>Payment Method</Text>
          <Text style={styles.value}>{safe(receipt.method).toUpperCase()}</Text>

          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{safe(receipt.status).toUpperCase()}</Text>
        </View>
        {/* Amount */}
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Amount Paid</Text>
          <Text style={styles.amountValue}>
            {getCurrencySymbol(currency)} {formatAmount(safe(receipt.amount))}
            <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: 500 }}> {currency}</Text>
          </Text>
        </View>
        {/* Notes */}
        {receipt.notes && (
          <Text style={styles.notes}>Notes: {safe(receipt.notes)}</Text>
        )}
        <View style={styles.divider}></View>
        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer-generated receipt and does not require a signature.</Text>
          <Text>For any questions, please contact our support team.</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReceiptPDF; 