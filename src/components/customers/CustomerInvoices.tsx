import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Invoice, InvoiceItem, addInvoice, getAllInvoices, Customer, getCustomers } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';

const currencyOptions = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

// HTML template with placeholders for available data
const invoiceHtmlTemplate = ({ invoice, customer }) => `
  <div class="container">
    <div class="header">
      <h1>Billing Invoice</h1>
      <p>${invoice.date_created.toDate().toLocaleDateString()}</p>
    </div>
    <div class="section">
      <h3>VetQure Bill Details</h3>
      <p><strong>Invoice number:</strong> ${invoice.invoice_id || invoice.id}</p>
      <p><strong>Date of issue:</strong> ${invoice.date_created.toDate().toLocaleDateString()}</p>
      <p><strong>Payment due on:</strong> ${invoice.due_date.toDate().toLocaleDateString()}</p>
    </div>
    <div class="section flex">
      <div>
        <h3>From</h3>
        <p>VAMS Veterinary Consultancy Pvt Ltd<br>
          KRA-113, Kedaram Nagar, Pattom<br>
          Trivandrum<br>
        </p>
      </div>
      <div>
        <h3>Billing Details</h3>
        <p>${customer.name}<br>
          ${customer.address || ''}<br>
          ${customer.email ? 'Email: ' + customer.email + '<br>' : ''}
        </p>
      </div>
    </div>
    <div class="section">
      <h3>Description</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>QTY</th>
            <th>Rate (${invoice.currency})</th>
            <th>Total Amount (${invoice.currency})</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.quantity}</td>
              <td>${item.unit_price}</td>
              <td>${item.amount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="section">
      <h3>Payment Terms:</h3>
      <p>Payment is due upon receipt of the VAMS Veterinary Consultancy Pvt Ltd</p>
    </div>
    <div class="footer">
      <p>Thank you for your business!</p>
      <p>Sincerely,</p>
      <p>Arjun M S<br>Director, VAMS Veterinary Consultancy Pvt Ltd</p>
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
    status: 'draft' as const,
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
        status: 'draft',
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
        status: 'draft',
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
        customer_name: customer.name
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

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
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
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {invoice.date_created.toDate().toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {invoice.due_date.toDate().toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            invoice.status
                          )}`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getCurrencySymbol(invoice.currency)}{invoice.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-900" onClick={() => handleViewDetails(invoice)}>
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Invoice Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new invoice for a customer. All required fields must be completed before saving.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddInvoice} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <select
                  id="customer"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newInvoice.customer_id}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={newInvoice.due_date.toDate().toISOString().split('T')[0]}
                  onChange={(e) => setNewInvoice({
                    ...newInvoice,
                    due_date: Timestamp.fromDate(new Date(e.target.value))
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <select
                  id="currency"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newInvoice.currency}
                  onChange={e => setNewInvoice({ ...newInvoice, currency: e.target.value })}
                  required
                >
                  {currencyOptions.map(opt => (
                    <option key={opt.code} value={opt.code}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Invoice Items</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      quantity: parseInt(e.target.value),
                      amount: parseInt(e.target.value) * newItem.unit_price
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="unit_price">Unit Price</Label>
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({
                      ...newItem,
                      unit_price: parseFloat(e.target.value),
                      amount: newItem.quantity * parseFloat(e.target.value)
                    })}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full"
                    disabled={!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0}
                  >
                    Add Item
                  </Button>
                </div>
              </div>

              {newInvoice.items.length > 0 && (
                <div className="mt-4">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Description</th>
                        <th className="text-right py-2">Quantity</th>
                        <th className="text-right py-2">Unit Price</th>
                        <th className="text-right py-2">Amount</th>
                        <th className="text-right py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{item.description}</td>
                          <td className="text-right py-2">{item.quantity}</td>
                          <td className="text-right py-2">{getCurrencySymbol(newInvoice.currency)}{item.unit_price.toFixed(2)}</td>
                          <td className="text-right py-2">{getCurrencySymbol(newInvoice.currency)}{item.amount.toFixed(2)}</td>
                          <td className="text-right py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleRemoveItem(index)}
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="text-right py-2 font-medium">Total:</td>
                        <td className="text-right py-2 font-medium">
                          {getCurrencySymbol(newInvoice.currency)}{newInvoice.total.toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                value={newInvoice.notes}
                onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                placeholder="Add any additional notes here..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newInvoice.customer_id || newInvoice.items.length === 0}
              >
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              View all details for this invoice. You can send the invoice by email, generate a PDF, or create a receipt.
            </DialogDescription>
          </DialogHeader>
          {loadingDetails ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : selectedInvoice && selectedCustomer ? (
            <div className="space-y-4">
              <div>
                <strong>Invoice ID:</strong> {selectedInvoice.id}
              </div>
              <div>
                <strong>Customer:</strong> {selectedCustomer.name}
              </div>
              <div>
                <strong>Address:</strong> {selectedCustomer.address}
              </div>
              <div>
                <strong>Date:</strong> {selectedInvoice.date_created.toDate().toLocaleDateString()}
              </div>
              <div>
                <strong>Due Date:</strong> {selectedInvoice.due_date.toDate().toLocaleDateString()}
              </div>
              <div>
                <strong>Status:</strong> {selectedInvoice.status}
              </div>
              <div>
                <strong>Currency:</strong> {selectedInvoice.currency}
              </div>
              <div>
                <strong>Notes:</strong> {selectedInvoice.notes}
              </div>
              <div>
                <strong>Items:</strong>
                <ul className="list-disc ml-6">
                  {selectedInvoice.items.map((item, idx) => (
                    <li key={idx}>
                      {item.description} | Qty: {item.quantity} | Unit: {item.unit_price} | Amount: {item.amount}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Total:</strong> {selectedInvoice.total} {selectedInvoice.currency}
              </div>
              <div className="flex gap-2 mt-4">
                <Button type="button" onClick={handleSendEmail} className="bg-blue-600 text-white">Send Email</Button>
                <Button type="button" onClick={handleGeneratePDF} className="bg-green-600 text-white">Generate PDF</Button>
                <Button type="button" onClick={handleOpenReceiptModal} className="bg-purple-600 text-white">Generate Receipt</Button>
              </div>
            </div>
          ) : (
            <div>No details available.</div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal (placeholder) */}
      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Receipt</DialogTitle>
            <DialogDescription>
              Fill out the form to create a receipt for this invoice.
            </DialogDescription>
          </DialogHeader>
          {/* You can add a form here to create a receipt and save to Firestore */}
          <div className="flex flex-col gap-4">
            <div>Receipt generation form goes here.</div>
            <Button type="button" onClick={handleCloseReceiptModal} variant="outline">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerInvoices; 