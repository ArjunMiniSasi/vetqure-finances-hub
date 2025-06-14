import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Vendor, Currency } from '@/types/vendor';
import { Timestamp } from 'firebase/firestore';
import DatePicker from '@/components/ui/DatePicker';
import { Label } from '@/components/ui/label';
import FileViewerDialog from '@/components/ui/FileViewerDialog';
import { Eye } from 'lucide-react';

const currencyOptions = ['INR', 'USD', 'EUR', 'GBP'] as const;

const invoiceFormSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  invoiceDate: z.date({ required_error: 'Invoice date is required' }),
  serviceEndDate: z.date().optional(),
  currency: z.enum(currencyOptions),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  invoiceFile: z.any().refine((file) => file instanceof File, 'Invoice file is required'),
  receiptFile: z.any().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

interface VendorInvoiceFormProps {
  vendors: Vendor[];
  onSubmit: (data: InvoiceFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const VendorInvoiceForm: React.FC<VendorInvoiceFormProps> = ({ vendors, onSubmit, onCancel, isSubmitting = false }) => {
  const [submitting, setSubmitting] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorDropdownOpen, setVendorDropdownOpen] = useState(false);
  const vendorInputRef = React.useRef<HTMLInputElement>(null);
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()));

  // Local preview state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<File | null>(null);
  const [viewerType, setViewerType] = useState<'pdf' | 'image'>('pdf');
  const [viewerTitle, setViewerTitle] = useState<string>('');

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      vendorId: '',
      invoiceDate: undefined,
      serviceEndDate: undefined,
      currency: 'INR',
      amount: 0,
      invoiceFile: undefined,
      receiptFile: undefined,
    },
  });

  const handleSubmit = async (data: InvoiceFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get file type
  const getFileType = (file: File | undefined) => {
    if (!file) return 'pdf';
    if (file.type.startsWith('image/')) return 'image';
    return 'pdf';
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Searchable Vendor Dropdown */}
          <FormField
            control={form.control}
            name="vendorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Vendor</FormLabel>
                <div className="relative">
                  <Input
                    ref={vendorInputRef}
                    className="w-full rounded-md border border-gray-300 px-3 py-2"
                    value={vendorSearch}
                    onChange={e => {
                      setVendorSearch(e.target.value);
                      setVendorDropdownOpen(true);
                      field.onChange('');
                    }}
                    onFocus={() => setVendorDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setVendorDropdownOpen(false), 100)}
                    placeholder="Search vendor..."
                    autoComplete="off"
                    required
                  />
                  {vendorDropdownOpen && filteredVendors.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                      {filteredVendors.map((vendor) => (
                        <div
                          key={vendor.id}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${field.value === vendor.id ? 'bg-blue-50' : ''}`}
                          onMouseDown={() => {
                            field.onChange(vendor.id);
                            setVendorSearch(vendor.name);
                            setVendorDropdownOpen(false);
                          }}
                        >
                          {vendor.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Invoice Date */}
          <FormField
            control={form.control}
            name="invoiceDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Date</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Service End Date */}
          <FormField
            control={form.control}
            name="serviceEndDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service End Date (Optional)</FormLabel>
                <FormControl>
                  <DatePicker value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Currency and Amount Combined */}
          <FormField
            control={form.control}
            name="currency"
            render={({ field: currencyField }) => (
              <FormField
                control={form.control}
                name="amount"
                render={({ field: amountField }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={currencyField.onChange} value={currencyField.value}>
                        <FormControl>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {currencyOptions.map((cur) => (
                            <SelectItem key={cur} value={cur}>{cur}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          step={0.01}
                          placeholder="Enter amount"
                          value={amountField.value}
                          onChange={e => amountField.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          className="flex-1"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          {/* Upload Invoice */}
          <FormField
            control={form.control}
            name="invoiceFile"
            render={({ field }) => (
              <FormItem>
                <div className="text-sm font-medium text-gray-700 mb-1">Upload Invoice (PDF/Image)</div>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="application/pdf,image/*" 
                      onChange={e => field.onChange(e.target.files?.[0])}
                      className="cursor-pointer"
                    />
                  </FormControl>
                  {field.value && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setViewerFile(field.value);
                        setViewerType(getFileType(field.value));
                        setViewerTitle('Invoice Preview');
                        setViewerOpen(true);
                      }}
                      aria-label="View Invoice"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Upload Receipt */}
          <FormField
            control={form.control}
            name="receiptFile"
            render={({ field }) => (
              <FormItem>
                <div className="text-sm font-medium text-gray-700 mb-1">Upload Receipt (PDF/Image, Optional)</div>
                <div className="flex items-center gap-2">
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="application/pdf,image/*" 
                      onChange={e => field.onChange(e.target.files?.[0])}
                      className="cursor-pointer"
                    />
                  </FormControl>
                  {field.value && (
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        setViewerFile(field.value);
                        setViewerType(getFileType(field.value));
                        setViewerTitle('Receipt Preview');
                        setViewerOpen(true);
                      }}
                      aria-label="View Receipt"
                    >
                      <Eye className="w-5 h-5" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || isSubmitting}>
            {(submitting || isSubmitting) ? 'Saving...' : 'Save Invoice'}
          </Button>
        </div>
        <FileViewerDialog
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          file={viewerFile}
          type={viewerType}
          title={viewerTitle}
        />
      </form>
    </Form>
  );
};

export default VendorInvoiceForm; 