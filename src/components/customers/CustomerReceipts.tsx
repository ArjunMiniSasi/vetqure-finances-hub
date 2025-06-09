import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Receipt, addReceipt, getCustomerReceipts, Customer, getCustomers, Invoice, getCustomerInvoices } from '@/services/firestoreService';

const CustomerReceipts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReceipt, setNewReceipt] = useState({
    invoice_id: '',
    customer_id: '',
    customer_name: '',
    amount: 0,
    date: new Date(),
    method: 'cash' as const,
    status: 'pending' as const,
    reference_number: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [receiptsData, customersData, invoicesData] = await Promise.all([
        getCustomerReceipts('all'), // You might want to modify this to get all receipts
        getCustomers(),
        getCustomerInvoices('all')
      ]);
      setReceipts(receiptsData);
      setCustomers(customersData);
      setInvoices(invoicesData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addReceipt(newReceipt);
      toast.success('Receipt created successfully');
      setIsAddModalOpen(false);
      setNewReceipt({
        invoice_id: '',
        customer_id: '',
        customer_name: '',
        amount: 0,
        date: new Date(),
        method: 'cash',
        status: 'pending',
        reference_number: '',
        notes: ''
      });
      loadData();
    } catch (error) {
      toast.error('Failed to create receipt');
      console.error('Error creating receipt:', error);
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setNewReceipt(prev => ({
        ...prev,
        customer_id: customer.id!,
        customer_name: customer.name
      }));
    }
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    const invoice = invoices.find(i => i.id === invoiceId);
    if (invoice) {
      setNewReceipt(prev => ({
        ...prev,
        invoice_id: invoice.id!,
        amount: invoice.total
      }));
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPaymentMethod = (method: Receipt['method']) => {
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Receipts</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search receipts..."
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
                      Receipt ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{receipt.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{receipt.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${receipt.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {receipt.date.toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatPaymentMethod(receipt.method)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            receipt.status
                          )}`}
                        >
                          {receipt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-900">
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

      {/* Add Receipt Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReceipt} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <select
                  id="customer"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newReceipt.customer_id}
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
                <Label htmlFor="invoice">Invoice</Label>
                <select
                  id="invoice"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newReceipt.invoice_id}
                  onChange={(e) => handleInvoiceSelect(e.target.value)}
                  required
                >
                  <option value="">Select an invoice</option>
                  {invoices
                    .filter(invoice => invoice.customer_id === newReceipt.customer_id)
                    .map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.id} - ${invoice.total.toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newReceipt.amount}
                  onChange={(e) => setNewReceipt({
                    ...newReceipt,
                    amount: parseFloat(e.target.value)
                  })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newReceipt.date.toISOString().split('T')[0]}
                  onChange={(e) => setNewReceipt({
                    ...newReceipt,
                    date: new Date(e.target.value)
                  })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <select
                  id="method"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newReceipt.method}
                  onChange={(e) => setNewReceipt({
                    ...newReceipt,
                    method: e.target.value as Receipt['method']
                  })}
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference_number">Reference Number</Label>
                <Input
                  id="reference_number"
                  value={newReceipt.reference_number}
                  onChange={(e) => setNewReceipt({
                    ...newReceipt,
                    reference_number: e.target.value
                  })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                value={newReceipt.notes}
                onChange={(e) => setNewReceipt({
                  ...newReceipt,
                  notes: e.target.value
                })}
                placeholder="Optional"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newReceipt.customer_id || !newReceipt.invoice_id || newReceipt.amount <= 0}
              >
                Record Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerReceipts; 