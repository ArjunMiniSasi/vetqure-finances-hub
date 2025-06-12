import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { InvoiceItem, Customer, addInvoice } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';

interface AddInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onInvoiceCreated: () => void;
}

const currencyOptions = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({
  open,
  onOpenChange,
  customers,
  onInvoiceCreated,
}) => {
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

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const filteredCustomers = customers.filter(c =>
    c.entity_name.toLowerCase().includes(customerSearch.toLowerCase())
  );

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
      onOpenChange(false);
      
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
      
      // Notify parent to reload data
      onInvoiceCreated();
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

  const handleCustomerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value);
    setCustomerDropdownOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setNewInvoice(prev => ({
        ...prev,
        customer_id: customer.id!,
        customer_name: customer.entity_name
      }));
      setCustomerSearch(customer.entity_name);
      setCustomerDropdownOpen(false);
    }
  };

  const handleCustomerInputFocus = () => {
    setCustomerDropdownOpen(true);
  };

  const handleCustomerInputBlur = () => {
    setTimeout(() => setCustomerDropdownOpen(false), 100); // allow click
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

  // Helper to get currency symbol
  const getCurrencySymbol = (code: string) => {
    const found = currencyOptions.find(opt => opt.code === code);
    return found ? found.symbol : '₹';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <div className="relative">
                <Input
                  id="customer"
                  ref={customerInputRef}
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={customerSearch}
                  onChange={handleCustomerInput}
                  onFocus={handleCustomerInputFocus}
                  onBlur={handleCustomerInputBlur}
                  placeholder="Search customer..."
                  autoComplete="off"
                  required
                />
                {customerDropdownOpen && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${newInvoice.customer_id === customer.id ? 'bg-blue-50' : ''}`}
                        onMouseDown={() => handleCustomerSelect(customer.id)}
                      >
                        {customer.entity_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
  );
};

export default AddInvoiceModal; 