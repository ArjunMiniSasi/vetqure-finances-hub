import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Vendor } from '@/types/vendor';
import { BadgeCheck, Mail, Phone, StickyNote } from 'lucide-react';

interface VendorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor | null;
}

const VendorDetailsDialog: React.FC<VendorDetailsDialogProps> = ({ open, onOpenChange, vendor }) => {
  if (!vendor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            Vendor Details
            {vendor.status === 'active' && (
              <span className="ml-2"><BadgeCheck className="text-green-500 w-5 h-5" /></span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="rounded-lg border bg-white shadow-sm divide-y divide-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">Name</div>
                <div className="font-semibold text-gray-900 text-base">{vendor.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Type</div>
                <div className="font-medium text-gray-900 text-base">{vendor.type}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${
                  vendor.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <BadgeCheck className="w-4 h-4" />
                  {vendor.status}
                </span>
              </div>
              {vendor.gstNumber && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">GST Number</div>
                  <div className="font-medium text-gray-900 text-base">{vendor.gstNumber}</div>
                </div>
              )}
              {vendor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Email</div>
                    <div className="font-medium text-gray-900 text-base">{vendor.email}</div>
                  </div>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Phone</div>
                    <div className="font-medium text-gray-900 text-base">{vendor.phone}</div>
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 mb-1">Created At</div>
                <div className="text-gray-700 text-sm">{vendor.createdAt ? new Date(vendor.createdAt).toLocaleString() : '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Updated At</div>
                <div className="text-gray-700 text-sm">{vendor.updatedAt ? new Date(vendor.updatedAt).toLocaleString() : '-'}</div>
              </div>
            </div>
            {vendor.notes && (
              <div className="p-6 flex items-start gap-2 bg-gray-50 rounded-b-lg">
                <StickyNote className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Notes</div>
                  <div className="font-medium text-gray-900 text-base whitespace-pre-line">{vendor.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendorDetailsDialog; 