import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import VendorInvoices from './vendors/invoices/VendorInvoices';

const TestInvoiceUpload: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Invoice Upload Test</h1>
        <p className="text-gray-600">
          Test the AI-powered invoice processing system integrated into the Vendor Invoices page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Integration Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600 mb-2">✅ AI Processing</h3>
              <p className="text-sm text-gray-600">
                Gemini AI integration for invoice data extraction
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600 mb-2">✅ Vendor Matching</h3>
              <p className="text-sm text-gray-600">
                Smart vendor matching and auto-creation
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-green-600 mb-2">✅ File Management</h3>
              <p className="text-sm text-gray-600">
                PDF upload and storage integration
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">How to Test:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Click the "Upload Invoice" button (green button)</li>
              <li>Select or drag & drop a PDF invoice file</li>
              <li>Watch the AI processing in real-time</li>
              <li>Verify the extracted data and vendor matching</li>
              <li>Check that the invoice appears in the table</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Main Vendor Invoices Component */}
      <VendorInvoices />
    </div>
  );
};

export default TestInvoiceUpload; 