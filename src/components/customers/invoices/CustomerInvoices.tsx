import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Invoice, InvoiceItem, addInvoice, getAllInvoices, Customer, getCustomers, addReceipt, updateInvoiceStatus, updateCustomerRenewalDate } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';
import { printInvoiceHtml } from '@/print/printInvoiceHtml';
import InvoiceTable from './InvoiceTable';
import InvoiceDetailsModal from './InvoiceDetailsModal';
import AddInvoiceModal from './AddInvoiceModal';

const currencyOptions = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

const PRIMARY_COLOR = '#01358c';
// primary colour #01358c

// Modern HTML template with dynamic data and primary color
const invoiceHtmlTemplate = ({ invoice, customer }) => `
  <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; background: #fff; color: #222; padding: 40px 48px; border-radius: 12px; border: 1px solid #eee;">
    <div style="display: flex; align-items: flex-start; border-bottom: 1px solid #eee; padding-bottom: 24px; margin-bottom: 64px;">
      <img src="/assets/vetqure.png" alt="Vetqure Logo" style="height: 56px; margin-right: 32px;" />
      <div style="text-align: left;">
        <div style="font-weight: 700; font-size: 2rem; color: #222; margin-bottom: 2px;">VAMS Veterinary Consultancy Pvt Ltd</div>
        <div style="font-size: 15px; color: #888;">KRA-113, Kedaram Nagar, Pattom, Trivandrum</div>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
      <div>
        <div style="font-weight: 700; color: #2563eb; margin-bottom: 4px;">Bill to</div>
        <div style="font-weight: 500;">${customer.entity_name}</div>
        <div>${customer.address || ''}</div>
        <div>${customer.email || ''}</div>
        <div>${customer.phone || ''}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 700; color: #2563eb; margin-bottom: 4px;">Details</div>
        <div style="font-size: 13px; color: #444;">Invoice number: <b>${invoice.invoice_id || invoice.id}</b></div>
        <div style="font-size: 13px; color: #444;">Invoice date: <b>${invoice.date_created?.toDate ? invoice.date_created.toDate().toLocaleDateString('en-GB') : ''}</b></div>
        <div style="font-size: 13px; color: #444;">Due date: <b>${invoice.due_date?.toDate ? invoice.due_date.toDate().toLocaleDateString('en-GB') : ''}</b></div>
        <div style="font-size: 13px; color: #444;">Status: <b>${invoice.status}</b></div>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr>
          <th style="background: #f5f5f5; color: #222; padding: 10px; text-align: left; font-weight: 700; font-size: 15px;">Description</th>
          <th style="background: #f5f5f5; color: #222; padding: 10px; text-align: right; font-weight: 700; font-size: 15px;">QTY</th>
          <th style="background: #f5f5f5; color: #222; padding: 10px; text-align: right; font-weight: 700; font-size: 15px;">Rate (${invoice.currency})</th>
          <th style="background: #f5f5f5; color: #222; padding: 10px; text-align: right; font-weight: 700; font-size: 15px;">Amount (${invoice.currency})</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items.map(item => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; font-weight: 700; color: #2563eb; font-size: 16px; border-top: 2px solid #eee;">Total</td>
          <td style="padding: 10px; text-align: right; font-weight: 700; color: #2563eb; font-size: 16px; border-top: 2px solid #eee;">${invoice.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${invoice.currency}</td>
        </tr>
      </tfoot>
    </table>
    <div style="margin-bottom: 16px; color: #888; font-size: 13px;"><b>Notes:</b> ${invoice.notes || '-'}</div>
    <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 16px; color: #888; font-size: 12px; text-align: center;">
      Thank you for your business!<br />VAMS Veterinary Consultancy Pvt Ltd
    </div>
  </div>
`;

const CustomerInvoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    customer_name: '',
    date_created: Timestamp.now(),
    due_date: Timestamp.now(),
    status: 'pending' as const,
    total: 0,
    items: [] as InvoiceItem[],
    notes: '',
    currency: 'INR',
  });
  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    amount: 0
  });
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [receiptForm, setReceiptForm] = useState({
    method: 'cash' as 'card' | 'cash' | 'bank_transfer',
    notes: '',
    reference_number: '',
  });
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesData, customersData] = await Promise.all([
        getAllInvoices(),
        getCustomers()
      ]);
      setInvoices(invoicesData);
      setCustomers(customersData);
      console.log('Fetched customers:', customersData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate customer selection
      if (!newInvoice.customer_id) {
        toast.error('Please select a customer');
        return;
      }

      // Validate items
      if (newInvoice.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      // Create the invoice in Firestore
      await addInvoice({
        ...newInvoice,
        date_created: Timestamp.now(),
        due_date: Timestamp.fromDate(new Date(newInvoice.due_date.toDate())),
        status: 'pending',
        total: newInvoice.items.reduce((sum, item) => sum + item.amount, 0)
      });

      toast.success('Invoice created successfully');
      setIsAddModalOpen(false);
      
      // Reset form
      setNewInvoice({
        customer_id: '',
        customer_name: '',
        date_created: Timestamp.now(),
        due_date: Timestamp.now(),
        status: 'pending',
        total: 0,
        items: [],
        notes: '',
        currency: 'INR',
      });
      
      // Reload data
      loadData();
    } catch (error) {
      toast.error('Failed to create invoice');
      console.error('Error creating invoice:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0) {
      toast.error('Please fill in all item details correctly');
      return;
    }

    const amount = newItem.quantity * newItem.unit_price;
    setNewInvoice(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem, amount }],
      total: prev.total + amount
    }));
    setNewItem({
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setNewInvoice(prev => ({
        ...prev,
        customer_id: customer.id!,
        customer_name: customer.entity_name
      }));
    }
  };

  const handleRemoveItem = (index: number) => {
    setNewInvoice(prev => {
      const item = prev.items[index];
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
        total: prev.total - item.amount
      };
    });
  };

  const handleViewDetails = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setLoadingDetails(true);
    setIsDetailsModalOpen(true);
    try {
      const customer = customers.find(c => c.id === invoice.customer_id);
      if (customer) {
        setSelectedCustomer(customer);
      } else {
        setSelectedCustomer(null);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSendEmail = () => {
    toast.success('Invoice sent to customer email (placeholder)');
    // Here you would call your backend/email API
  };

  const handleGeneratePDF = () => {
    if (!selectedInvoice || !selectedCustomer) return;
    const html = invoiceHtmlTemplate({ invoice: selectedInvoice, customer: selectedCustomer });
    const style = `<style>body { font-family: Arial, sans-serif; margin: 0; color: #333; } .container { max-width: 700px; margin: 20px auto; padding: 20px; border: 1px solid #e0e0e0; box-shadow: 0 0 10px rgba(0,0,0,0.05); } h1, h2, h3 { margin: 0; } .header, .footer { text-align: center; margin-bottom: 20px; } .header h1 { font-size: 24px; } .section { margin-bottom: 20px; } .flex { display: flex; justify-content: space-between; align-items: flex-start; } .billing-details, .bank-details { margin-top: 10px; line-height: 1.6; } .table { width: 100%; border-collapse: collapse; margin-top: 10px; } .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; } .table th { background: #f5f5f5; } .footer p { margin: 5px 0; }</style>`;
    const fullHtml = `<html><head>${style}</head><body>${html}</body></html>`;
    const element = document.createElement('div');
    element.innerHTML = fullHtml;
    html2pdf().from(element).save(`Invoice_${selectedInvoice.invoice_id || selectedInvoice.id}.pdf`);
  };

  const handleOpenReceiptModal = () => {
    setIsReceiptModalOpen(true);
  };

  const handleCloseReceiptModal = () => {
    setIsReceiptModalOpen(false);
  };

  const handleGenerateReceipt = async () => {
    if (!selectedInvoice || !selectedCustomer) return;
    setReceiptLoading(true);
    try {
      // Create receipt
      const receiptData = {
        invoice_id: selectedInvoice.id!,
        customer_id: selectedCustomer.id!,
        customer_name: selectedCustomer.entity_name,
        amount: selectedInvoice.total,
        date: new Date(),
        method: receiptForm.method,
        status: 'successful' as 'successful',
        reference_number: receiptForm.reference_number || undefined,
        notes: receiptForm.notes || undefined,
        currency: selectedInvoice.currency,
      };
      await addReceipt(receiptData);
      // Update invoice status
      await updateInvoiceStatus(selectedInvoice.id!, 'completed');
      // Update customer renewal_date to one month later
      const currentRenewal = selectedCustomer.renewal_date?.toDate?.() || new Date();
      const nextRenewal = new Date(currentRenewal);
      nextRenewal.setMonth(nextRenewal.getMonth() + 1);
      await updateCustomerRenewalDate(selectedCustomer.id!, Timestamp.fromDate(nextRenewal));
      toast.success('Receipt generated and invoice marked as completed!');
      setIsReceiptModalOpen(false);
      setReceiptForm({ method: 'cash', notes: '', reference_number: '' });
      loadData();
    } catch (error) {
      toast.error('Failed to generate receipt');
      console.error('Error generating receipt:', error);
    } finally {
      setReceiptLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-pink-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to get currency symbol
  const getCurrencySymbol = (code: string) => {
    const found = currencyOptions.find(opt => opt.code === code);
    return found ? found.symbol : '₹';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Invoices</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <InvoiceTable
              invoices={invoices}
              customers={customers}
              searchTerm={searchTerm}
              onViewDetails={handleViewDetails}
            />
          )}
        </CardContent>
      </Card>

      {/* Add Invoice Modal */}
      <AddInvoiceModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        customers={customers}
        onInvoiceCreated={loadData}
      />

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        invoice={selectedInvoice}
        customer={selectedCustomer}
        loading={loadingDetails}
        onSendEmail={handleSendEmail}
        onPrint={() => printInvoiceHtml(selectedInvoice, selectedCustomer)}
        onGenerateReceipt={handleOpenReceiptModal}
      />

      {/* Receipt Modal */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Receipt</DialogTitle>
            <DialogDescription>
              Fill out the form to create a receipt for this invoice. This will mark the invoice as paid and update the customer renewal date.
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && selectedCustomer ? (
            <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); handleGenerateReceipt(); }}>
              <div>
                <Label>Amount</Label>
                <Input value={selectedInvoice.total} disabled />
              </div>
              <div>
                <Label>Payment Method</Label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={receiptForm.method}
                  onChange={e => setReceiptForm({ ...receiptForm, method: e.target.value as any })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
              <div>
                <Label>Reference Number (optional)</Label>
                <Input
                  value={receiptForm.reference_number}
                  onChange={e => setReceiptForm({ ...receiptForm, reference_number: e.target.value })}
                  placeholder="Transaction/Reference number"
                />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  rows={2}
                  value={receiptForm.notes}
                  onChange={e => setReceiptForm({ ...receiptForm, notes: e.target.value })}
                  placeholder="Add any notes..."
                />
              </div>
              <DialogFooter>
                <Button type="button" onClick={handleCloseReceiptModal} variant="outline" disabled={receiptLoading}>Cancel</Button>
                <Button type="submit" className="bg-purple-600 text-white" disabled={receiptLoading}>
                  {receiptLoading ? 'Generating...' : 'Generate Receipt'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div>No invoice selected.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerInvoices; 