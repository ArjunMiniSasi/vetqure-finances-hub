import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Invoice, Customer } from '@/services/firestoreService';
import { printGSTInvoice, downloadGSTInvoice } from '@/utils/gstInvoiceUtils';
import { toast } from 'react-hot-toast';

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
  const handlePrintGSTInvoice = () => {
    if (!invoice || !customer) {
      toast.error('Invoice or customer data not available');
      return;
    }
    
    const businessProfile = {
      displayName: 'VAMS Veterinary Consultancy Private Limited',
      address: {
        line1: 'KRA-113, Kedaram Nagar',
        line2: 'Pattom',
        city: 'Trivandrum',
        state: 'Kerala',
        pincode: '695004'
      },
      gstin: '32AAGCV9195E1Z2',
      contactPhone: '+91 9562819995',
      contactEmail: 'info@vamsvetconsultancy.com'
    };
    
    printGSTInvoice(invoice, customer, businessProfile);
  };

  const handleDownloadGSTInvoice = async () => {
    if (!invoice || !customer) {
      toast.error('Invoice or customer data not available');
      return;
    }
    
    const businessProfile = {
      displayName: 'VAMS Veterinary Consultancy Private Limited',
      address: {
        line1: 'KRA-113, Kedaram Nagar',
        line2: 'Pattom',
        city: 'Trivandrum',
        state: 'Kerala',
        pincode: '695004'
      },
      gstin: '32AAGCV9195E1Z2',
      contactPhone: '+91 9562819995',
      contactEmail: 'info@vamsvetconsultancy.com'
    };
    
    try {
      await downloadGSTInvoice(invoice, customer, businessProfile);
      toast.success('GST Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading GST invoice:', error);
      toast.error('Failed to download GST invoice');
    }
  };

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
            <div className="flex flex-wrap gap-2 mt-4">
              <Button type="button" onClick={onSendEmail} className="bg-blue-600 text-white">Send Email</Button>
              <Button type="button" onClick={onPrint} className="bg-indigo-600 text-white">Print Invoice</Button>
              <Button type="button" onClick={handlePrintGSTInvoice} className="bg-purple-600 text-white">Print GST Invoice</Button>
              <Button type="button" onClick={handleDownloadGSTInvoice} className="bg-green-600 text-white">Download GST PDF</Button>
              <Button type="button" onClick={onGenerateReceipt} className="bg-orange-600 text-white">Generate Receipt</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetailsModal; 