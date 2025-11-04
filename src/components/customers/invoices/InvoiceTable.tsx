import React from 'react';
import { Invoice, Customer } from '@/services/firestoreService';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface InvoiceTableProps {
  invoices: Invoice[];
  customers: Customer[];
  searchTerm: string;
  onViewDetails: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoice: Invoice) => void;
}

const currencyOptions = [
  { code: 'INR', symbol: '₹' },
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
];

const getCurrencySymbol = (code: string) => {
  const found = currencyOptions.find(opt => opt.code === code);
  return found ? found.symbol : '₹';
};

const InvoiceTable: React.FC<InvoiceTableProps> = ({ invoices, customers, searchTerm, onViewDetails, onEditInvoice, onDeleteInvoice }) => {
  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                  {invoice.date_created?.toDate ? invoice.date_created.toDate().toLocaleDateString() : ''}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {invoice.due_date?.toDate ? invoice.due_date.toDate().toLocaleDateString() : ''}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${invoice.status === 'completed' ? 'bg-green-100 text-green-800' : invoice.status === 'pending' ? 'bg-yellow-100 text-orange-800' : invoice.status === 'cancelled' ? 'bg-pink-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                  {invoice.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {getCurrencySymbol(invoice.currency)}{invoice.total?.toFixed(2)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    onClick={() => onViewDetails(invoice)}
                    title="View Details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    onClick={() => onEditInvoice(invoice)}
                    title="Edit Invoice"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    onClick={() => onDeleteInvoice(invoice)}
                    title="Delete Invoice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceTable; 