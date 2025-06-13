import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { VendorType, VendorStatus, VendorFormData } from '@/types/vendor';

const VENDOR_TYPES = [
  'Goods',
  'Services',
  'Equipment',
  'Electronics',
  'Maintenance',
  'Software',
  'Consumables',
  'Infrastructure',
] as const;

const vendorFormSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  type: z.enum(VENDOR_TYPES),
  status: z.enum(['active', 'inactive']),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').optional().or(z.literal('')),
  gstNumber: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number format').optional().or(z.literal('')),
  notes: z.string().optional(),
});

interface VendorFormProps {
  initialData?: Partial<VendorFormData>;
  onSubmit: (data: VendorFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const VendorForm: React.FC<VendorFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || 'Goods',
      status: initialData?.status || 'active',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      gstNumber: initialData?.gstNumber || '',
      notes: initialData?.notes || '',
    },
  });

  const handleSubmit = async (data: VendorFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vendor Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter vendor name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Vendor Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vendor Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VENDOR_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 h-full">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Status</FormLabel>
                  <div className="text-sm text-gray-500">
                    {field.value === 'active' ? 'Vendor is active' : 'Vendor is inactive'}
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value === 'active'}
                    onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* GST Number */}
          <FormField
            control={form.control}
            name="gstNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>GST Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter GST number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes (span both columns) */}
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting || isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || isSubmitting}>
            {(submitting || isSubmitting) ? 'Saving...' : 'Save Vendor'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VendorForm; 