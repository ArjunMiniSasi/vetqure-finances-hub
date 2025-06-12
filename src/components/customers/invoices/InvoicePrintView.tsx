import React from 'react';
import { Invoice, Customer } from '@/services/firestoreService';

interface InvoicePrintViewProps {
  invoice: Invoice;
  customer: Customer;
}

const PRIMARY_COLOR = '#01358c';

const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, customer }) => {
  const formatDate = (date: any) => {
    try {
      if (!date) return '';
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toLocaleDateString('en-GB');
      if (date.toDate) return date.toDate().toLocaleDateString('en-GB');
      return String(date);
    } catch {
      return '';
    }
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'INR': return '\u20B9';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code || '\u20B9';
    }
  };

  const formatAmount = (amount: any) => {
    const num = Number(amount);
    if (isNaN(num)) return amount;
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 800, margin: '40px auto', background: '#fff', color: '#222', padding: '40px 48px', borderRadius: 12, border: '1px solid #eee' }}>
      {/* Header Block */}
      <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '1px solid #eee', paddingBottom: 24, marginBottom: 64 }}>
        <img src="/assets/vetqure.png" alt="Vetqure Logo" style={{ height: 56, marginRight: 32 }} />
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 700, fontSize: '2rem', color: '#222', marginBottom: 2 }}>VAMS Veterinary Consultancy Pvt Ltd</div>
          <div style={{ fontSize: 15, color: '#888' }}>KRA-113, Kedaram Nagar, Pattom, Trivandrum</div>
        </div>
      </div>
      {/* Bill To & Details */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontWeight: 700, color: PRIMARY_COLOR, marginBottom: 4 }}>Bill to</div>
          <div style={{ fontWeight: 500 }}>{customer.entity_name}</div>
          <div>{customer.address}</div>
          <div>{customer.email}</div>
          <div>{customer.phone}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: PRIMARY_COLOR, marginBottom: 4 }}>Details</div>
          <div style={{ fontSize: 13, color: '#444' }}>Invoice number: <b>{invoice.invoice_id || invoice.id}</b></div>
          <div style={{ fontSize: 13, color: '#444' }}>Invoice date: <b>{formatDate(invoice.date_created)}</b></div>
          <div style={{ fontSize: 13, color: '#444' }}>Due date: <b>{formatDate(invoice.due_date)}</b></div>
          <div style={{ fontSize: 13, color: '#444' }}>Status: <b>{invoice.status}</b></div>
        </div>
      </div>
      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr>
            <th style={{ background: '#f5f5f5', color: '#222', padding: 10, textAlign: 'left', fontWeight: 700, fontSize: 15 }}>Description</th>
            <th style={{ background: '#f5f5f5', color: '#222', padding: 10, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>QTY</th>
            <th style={{ background: '#f5f5f5', color: '#222', padding: 10, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>Rate ({getCurrencySymbol(invoice.currency)})</th>
            <th style={{ background: '#f5f5f5', color: '#222', padding: 10, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>Amount ({getCurrencySymbol(invoice.currency)})</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item: any, idx: number) => (
            <tr key={idx}>
              <td style={{ padding: 10, borderBottom: '1px solid #eee' }}>{item.description}</td>
              <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #eee' }}>{item.quantity}</td>
              <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #eee' }}>{formatAmount(item.unit_price)}</td>
              <td style={{ padding: 10, textAlign: 'right', borderBottom: '1px solid #eee' }}>{formatAmount(item.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3} style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: PRIMARY_COLOR, fontSize: 16, borderTop: '2px solid #eee' }}>Total</td>
            <td style={{ padding: 10, textAlign: 'right', fontWeight: 700, color: PRIMARY_COLOR, fontSize: 16, borderTop: '2px solid #eee' }}>{getCurrencySymbol(invoice.currency)} {formatAmount(invoice.total)}</td>
          </tr>
        </tfoot>
      </table>
      {/* Notes and Footer */}
      <div style={{ marginBottom: 16, color: '#888', fontSize: 13 }}><b>Notes:</b> {invoice.notes || '-'}</div>
      <div style={{ color: '#888', fontSize: 12, borderTop: '1px solid #eee', marginTop: 32, paddingTop: 16, textAlign: 'center' }}>
        Thank you for your business!<br />VAMS Veterinary Consultancy Pvt Ltd
      </div>
    </div>
  );
};

export default InvoicePrintView; 