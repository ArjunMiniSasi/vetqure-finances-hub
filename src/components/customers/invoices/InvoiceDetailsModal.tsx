import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice, Customer } from '@/services/firestoreService';

interface InvoiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  customer: Customer | null;
  loading: boolean;
  onSendEmail: () => void;
  onPrint: () => void;
  onGenerateReceipt: () => void;
}

const InvoiceDetailsModal: React.FC<InvoiceDetailsModalProps> = ({
  open,
  onOpenChange,
  invoice,
  customer,
  loading,
  onSendEmail,
  onPrint,
  onGenerateReceipt,
}) => {
  if (!invoice || !customer) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
          <DialogDescription>
            View all details for this invoice. You can send the invoice by email, print, or create a receipt.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <strong>Invoice ID:</strong> {invoice.id}
            </div>
            <div>
              <strong>Customer:</strong> {customer.name}
            </div>
            <div>
              <strong>Address:</strong> {customer.address}
            </div>
            <div>
              <strong>Date:</strong> {invoice.date_created?.toDate ? invoice.date_created.toDate().toLocaleDateString() : ''}
            </div>
            <div>
              <strong>Due Date:</strong> {invoice.due_date?.toDate ? invoice.due_date.toDate().toLocaleDateString() : ''}
            </div>
            <div>
              <strong>Status:</strong> {invoice.status}
            </div>
            <div>
              <strong>Currency:</strong> {invoice.currency}
            </div>
            <div>
              <strong>Notes:</strong> {invoice.notes}
            </div>
            <div>
              <strong>Items:</strong>
              <ul className="list-disc ml-6">
                {invoice.items.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.description} | Qty: {item.quantity} | Unit: {item.unit_price} | Amount: {item.amount}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <strong>Total:</strong> {invoice.total} {invoice.currency}
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="button" onClick={onSendEmail} className="bg-blue-600 text-white">Send Email</Button>
              <Button type="button" onClick={onPrint} className="bg-indigo-600 text-white">Print Invoice</Button>
              <Button type="button" onClick={onGenerateReceipt} className="bg-purple-600 text-white">Generate Receipt</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal; 