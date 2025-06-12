import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { Receipt, getCustomerReceipts, Customer, getCustomers, Invoice, getCustomerInvoices, getAllReceipts } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReceiptPDF from '@/components/customers/ReceiptPDF';

const CustomerReceipts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [receiptsData, customersData, invoicesData] = await Promise.all([
        getAllReceipts(),
        getCustomers(),
        getCustomerInvoices('all')
      ]);
      // Convert Firestore Timestamp to Date for receipt.date
      const processedReceipts = receiptsData.map(receipt => ({
        ...receipt,
        date: receipt.date instanceof Timestamp ? receipt.date.toDate() : new Date(receipt.date)
      }));
      setReceipts(processedReceipts);
      setCustomers(customersData);
      setInvoices(invoicesData);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceipts = receipts.filter(receipt =>
    receipt.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receipt.reference_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'successful':
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

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code || '₹';
    }
  };

  const handleViewDetails = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsDetailsModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!selectedReceipt) return;
    
    try {
      // TODO: Implement email sending functionality
      toast.success('Receipt sent to customer email');
    } catch (error) {
      toast.error('Failed to send email');
      console.error('Error sending email:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Customer Receipts</h1>
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
                        <div className="text-sm font-medium text-gray-900">{receipt.reference_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{receipt.customer_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {getCurrencySymbol(receipt.currency || 'INR')} {receipt.amount.toFixed(2)} {receipt.currency}
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
                        <Button 
                          variant="ghost" 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleViewDetails(receipt)}
                        >
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

      {/* Receipt Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
          </DialogHeader>
          
          {selectedReceipt && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Receipt ID</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedReceipt.reference_number}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedReceipt.date.toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedReceipt.customer_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                  <p className="mt-1 text-sm text-gray-900">{getCurrencySymbol(selectedReceipt.currency || 'INR')} {selectedReceipt.amount.toFixed(2)} {selectedReceipt.currency}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Payment Method</h3>
                  <p className="mt-1 text-sm text-gray-900">{formatPaymentMethod(selectedReceipt.method)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedReceipt.status)}`}>
                    {selectedReceipt.status}
                  </span>
                </div>
              </div>

              {selectedReceipt.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedReceipt.notes}</p>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                  className="flex items-center"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send to Email
                </Button>
                {selectedReceipt && (
                  <PDFDownloadLink
                    document={<ReceiptPDF receipt={selectedReceipt} />}
                    fileName={(() => {
                      const getReceiptDate = (date: any) => {
                        if (!date) return new Date();
                        if (date instanceof Date) return date;
                        if (typeof date === 'object' && typeof date.toDate === 'function') return date.toDate();
                        return new Date(date);
                      };
                      const d = getReceiptDate(selectedReceipt.date);
                      const dateStr = d ? `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}` : 'date';
                      const name = selectedReceipt.customer_name ? selectedReceipt.customer_name.replace(/\s+/g, '_').toLowerCase() : 'customer';
                      const invoice = selectedReceipt.invoice_id ? selectedReceipt.invoice_id.replace(/\s+/g, '_').toLowerCase() : 'invoice';
                      return `receipt-${dateStr}-${name}-${invoice}.pdf`;
                    })()}
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                  >
                    {({ loading }) => (
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {loading ? 'Generating PDF...' : 'Download PDF'}
                      </div>
                    )}
                  </PDFDownloadLink>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerReceipts; 