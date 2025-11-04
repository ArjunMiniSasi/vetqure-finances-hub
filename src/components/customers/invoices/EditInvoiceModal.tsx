import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { InvoiceItem, Customer, updateInvoice, calculateGST } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';

interface EditInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  invoice: any; // Invoice to edit
  onInvoiceUpdated: () => void;
}

const currencyOptions = [
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
];

const EditInvoiceModal: React.FC<EditInvoiceModalProps> = ({
  open,
  onOpenChange,
  customers,
  invoice,
  onInvoiceUpdated,
}) => {
  const [editedInvoice, setEditedInvoice] = useState({
    customer_id: '',
    customer_name: '',
    date_created: Timestamp.now(),
    due_date: Timestamp.now(),
    status: 'pending' as const,
    total: 0,
    items: [] as InvoiceItem[],
    notes: '',
    currency: 'INR',
    // Invoice Prefix
    invoice_prefix: 'VQ' as 'VAMS' | 'VQ',
    // GST Fields
    company_gst_number: '32AAGCV9195E1Z2',
    customer_gst_number: '',
    customer_state: 'Kerala',
    gst_type: 'intra_state' as 'intra_state' | 'inter_state',
    taxable_amount: 0,
    cgst_percentage: 9,
    sgst_percentage: 9,
    igst_percentage: 0,
    cgst_amount: 0,
    sgst_amount: 0,
    igst_amount: 0,
    total_gst_amount: 0,
    grand_total: 0,
  });

  const [newItem, setNewItem] = useState({
    description: '',
    quantity: 1,
    unit_price: 0,
    amount: 0,
    hsn_sac_code: '9987',
    tax_rate: 18,
    taxable_amount: 0,
    tax_amount: 0
  });

  const [descriptionType, setDescriptionType] = useState<'predefined' | 'other'>('predefined');
  const [customDescription, setCustomDescription] = useState('');

  const predefinedDescriptions = [
    'Monthly subscription for VetQure',
    'Annual Subscription for VetQure'
  ];

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const filteredCustomers = customers.filter(c =>
    c.entity_name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  // Pre-fill form when invoice changes
  useEffect(() => {
    if (invoice && open) {
      // Calculate GST fields for existing invoices that don't have them
      const items = invoice.items || [];
      
      // Recalculate GST for all items to ensure proper tax calculation
      const recalculatedItems = items.map(item => {
        const taxableAmount = (item.unit_price || 0) * (item.quantity || 0);
        const taxAmount = (taxableAmount * 18) / 100; // 18% GST
        const totalAmount = taxableAmount + taxAmount;
        
        return {
          ...item,
          hsn_sac_code: item.hsn_sac_code || '9987',
          tax_rate: 18,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          amount: totalAmount
        };
      });
      
      const taxableAmount = recalculatedItems.reduce((sum, item) => sum + item.taxable_amount, 0);
      const totalGST = recalculatedItems.reduce((sum, item) => sum + item.tax_amount, 0);
      const grandTotal = taxableAmount + totalGST;

      // Extract prefix from existing invoice number or use invoice_prefix field
      let invoicePrefix: 'VAMS' | 'VQ' = 'VQ';
      if (invoice.invoice_prefix) {
        invoicePrefix = invoice.invoice_prefix as 'VAMS' | 'VQ';
      } else if (invoice.invoice_number || invoice.invoice_id) {
        const invoiceNum = invoice.invoice_number || invoice.invoice_id || '';
        if (invoiceNum.startsWith('VAMS/')) {
          invoicePrefix = 'VAMS';
        } else if (invoiceNum.startsWith('VQ/')) {
          invoicePrefix = 'VQ';
        }
      }

      setEditedInvoice({
        customer_id: invoice.customer_id || '',
        customer_name: invoice.customer_name || '',
        date_created: invoice.date_created || Timestamp.now(),
        due_date: invoice.due_date || Timestamp.now(),
        status: invoice.status || 'pending',
        total: invoice.total || 0,
        items: recalculatedItems,
        notes: invoice.notes || '',
        currency: invoice.currency || 'INR',
        invoice_prefix: invoicePrefix,
        company_gst_number: invoice.company_gst_number || '32AAGCV9195E1Z2',
        customer_gst_number: invoice.customer_gst_number || '',
        customer_state: invoice.customer_state || 'Kerala',
        gst_type: invoice.gst_type || 'intra_state',
        taxable_amount: taxableAmount,
        cgst_percentage: invoice.cgst_percentage || 9,
        sgst_percentage: invoice.sgst_percentage || 9,
        igst_percentage: invoice.igst_percentage || 0,
        cgst_amount: invoice.cgst_amount || 0,
        sgst_amount: invoice.sgst_amount || 0,
        igst_amount: invoice.igst_amount || 0,
        total_gst_amount: totalGST,
        grand_total: grandTotal,
      });
      setCustomerSearch(invoice.customer_name || '');
    }
  }, [invoice, open]);

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate customer selection
      if (!editedInvoice.customer_id) {
        toast.error('Please select a customer');
        return;
      }

      // Validate items
      if (editedInvoice.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      // Update the invoice in Firestore using invoice number as document ID
      const documentId = invoice.invoice_number || invoice.invoice_id || invoice.document_id || invoice.id; // Use invoice number as document ID
      await updateInvoice(documentId, {
        ...editedInvoice,
        date_created: editedInvoice.date_created,
        due_date: editedInvoice.due_date,
        status: editedInvoice.status,
        total: editedInvoice.grand_total,
        items: editedInvoice.items,
        notes: editedInvoice.notes,
        currency: editedInvoice.currency,
        invoice_prefix: editedInvoice.invoice_prefix,
        company_gst_number: editedInvoice.company_gst_number,
        customer_gst_number: editedInvoice.customer_gst_number,
        customer_state: editedInvoice.customer_state,
        gst_type: editedInvoice.gst_type,
        taxable_amount: editedInvoice.taxable_amount,
        cgst_amount: editedInvoice.cgst_amount,
        sgst_amount: editedInvoice.sgst_amount,
        igst_amount: editedInvoice.igst_amount,
        total_gst_amount: editedInvoice.total_gst_amount,
        grand_total: editedInvoice.grand_total,
      });

      toast.success('Invoice updated successfully');
      onOpenChange(false);
      
      // Notify parent to reload data
      onInvoiceUpdated();
    } catch (error) {
      toast.error('Failed to update invoice');
      console.error('Error updating invoice:', error);
    }
  };

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0 || !newItem.hsn_sac_code) {
      toast.error('Please fill in all item details correctly including HSN/SAC code');
      return;
    }

    const taxableAmount = newItem.quantity * newItem.unit_price;
    const taxAmount = (taxableAmount * newItem.tax_rate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    const itemWithTax = {
      ...newItem,
      taxable_amount: taxableAmount,
      tax_amount: taxAmount,
      amount: totalAmount
    };

    setEditedInvoice(prev => {
      const newItems = [...prev.items, itemWithTax];
      const newTaxableAmount = newItems.reduce((sum, item) => sum + item.taxable_amount, 0);
      const newTotalGST = newItems.reduce((sum, item) => sum + item.tax_amount, 0);
      const newGrandTotal = newTaxableAmount + newTotalGST;

      return {
        ...prev,
        items: newItems,
        taxable_amount: newTaxableAmount,
        total_gst_amount: newTotalGST,
        grand_total: newGrandTotal,
        total: newGrandTotal
      };
    });

    setNewItem({
      description: '',
      quantity: 1,
      unit_price: 0,
      amount: 0,
      hsn_sac_code: '9987',
      tax_rate: 18,
      taxable_amount: 0,
      tax_amount: 0
    });
    setDescriptionType('predefined');
    setCustomDescription('');
  };

  const handleCustomerInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerSearch(e.target.value);
    setCustomerDropdownOpen(true);
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setEditedInvoice(prev => ({
        ...prev,
        customer_id: customer.id!,
        customer_name: customer.entity_name,
        customer_gst_number: customer.gst_number || '',
        customer_state: customer.state || ''
      }));
      setCustomerSearch(customer.entity_name);
      setCustomerDropdownOpen(false);
      
      // Recalculate GST based on customer state
      recalculateGST(customer.state || '');
    }
  };

  const recalculateGST = (customerState: string) => {
    setEditedInvoice(prev => {
      const isIntraState = customerState === 'Kerala'; // Company is in Kerala
      const taxRate = 18;
      
      const recalculatedItems = prev.items.map(item => {
        const taxableAmount = (item.unit_price || 0) * (item.quantity || 0);
        const taxAmount = (taxableAmount * taxRate) / 100;
        const totalAmount = taxableAmount + taxAmount;
        
        return {
          ...item,
          taxable_amount: taxableAmount,
          tax_amount: taxAmount,
          amount: totalAmount
        };
      });
      
      const newTaxableAmount = recalculatedItems.reduce((sum, item) => sum + item.taxable_amount, 0);
      const newTotalGST = recalculatedItems.reduce((sum, item) => sum + item.tax_amount, 0);
      
      // Set default GST percentages and amounts based on state
      let cgstPercentage = 0, sgstPercentage = 0, igstPercentage = 0;
      let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
      if (isIntraState) {
        cgstPercentage = 9;
        sgstPercentage = 9;
        cgstAmount = newTotalGST / 2; // 9% of taxable amount
        sgstAmount = newTotalGST / 2; // 9% of taxable amount
      } else {
        igstPercentage = 18;
        igstAmount = newTotalGST; // 18% of taxable amount
      }
      
      const newGrandTotal = newTaxableAmount + newTotalGST;
      
      return {
        ...prev,
        items: recalculatedItems,
        gst_type: isIntraState ? 'intra_state' : 'inter_state',
        taxable_amount: newTaxableAmount,
        cgst_percentage: cgstPercentage,
        sgst_percentage: sgstPercentage,
        igst_percentage: igstPercentage,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        total_gst_amount: newTotalGST,
        grand_total: newGrandTotal,
        total: newGrandTotal
      };
    });
  };

  // Helper to update GST percent fields with realtime totals
  const updateGSTPercentages = (next: {
    cgst_percentage?: number;
    sgst_percentage?: number;
    igst_percentage?: number;
  }) => {
    setEditedInvoice(prev => {
      const cgstPct = next.cgst_percentage !== undefined ? next.cgst_percentage : (prev.cgst_percentage || 0);
      const sgstPct = next.sgst_percentage !== undefined ? next.sgst_percentage : (prev.sgst_percentage || 0);
      const igstPct = next.igst_percentage !== undefined ? next.igst_percentage : (prev.igst_percentage || 0);

      const taxable = prev.taxable_amount || 0;
      const cgstAmt = (taxable * (cgstPct || 0)) / 100;
      const sgstAmt = (taxable * (sgstPct || 0)) / 100;
      const igstAmt = (taxable * (igstPct || 0)) / 100;
      const totalGST = cgstAmt + sgstAmt + igstAmt;
      const grand = taxable + totalGST;

      // Derive gst_type from state by default, but if igst is set > 0, prefer inter_state
      const inferredType = igstPct > 0 ? 'inter_state' : (prev.customer_state === 'Kerala' ? 'intra_state' : 'inter_state');

      return {
        ...prev,
        cgst_percentage: cgstPct,
        sgst_percentage: sgstPct,
        igst_percentage: igstPct,
        cgst_amount: cgstAmt,
        sgst_amount: sgstAmt,
        igst_amount: igstAmt,
        total_gst_amount: totalGST,
        grand_total: grand,
        total: grand,
        gst_type: inferredType as 'intra_state' | 'inter_state',
      };
    });
  };

  const handleCustomerInputFocus = () => {
    setCustomerDropdownOpen(true);
  };

  const handleCustomerInputBlur = () => {
    setTimeout(() => setCustomerDropdownOpen(false), 100);
  };

  const handleRemoveItem = (index: number) => {
    setEditedInvoice(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      const newTaxableAmount = newItems.reduce((sum, item) => sum + item.taxable_amount, 0);
      const newTotalGST = newItems.reduce((sum, item) => sum + item.tax_amount, 0);
      const newGrandTotal = newTaxableAmount + newTotalGST;

      return {
        ...prev,
        items: newItems,
        taxable_amount: newTaxableAmount,
        total_gst_amount: newTotalGST,
        grand_total: newGrandTotal,
        total: newGrandTotal
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
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>
            Update the invoice details below. Note: Invoice number will be regenerated to maintain GST compliance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleUpdateInvoice} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
              <select
                id="invoice_prefix"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                value={editedInvoice.invoice_prefix}
                onChange={e => setEditedInvoice({ ...editedInvoice, invoice_prefix: e.target.value as 'VAMS' | 'VQ' })}
                required
              >
                <option value="VQ">VQ (Default)</option>
                <option value="VAMS">VAMS</option>
              </select>
            </div>
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
                        className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${editedInvoice.customer_id === customer.id ? 'bg-blue-50' : ''}`}
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
                value={editedInvoice.due_date.toDate().toISOString().split('T')[0]}
                onChange={(e) => setEditedInvoice({
                  ...editedInvoice,
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
                value={editedInvoice.currency}
                onChange={e => setEditedInvoice({ ...editedInvoice, currency: e.target.value })}
                required
              >
                {currencyOptions.map(opt => (
                  <option key={opt.code} value={opt.code}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* GST Information */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">GST Information</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => recalculateGST(editedInvoice.customer_state)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Recalculate GST
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_gst">Company GST Number</Label>
                <Input
                  id="company_gst"
                  value={editedInvoice.company_gst_number}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_gst">Customer GST Number</Label>
                <Input
                  id="customer_gst"
                  value={editedInvoice.customer_gst_number}
                  onChange={e => setEditedInvoice({ ...editedInvoice, customer_gst_number: e.target.value })}
                  placeholder="Enter customer GST number"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_state">Customer State</Label>
                <select
                  id="customer_state"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={editedInvoice.customer_state}
                  onChange={e => {
                    setEditedInvoice({ ...editedInvoice, customer_state: e.target.value });
                    recalculateGST(e.target.value);
                  }}
                >
                  <option value="">Select State</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Assam">Assam</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Goa">Goa</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Total GST Amount</Label>
                <div className="p-2 bg-white rounded border text-lg font-semibold text-blue-600">
                  {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.total_gst_amount || 0).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* CGST Control */}
              <div className="space-y-2">
                <Label htmlFor="cgst_percentage">CGST (%)</Label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => updateGSTPercentages({ cgst_percentage: Math.max(0, (editedInvoice.cgst_percentage || 0) - 0.5) })}
                    aria-label="Decrease CGST"
                  >
                    −
                  </button>
                  <Input
                    id="cgst_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editedInvoice.cgst_percentage || 0}
                    onChange={e => updateGSTPercentages({ cgst_percentage: parseFloat(e.target.value) || 0 })}
                    className="text-green-600 font-medium"
                  />
                  <button
                    type="button"
                    className="px-2 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => updateGSTPercentages({ cgst_percentage: (editedInvoice.cgst_percentage || 0) + 0.5 })}
                    aria-label="Increase CGST"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Amount: {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.cgst_amount || 0).toFixed(2)}
                </div>
              </div>

              {/* SGST Control */}
              <div className="space-y-2">
                <Label htmlFor="sgst_percentage">SGST (%)</Label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => updateGSTPercentages({ sgst_percentage: Math.max(0, (editedInvoice.sgst_percentage || 0) - 0.5) })}
                    aria-label="Decrease SGST"
                  >
                    −
                  </button>
                  <Input
                    id="sgst_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editedInvoice.sgst_percentage || 0}
                    onChange={e => updateGSTPercentages({ sgst_percentage: parseFloat(e.target.value) || 0 })}
                    className="text-green-600 font-medium"
                  />
                  <button
                    type="button"
                    className="px-2 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => updateGSTPercentages({ sgst_percentage: (editedInvoice.sgst_percentage || 0) + 0.5 })}
                    aria-label="Increase SGST"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Amount: {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.sgst_amount || 0).toFixed(2)}
                </div>
              </div>

              {/* IGST Control */}
              <div className="space-y-2">
                <Label htmlFor="igst_percentage">IGST (%)</Label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="px-2 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => updateGSTPercentages({ igst_percentage: Math.max(0, (editedInvoice.igst_percentage || 0) - 0.5) })}
                    aria-label="Decrease IGST"
                  >
                    −
                  </button>
                  <Input
                    id="igst_percentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={editedInvoice.igst_percentage || 0}
                    onChange={e => updateGSTPercentages({ igst_percentage: parseFloat(e.target.value) || 0 })}
                    className="text-blue-600 font-medium"
                  />
                  <button
                    type="button"
                    className="px-2 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => updateGSTPercentages({ igst_percentage: (editedInvoice.igst_percentage || 0) + 0.5 })}
                    aria-label="Increase IGST"
                  >
                    +
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  Amount: {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.igst_amount || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Invoice Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="description">Description</Label>
                {descriptionType === 'predefined' ? (
                  <select
                    id="description"
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={newItem.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === 'other') {
                        setDescriptionType('other');
                        setNewItem({ ...newItem, description: '' });
                      } else {
                        setNewItem({ ...newItem, description: value });
                      }
                    }}
                  >
                    <option value="">Select description</option>
                    {predefinedDescriptions.map((desc, index) => (
                      <option key={index} value={desc}>{desc}</option>
                    ))}
                    <option value="other">Other (Custom)</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <Input
                      id="description"
                      value={customDescription}
                      onChange={(e) => {
                        setCustomDescription(e.target.value);
                        setNewItem({ ...newItem, description: e.target.value });
                      }}
                      placeholder="Enter custom description"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDescriptionType('predefined');
                        setCustomDescription('');
                        setNewItem({ ...newItem, description: '' });
                      }}
                      className="text-xs"
                    >
                      ← Back to predefined
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="hsn_sac">HSN/SAC Code</Label>
                <Input
                  id="hsn_sac"
                  value={newItem.hsn_sac_code}
                  onChange={(e) => setNewItem({ ...newItem, hsn_sac_code: e.target.value })}
                  placeholder="9987"
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
                  disabled={!newItem.description || newItem.quantity <= 0 || newItem.unit_price <= 0 || !newItem.hsn_sac_code}
                >
                  Add Item
                </Button>
              </div>
            </div>

            {editedInvoice.items.length > 0 && (
              <div className="mt-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Description</th>
                      <th className="text-center py-2">HSN/SAC</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Taxable</th>
                      <th className="text-right py-2">GST (18%)</th>
                      <th className="text-right py-2">Total</th>
                      <th className="text-right py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editedInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{item.description}</td>
                        <td className="text-center py-2">{item.hsn_sac_code || '9987'}</td>
                        <td className="text-right py-2">{item.quantity}</td>
                        <td className="text-right py-2">{getCurrencySymbol(editedInvoice.currency)}{(item.unit_price || 0).toFixed(2)}</td>
                        <td className="text-right py-2">{getCurrencySymbol(editedInvoice.currency)}{(item.taxable_amount || item.unit_price * item.quantity || 0).toFixed(2)}</td>
                        <td className="text-right py-2">{getCurrencySymbol(editedInvoice.currency)}{(item.tax_amount || 0).toFixed(2)}</td>
                        <td className="text-right py-2">{getCurrencySymbol(editedInvoice.currency)}{(item.amount || 0).toFixed(2)}</td>
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
                    <tr className="border-t-2">
                      <td colSpan={4} className="text-right py-2 font-medium">Subtotal:</td>
                      <td className="text-right py-2 font-medium">
                        {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.taxable_amount || 0).toFixed(2)}
                      </td>
                      <td className="text-right py-2 font-medium">
                        {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.total_gst_amount || 0).toFixed(2)}
                      </td>
                      <td className="text-right py-2 font-medium">
                        {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.grand_total || editedInvoice.total || 0).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                    {editedInvoice.gst_type === 'intra_state' ? (
                      <>
                        <tr>
                          <td colSpan={5} className="text-right py-1 text-sm text-gray-600">CGST (9%):</td>
                          <td className="text-right py-1 text-sm text-gray-600">
                            {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.cgst_amount || 0).toFixed(2)}
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={5} className="text-right py-1 text-sm text-gray-600">SGST (9%):</td>
                          <td className="text-right py-1 text-sm text-gray-600">
                            {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.sgst_amount || 0).toFixed(2)}
                          </td>
                          <td></td>
                          <td></td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-right py-1 text-sm text-gray-600">IGST (18%):</td>
                        <td className="text-right py-1 text-sm text-gray-600">
                          {getCurrencySymbol(editedInvoice.currency)}{(editedInvoice.igst_amount || 0).toFixed(2)}
                        </td>
                        <td></td>
                        <td></td>
                      </tr>
                    )}
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
              value={editedInvoice.notes}
              onChange={(e) => setEditedInvoice({ ...editedInvoice, notes: e.target.value })}
              placeholder="Add any additional notes here..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!editedInvoice.customer_id || editedInvoice.items.length === 0}
            >
              Update Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInvoiceModal;
