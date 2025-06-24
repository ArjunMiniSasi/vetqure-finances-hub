import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import InvoiceProcessor from './invoice-processor/components/InvoiceProcessor';

const InvoiceProcessorDemo: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">AI-Powered Invoice Processing</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload invoice PDFs and let our AI automatically extract vendor information, 
          match existing vendors, and create invoice records in seconds.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold">AI Extraction</h3>
            </div>
            <p className="text-sm text-gray-600">
              Uses Google Gemini AI to intelligently extract invoice data with high accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Smart Matching</h3>
            </div>
            <p className="text-sm text-gray-600">
              Automatically matches vendors or creates new ones based on extracted data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold">Data Validation</h3>
            </div>
            <p className="text-sm text-gray-600">
              Comprehensive validation ensures data quality before saving to database
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supported Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Supported Invoice Fields
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h4 className="font-medium text-sm mb-2">Vendor Information</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs">Vendor Name</Badge>
                <Badge variant="secondary" className="text-xs">Email</Badge>
                <Badge variant="secondary" className="text-xs">Phone</Badge>
                <Badge variant="secondary" className="text-xs">GST Number</Badge>
                <Badge variant="secondary" className="text-xs">Address</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Invoice Details</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs">Invoice Number</Badge>
                <Badge variant="secondary" className="text-xs">Invoice Date</Badge>
                <Badge variant="secondary" className="text-xs">Due Date</Badge>
                <Badge variant="secondary" className="text-xs">Service End Date</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Financial Data</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs">Subtotal</Badge>
                <Badge variant="secondary" className="text-xs">Tax Amount</Badge>
                <Badge variant="secondary" className="text-xs">Total Amount</Badge>
                <Badge variant="secondary" className="text-xs">Currency</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm mb-2">Additional Info</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs">Line Items</Badge>
                <Badge variant="secondary" className="text-xs">Notes</Badge>
                <Badge variant="secondary" className="text-xs">Terms</Badge>
                <Badge variant="secondary" className="text-xs">Confidence Scores</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Workflow */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">PDF Upload & Text Extraction</h4>
                <p className="text-sm text-gray-600">Upload PDF and extract text content using PDF.js</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">AI-Powered Data Extraction</h4>
                <p className="text-sm text-gray-600">Use Gemini AI to extract structured invoice data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Vendor Matching</h4>
                <p className="text-sm text-gray-600">Match with existing vendors or create new ones</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium">Data Validation</h4>
                <p className="text-sm text-gray-600">Validate extracted data for accuracy and completeness</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                5
              </div>
              <div>
                <h4 className="font-medium">Save to Database</h4>
                <p className="text-sm text-gray-600">Save invoice and vendor data to Firestore</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Processor Component */}
      <InvoiceProcessor />
    </div>
  );
};

export default InvoiceProcessorDemo; 