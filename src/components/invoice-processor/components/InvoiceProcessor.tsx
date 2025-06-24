import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { 
  invoiceProcessingService, 
  ProcessingStatus, 
  ProcessingResult,
  validatePDFFile 
} from '../index';

const InvoiceProcessor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [lastResult, setLastResult] = useState<ProcessingResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleProgress = useCallback((status: ProcessingStatus, message: string, progressValue: number) => {
    setCurrentStatus(status);
    setStatusMessage(message);
    setProgress(progressValue);
  }, []);

  const processFile = async (file: File) => {
    // Validate file
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file');
      return;
    }

    setIsProcessing(true);
    setCurrentStatus('idle');
    setProgress(0);
    setStatusMessage('');
    setLastResult(null);

    try {
      const result = await invoiceProcessingService.processInvoice(file, handleProgress);
      setLastResult(result);

      if (result.success) {
        toast.success('Invoice processed successfully!');
      } else {
        toast.error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      processFile(pdfFile);
    } else {
      toast.error('Please drop a PDF file');
    }
  }, []);

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'idle':
        return <FileText className="w-6 h-6 text-gray-400" />;
      default:
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'completed':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'idle':
        return 'text-gray-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Invoice PDF Processor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your invoice PDF here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <Button
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Select PDF File
            </Button>
            <input
              id="file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
            />
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  {getStatusIcon()}
                  <div>
                    <p className={`font-medium ${getStatusColor()}`}>
                      {statusMessage || 'Processing...'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {currentStatus.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {progress}% complete
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {lastResult && (
            <Card className={lastResult.success ? 'border-green-200' : 'border-red-200'}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${
                  lastResult.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {lastResult.success ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  {lastResult.success ? 'Processing Complete' : 'Processing Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lastResult.success ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Vendor:</span>
                        <p className="text-gray-600">{lastResult.extractedData?.vendorName}</p>
                      </div>
                      <div>
                        <span className="font-medium">Invoice Number:</span>
                        <p className="text-gray-600">{lastResult.extractedData?.invoiceNumber}</p>
                      </div>
                      <div>
                        <span className="font-medium">Amount:</span>
                        <p className="text-gray-600">
                          {lastResult.extractedData?.currency} {lastResult.extractedData?.totalAmount}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>
                        <p className="text-gray-600">
                          {lastResult.extractedData?.invoiceDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Processing time: {lastResult.processingTime}ms
                    </div>
                  </div>
                ) : (
                  <div className="text-red-600">
                    <p className="font-medium">Error:</p>
                    <p>{lastResult.error}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceProcessor; 