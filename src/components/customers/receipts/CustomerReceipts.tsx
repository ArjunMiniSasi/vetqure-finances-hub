import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { Receipt, getCustomerReceipts, Customer, getCustomers, Invoice, getCustomerInvoices, getAllReceipts, getCustomerById } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';
import html2pdf from 'html2pdf.js';

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

  const generateReceiptHTML = (receipt: Receipt, customer: Customer) => {
    // Use the current invoice number for display (handles both old and new structure)
    const displayInvoiceNumber = receipt.invoice_id || 'N/A';
    
    return `
      <div style="position: relative; font-family: 'Inter', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 32px 32px 32px; color: #222; background: #fff;">
        <!-- Watermark -->
        <div style="position: absolute; top: 35%; left: 50%; transform: translate(-50%, -50%) rotate(-25deg); font-size: 90px; color: #e0e0e0; opacity: 0.25; font-weight: 900; pointer-events: none; user-select: none; z-index: 0; letter-spacing: 8px;">PAID</div>
        <div style="position: relative; z-index: 1;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
            <div style="font-size: 24px; font-weight: 700; letter-spacing: -1px;">Receipt</div>
            <img src="/assets/vetqure.png" style="height: 38px; margin-left: 16px;" />
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 32px; gap: 32px;">
            <div style="flex: 1; min-width: 180px; font-size: 14px;">
              <div style="margin-bottom: 8px;"><span style="font-weight: 600;">Invoice number</span><br>${displayInvoiceNumber}</div>
              <div style="margin-bottom: 8px;"><span style="font-weight: 600;">Transaction Ref No</span><br>${receipt.reference_number}</div>
              <div style="margin-bottom: 8px;"><span style="font-weight: 600;">Date paid</span><br>${receipt.date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              <div style="margin-bottom: 8px;"><span style="font-weight: 600;">Payment method</span><br>${receipt.method ? receipt.method.charAt(0).toUpperCase() + receipt.method.slice(1) : ''}</div>
              <div style="margin-bottom: 8px; font-weight: 600;">VAMS Veterinary Consultancy Pvt Ltd<br>KRA-113, Kedaram Nagar, Pattom<br>Trivandrum</div>
            </div>
            <div style="flex: 1; min-width: 180px; font-size: 14px;">
              <div style="font-weight: 600; margin-bottom: 8px;">Bill to</div>
              <div style="margin-bottom: 4px;">${customer.entity_name || customer.name || receipt.customer_name}</div>
              <div style="margin-bottom: 4px;">${customer.email}</div>
            </div>
          </div>
          <div style="font-size: 18px; font-weight: 700; margin: 32px 0 24px 0; color: #111;">
            ${getCurrencySymbol(receipt.currency || 'INR')}${receipt.amount.toFixed(2)} paid on ${receipt.date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="border-bottom: 1.5px solid #e5e7eb;">
                <th style="text-align: left; font-size: 13px; color: #444; font-weight: 500; padding: 8px 0;">Description</th>
                <th style="text-align: right; font-size: 13px; color: #444; font-weight: 500; padding: 8px 0;">Qty</th>
                <th style="text-align: right; font-size: 13px; color: #444; font-weight: 500; padding: 8px 0;">Unit price</th>
                <th style="text-align: right; font-size: 13px; color: #444; font-weight: 500; padding: 8px 0;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 8px 0; font-size: 14px; color: #222;">${receipt.notes || 'Payment'}</td>
                <td style="text-align: right; padding: 8px 0; font-size: 14px; color: #222;">1</td>
                <td style="text-align: right; padding: 8px 0; font-size: 14px; color: #222;">${getCurrencySymbol(receipt.currency || 'INR')}${receipt.amount.toFixed(2)}</td>
                <td style="text-align: right; padding: 8px 0; font-size: 14px; color: #222;">${getCurrencySymbol(receipt.currency || 'INR')}${receipt.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tbody>
              <tr>
                <td style="text-align: right; color: #444; font-size: 14px; padding: 4px 0;">Subtotal</td>
                <td style="text-align: right; font-size: 14px; padding: 4px 0; min-width: 100px;">${getCurrencySymbol(receipt.currency || 'INR')}${receipt.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: right; color: #444; font-size: 14px; padding: 4px 0;">Total</td>
                <td style="text-align: right; font-size: 14px; padding: 4px 0; min-width: 100px;">${getCurrencySymbol(receipt.currency || 'INR')}${receipt.amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="text-align: right; color: #111; font-size: 15px; font-weight: 700; padding: 4px 0;">Amount paid</td>
                <td style="text-align: right; font-size: 15px; font-weight: 700; padding: 4px 0; min-width: 100px;">${getCurrencySymbol(receipt.currency || 'INR')}${receipt.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <!-- Signature and Seal (bottom right, linear, with labels) -->
          <div style="display: flex; align-items: flex-end; justify-content: flex-end; margin-top: 24px; gap: 32px; page-break-inside: avoid;">
            <div style="display: flex; flex-direction: column; align-items: center;">
              <img src="/assets/seal.png" style="width: 130px; height: 130px; object-fit: contain; margin-bottom: 4px;" />
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Verified by</div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center;">
              <img src="/assets/signature.png" style="height: 48px; margin-bottom: 4px;" />
              <div style="font-size: 13px; color: #888; margin-top: 2px;">Authorised Signatory</div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleViewPDF = async (receipt: Receipt) => {
    try {
      let customerInfo = {
        name: receipt.customer_name || '',
        entity_name: receipt.customer_name || '',
        address: (receipt as any).customer_address || '',
        email: (receipt as any).customer_email || '',
        phone: (receipt as any).customer_phone || '',
      };
      if (!customerInfo.address || !customerInfo.email || !customerInfo.phone) {
        if (receipt.customer_id) {
          const dbCustomer = await getCustomerById(receipt.customer_id);
          if (dbCustomer) {
            customerInfo = {
              ...customerInfo,
              address: dbCustomer.address || customerInfo.address,
              email: dbCustomer.email || customerInfo.email,
              phone: dbCustomer.phone || customerInfo.phone,
              entity_name: dbCustomer.entity_name || customerInfo.entity_name,
              name: dbCustomer.name || customerInfo.name,
            };
          }
        }
      }
      const customer = {
        id: receipt.customer_id,
        ...customerInfo,
        renewal_date: undefined,
        gstin: '',
        pan: '',
        type: 'business' as const,
        status: 'active' as const,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      const element = document.createElement('div');
      element.innerHTML = generateReceiptHTML(receipt, customer);
      document.body.appendChild(element);
      const opt = {
        margin: 1,
        filename: `receipt-${receipt.reference_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      const worker = html2pdf().set(opt).from(element);
      const pdfBlob = await worker.outputPdf('blob');
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
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
                  <Button
                    className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                    onClick={() => handleViewPDF(selectedReceipt)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View PDF
                  </Button>
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