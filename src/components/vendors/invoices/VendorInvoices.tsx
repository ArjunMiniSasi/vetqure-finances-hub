import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { VendorInvoice, Vendor } from '@/types/vendor';
import VendorInvoiceForm from './VendorInvoiceForm';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FileViewerDialog from '@/components/ui/FileViewerDialog';

const VendorInvoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<{ file: string | null; type: 'pdf' | 'image'; title: string } | null>(null);

  useEffect(() => {
    const invoicesRef = collection(db, 'vendor_invoices');
    const q = query(invoicesRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoiceList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as VendorInvoice[];
      setInvoices(invoiceList);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetch vendors for dropdown
    const vendorsRef = collection(db, 'vendors');
    const unsubscribe = onSnapshot(vendorsRef, (snapshot) => {
      setVendors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Vendor));
    });
    return () => unsubscribe();
  }, []);

  const getStatusColor = (status: string) => {
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

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateInvoice = async (data) => {
    try {
      // 1. Upload files to Firebase Storage
      let invoiceUrl = '';
      let receiptUrl = '';
      if (data.invoiceFile) {
        const invoiceRef = ref(storage, `vendor_invoices/${Date.now()}_${data.invoiceFile.name}`);
        await uploadBytes(invoiceRef, data.invoiceFile);
        invoiceUrl = await getDownloadURL(invoiceRef);
      }
      if (data.receiptFile) {
        const receiptRef = ref(storage, `vendor_invoices/${Date.now()}_${data.receiptFile.name}`);
        await uploadBytes(receiptRef, data.receiptFile);
        receiptUrl = await getDownloadURL(receiptRef);
      }
      // 2. Save invoice metadata to Firestore
      await addDoc(collection(db, 'vendor_invoices'), {
        vendorId: data.vendorId,
        invoiceDate: Timestamp.fromDate(data.invoiceDate),
        serviceEndDate: data.serviceEndDate ? Timestamp.fromDate(data.serviceEndDate) : null,
        currency: data.currency,
        amount: data.amount,
        invoiceUrl,
        receiptUrl,
        uploadStatus: invoiceUrl ? 'uploaded' : 'pending',
        createdAt: Timestamp.now(),
      });
      setIsAddModalOpen(false);
      toast({ title: 'Success', description: 'Invoice created successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    }
  };

  // Helper to get vendor name
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor ? vendor.name : vendorId || '-';
  };

  // Helper to format Firestore Timestamp or JS Date
  const formatDate = (date: any) => {
    if (!date) return '-';
    if (typeof date === 'object' && date.seconds) {
      // Firestore Timestamp
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    // Try parsing ISO string
    const d = new Date(date);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  };

  function currencySymbol(code: string) {
    switch (code) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code || '$';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Vendor Invoices</h1>
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
          {isLoading ? (
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
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Due Date
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
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No invoices found
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{getVendorName(invoice.vendorId)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(invoice.invoiceDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(invoice.serviceEndDate)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.amount ? `${currencySymbol(invoice.currency)}${invoice.amount.toFixed(2)}` : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center gap-2 justify-end">
                          <CheckCircle className="text-green-500 w-5 h-5" />
                          <Button
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setIsDetailsOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg p-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              Invoice Details
              <CheckCircle className="text-green-500 w-5 h-5" />
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="px-6 pb-6">
              <div className="rounded-lg border bg-white shadow-sm divide-y divide-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Vendor</div>
                    <div className="font-semibold text-gray-900 text-base">{getVendorName(selectedInvoice.vendorId)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Invoice Date</div>
                    <div className="font-medium text-gray-900 text-base">{formatDate(selectedInvoice.invoiceDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Due Date</div>
                    <div className="font-medium text-gray-900 text-base">{formatDate(selectedInvoice.serviceEndDate)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Amount</div>
                    <div className="font-medium text-gray-900 text-base">${selectedInvoice.amount?.toFixed(2)}</div>
                  </div>
                </div>
                <div className="p-6 flex flex-col md:flex-row gap-3 md:gap-4 items-start md:items-center bg-gray-50 rounded-b-lg">
                  {selectedInvoice.invoiceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setFilePreview({ file: selectedInvoice.invoiceUrl, type: 'pdf', title: 'Invoice File' })}
                    >
                      <Download className="w-4 h-4" />
                      View Invoice File
                    </Button>
                  )}
                  {selectedInvoice.receiptUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setFilePreview({ file: selectedInvoice.receiptUrl, type: 'pdf', title: 'Receipt File' })}
                    >
                      <Download className="w-4 h-4" />
                      View Receipt File
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* File Viewer Dialog */}
      <FileViewerDialog
        open={!!filePreview}
        onOpenChange={() => setFilePreview(null)}
        file={filePreview?.file || null}
        type={filePreview?.type || 'pdf'}
        title={filePreview?.title}
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Vendor Invoice</DialogTitle>
          </DialogHeader>
          <VendorInvoiceForm
            vendors={vendors}
            onSubmit={handleCreateInvoice}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorInvoices; 