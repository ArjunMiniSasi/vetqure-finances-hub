import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Filter, Download, CheckCircle, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { collection, query, orderBy, onSnapshot, addDoc, Timestamp, doc, updateDoc, limit, getDocs } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { VendorInvoice, Vendor } from '@/types/vendor';
import VendorInvoiceForm from './VendorInvoiceForm';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FileViewerDialog from '@/components/ui/FileViewerDialog';
import { 
  invoiceProcessingService, 
  ProcessingStatus, 
  ProcessingResult,
  validatePDFFile 
} from '@/components/invoice-processor';
import { getVendorInvoicesPaginated, getVendorInvoicesPaginatedBySearch } from '@/services/vendorService';
import { DocumentData } from 'firebase/firestore';

const VendorInvoices: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const { toast } = useToast();
  const [selectedInvoice, setSelectedInvoice] = useState<VendorInvoice | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filePreview, setFilePreview] = useState<{ file: string | null; type: 'pdf' | 'image'; title: string } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<VendorInvoice | null>(null);

  // Pagination states
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [prevDocs, setPrevDocs] = useState<DocumentData[]>([]);
  const [isLastPage, setIsLastPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // Real-time listener state
  const [realTimeListener, setRealTimeListener] = useState<(() => void) | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Refs for real-time listener to avoid dependency changes
  const currentPageRef = useRef(currentPage);
  const debouncedSearchTermRef = useRef(debouncedSearchTerm);
  const isLoadingRef = useRef(isLoading);

  // AI Upload Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Update refs when state changes
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  useEffect(() => {
    debouncedSearchTermRef.current = debouncedSearchTerm;
  }, [debouncedSearchTerm]);

  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);

  // Setup real-time listener for vendor invoices - optimized with refs
  const setupRealTimeListener = useCallback(() => {
    // Clean up existing listener
    if (realTimeListener) {
      realTimeListener();
    }

    const invoicesRef = collection(db, 'vendor_invoices');
    const q = query(invoicesRef, orderBy('createdAt', 'desc'), limit(1));
    
    let updateTimeout: NodeJS.Timeout | null = null;
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestDoc = snapshot.docs[0];
        const latestTime = latestDoc.data().createdAt?.seconds * 1000 || Date.now();
        
        // Only update if this is a newer document than our last update
        if (latestTime > lastUpdateTime) {
          setLastUpdateTime(latestTime);
          
          // Debounce updates to prevent multiple rapid refreshes
          if (updateTimeout) {
            clearTimeout(updateTimeout);
          }
          
          updateTimeout = setTimeout(() => {
            // Use refs to get current values without triggering re-creation
            const currentPage = currentPageRef.current;
            const searchTerm = debouncedSearchTermRef.current;
            const isLoading = isLoadingRef.current;
            
            // Only refresh if we're on first page and no search
            // Allow refresh even if loading for real-time updates
            if (currentPage === 1 && searchTerm.trim() === '') {
              fetchPage('next', '', true);
            }
          }, 100); // Small delay to batch updates
        }
      }
    });

    setRealTimeListener(() => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      return unsubscribe;
    });
    return unsubscribe;
  }, []); // No dependencies - uses refs instead

  useEffect(() => {
    setupRealTimeListener();
    return () => {
      if (realTimeListener) {
        realTimeListener();
      }
    };
  }, [setupRealTimeListener]);

  useEffect(() => {
    fetchPage('next', '', true); // Pass reset=true to bypass loading guard
    // eslint-disable-next-line
  }, []);

  const fetchPage = async (direction: 'next' | 'prev' = 'next', search = debouncedSearchTerm, reset = false) => {
    console.log('fetchPage called:', { direction, search, reset, isLoading });
    
    // Loading guard to prevent concurrent calls - but allow initial load
    if (isLoading && !reset) {
      console.log('Already loading, skipping fetch');
      return;
    }
    
    console.log('Starting fetch...');
    setIsLoading(true);
    try {
      const newPrevDocs = reset ? [] : [...prevDocs];
      const localLastDoc = reset ? null : lastDoc;
      if (search && search.trim() !== '') {
        // Use Firestore-powered paginated search
        if (direction === 'next') {
          if (!reset && localLastDoc) {
            newPrevDocs.push(localLastDoc);
            setCurrentPage((prev) => prev + 1);
          } else if (reset) {
            setCurrentPage(1);
          }
          const { invoices: pageInvoices, lastDoc: newLastDoc } = await getVendorInvoicesPaginatedBySearch(search, PAGE_SIZE, reset ? null : lastDoc);
          setInvoices(pageInvoices);
          setLastDoc(newLastDoc);
          setPrevDocs(newPrevDocs);
          setIsLastPage(!newLastDoc || pageInvoices.length < PAGE_SIZE);
        } else if (direction === 'prev') {
          newPrevDocs.pop();
          const prevDoc = newPrevDocs.length > 0 ? newPrevDocs[newPrevDocs.length - 1] : null;
          const { invoices: pageInvoices, lastDoc: newLastDoc } = await getVendorInvoicesPaginatedBySearch(search, PAGE_SIZE, prevDoc);
          setInvoices(pageInvoices);
          setLastDoc(newLastDoc);
          setPrevDocs(newPrevDocs);
          setIsLastPage(false);
          setCurrentPage((prev) => Math.max(1, prev - 1));
        }
        setIsLoading(false);
        return;
      }
      // Default: no search term, use normal pagination
      if (direction === 'next') {
        if (!reset && localLastDoc) {
          newPrevDocs.push(localLastDoc);
          setCurrentPage((prev) => prev + 1);
        } else if (reset) {
          setCurrentPage(1);
        }
        const { invoices: pageInvoices, lastDoc: newLastDoc } = await getVendorInvoicesPaginated(PAGE_SIZE, reset ? null : lastDoc);
        setInvoices(pageInvoices);
        setLastDoc(newLastDoc);
        setPrevDocs(newPrevDocs);
        setIsLastPage(!newLastDoc || pageInvoices.length < PAGE_SIZE);
      } else if (direction === 'prev') {
        newPrevDocs.pop();
        const prevDoc = newPrevDocs.length > 0 ? newPrevDocs[newPrevDocs.length - 1] : null;
        const { invoices: pageInvoices, lastDoc: newLastDoc } = await getVendorInvoicesPaginated(PAGE_SIZE, prevDoc);
        setInvoices(pageInvoices);
        setLastDoc(newLastDoc);
        setPrevDocs(newPrevDocs);
        setIsLastPage(false);
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load invoices', variant: 'destructive' });
      console.error('Error loading invoices:', error);
    } finally {
      console.log('Fetch completed, setting loading to false');
      setIsLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    // Loading guard - allow refresh even if loading
    if (isLoading) {
      console.log('Already loading, but allowing refresh');
    }
    
    setLastDoc(null);
    setPrevDocs([]);
    setCurrentPage(1);
    setIsLastPage(false);
    setLastUpdateTime(Date.now());
    await fetchPage('next', debouncedSearchTerm, true);
    toast({ title: 'Success', description: 'Invoices refreshed successfully' });
  }, [debouncedSearchTerm, isLoading]);

  // Add a helper to reset pagination and fetch the first page
  const resetPaginationAndFetch = () => {
    // Loading guard - allow reset even if loading
    if (isLoading) {
      console.log('Already loading, but allowing reset');
    }
    
    setLastDoc(null);
    setPrevDocs([]);
    setCurrentPage(1);
    setIsLastPage(false);
    setTimeout(() => fetchPage('next', '', true), 0);
  };

  // Reset pagination on search (using debounced term)
  useEffect(() => {
    // Skip on initial load when debouncedSearchTerm is empty
    if (debouncedSearchTerm === '' && invoices.length === 0) {
      return;
    }
    
    if (debouncedSearchTerm.trim() === '') {
      resetPaginationAndFetch();
    } else {
      setLastDoc(null);
      setPrevDocs([]);
      setCurrentPage(1);
      setIsLastPage(false);
      fetchPage('next', debouncedSearchTerm, true);
    }
    // eslint-disable-next-line
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // Fetch vendors for dropdown - only once on mount since vendor data doesn't change frequently
    const fetchVendors = async () => {
      try {
        const vendorsRef = collection(db, 'vendors');
        const q = query(vendorsRef, orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        setVendors(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Vendor));
      } catch (error) {
        console.error('Error fetching vendors:', error);
        toast({ title: 'Error', description: 'Failed to load vendors', variant: 'destructive' });
      }
    };
    
    fetchVendors();
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

  const filteredInvoices = invoices;

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
        invoiceId: data.invoiceId,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        vendorNameLower: data.vendorName.toLowerCase(),
        invoiceDate: Timestamp.fromDate(data.invoiceDate),
        serviceEndDate: data.serviceEndDate ? Timestamp.fromDate(data.serviceEndDate) : null,
        currency: data.currency,
        amount: data.amount,
        taxAmount: data.taxAmount || 0,
        invoiceUrl,
        receiptUrl,
        uploadStatus: invoiceUrl ? 'uploaded' : 'pending',
        createdAt: Timestamp.now(),
      });
      setIsAddModalOpen(false);
      toast({ title: 'Success', description: 'Invoice created successfully' });
      
      // Real-time listener will automatically update the list
      // No need for manual refresh to avoid redundant calls
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    }
  };

  const handleEditInvoice = async (data) => {
    if (!editInvoice) return;
    try {
      let invoiceUrl = editInvoice.invoiceUrl;
      let receiptUrl = editInvoice.receiptUrl;

      // Upload new invoice file if provided
      if (data.invoiceFile && data.invoiceFile instanceof File) {
        const invoiceRef = ref(storage, `vendor_invoices/${Date.now()}_${data.invoiceFile.name}`);
        await uploadBytes(invoiceRef, data.invoiceFile);
        invoiceUrl = await getDownloadURL(invoiceRef);
      }

      // Upload new receipt file if provided
      if (data.receiptFile && data.receiptFile instanceof File) {
        const receiptRef = ref(storage, `vendor_invoices/${Date.now()}_${data.receiptFile.name}`);
        await uploadBytes(receiptRef, data.receiptFile);
        receiptUrl = await getDownloadURL(receiptRef);
      }

      await updateDoc(doc(db, 'vendor_invoices', editInvoice.id), {
        invoiceId: data.invoiceId,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        vendorNameLower: data.vendorName.toLowerCase(),
        invoiceDate: Timestamp.fromDate(data.invoiceDate),
        serviceEndDate: data.serviceEndDate ? Timestamp.fromDate(data.serviceEndDate) : null,
        currency: data.currency,
        amount: data.amount,
        taxAmount: data.taxAmount || 0,
        invoiceUrl,
        receiptUrl,
        // ...other fields
      });
      setIsEditModalOpen(false);
      setEditInvoice(null);
      toast({ title: 'Success', description: 'Invoice updated successfully' });
      
      // Real-time listener will automatically update the list
      // No need for manual refresh
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update invoice', variant: 'destructive' });
    }
  };

  // Helper to get vendor name
  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor ? vendor.name : vendorId || '-';
  };

  // Helper to format Firestore Timestamp or JS Date
  const formatDate = (date: Date | Timestamp | null | undefined) => {
    if (!date) return '-';
    if (typeof date === 'object' && 'seconds' in date) {
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

  const handleProgress = (status: ProcessingStatus, message: string, progressValue: number) => {
    setCurrentStatus(status);
    setStatusMessage(message);
    setProgress(progressValue);
  };

  const processInvoiceFile = async (file: File) => {
    // Validate file
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      toast({ title: 'Error', description: validation.error || 'Invalid file', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setCurrentStatus('idle');
    setProgress(0);
    setStatusMessage('');
    setProcessingResult(null);

    try {
      const result = await invoiceProcessingService.processInvoice(file, handleProgress);
      setProcessingResult(result);

      if (result.success) {
        toast({ title: 'Success', description: 'Invoice processed successfully!' });
        // Close modal after successful processing
        setTimeout(() => {
          setIsUploadModalOpen(false);
          setIsProcessing(false);
          setProcessingResult(null);
          // Real-time listener will automatically update the list
          // No need for manual refresh
        }, 2000);
      } else {
        toast({ title: 'Error', description: result.error || 'Processing failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processInvoiceFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      processInvoiceFile(pdfFile);
    } else {
      toast({ title: 'Error', description: 'Please drop a PDF file', variant: 'destructive' });
    }
  };

  const getProcessingStatusIcon = () => {
    switch (currentStatus) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <CheckCircle className="w-6 h-6 text-red-500" />;
      case 'idle':
        return <Upload className="w-6 h-6 text-gray-400" />;
      default:
        return <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
    }
  };

  const getProcessingStatusColor = () => {
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Vendor Invoices</h1>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={isProcessing}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Upload Invoice'}
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isProcessing}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Processing Status Banner */}
      {isProcessing && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="font-medium text-green-800">
                  {statusMessage || 'Processing invoice...'}
                </p>
                <p className="text-sm text-green-600">
                  {currentStatus.replace('_', ' ').toUpperCase()} - {progress}% complete
                </p>
              </div>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-3">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

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
            <>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tax
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        {debouncedSearchTerm.trim() !== '' 
                          ? `No invoices found matching "${debouncedSearchTerm}"`
                          : 'No invoices found'
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.invoiceId}</div>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {invoice.taxAmount ? `${currencySymbol(invoice.currency)}${invoice.taxAmount.toFixed(2)}` : '₹0.00'}
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
                          <Button
                            variant="ghost"
                            className="text-black-600 hover:text-black-900"
                            onClick={() => {
                              setEditInvoice(invoice);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex flex-col gap-2 p-4">
              {debouncedSearchTerm.trim() !== '' && (
                <span className="text-sm text-gray-500">
                  Search results for: "{debouncedSearchTerm}"
                </span>
              )}
              <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" onClick={() => fetchPage('prev')} disabled={isLoading || currentPage === 1}>
                  Previous
                </Button>
                <span className="text-sm text-gray-600">Page {currentPage}</span>
                <Button variant="outline" onClick={() => fetchPage('next')} disabled={isLastPage || isLoading}>
                  Next
                </Button>
              </div>
            </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="w-[600px] max-w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              AI-Powered Invoice Upload
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Upload Area */}
            {!isProcessing && !processingResult && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-green-500 bg-green-50' 
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
                  Our AI will automatically extract vendor information and invoice details
                </p>
                <Button
                  onClick={() => document.getElementById('upload-file-input')?.click()}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Select PDF File
                </Button>
                <input
                  id="upload-file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>
            )}

            {/* Processing Status */}
            {isProcessing && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {getProcessingStatusIcon()}
                    <div>
                      <p className={`font-medium ${getProcessingStatusColor()}`}>
                        {statusMessage || 'Processing...'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {currentStatus.replace('_', ' ').toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
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
            {processingResult && (
              <Card className={processingResult.success ? 'border-green-200' : 'border-red-200'}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${
                    processingResult.success ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {processingResult.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {processingResult.success ? 'Processing Complete' : 'Processing Failed'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {processingResult.success ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Vendor:</span>
                          <p className="text-gray-600">{processingResult.extractedData?.vendorName}</p>
                        </div>
                        <div>
                          <span className="font-medium">Invoice Number:</span>
                          <p className="text-gray-600">{processingResult.extractedData?.invoiceNumber}</p>
                        </div>
                        <div>
                          <span className="font-medium">Amount:</span>
                          <p className="text-gray-600">
                            {processingResult.extractedData?.currency} {processingResult.extractedData?.totalAmount}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Date:</span>
                          <p className="text-gray-600">
                            {processingResult.extractedData?.invoiceDate.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Processing time: {processingResult.processingTime}ms
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <p className="font-medium">Error:</p>
                      <p>{processingResult.error}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                    <div className="font-medium text-gray-900 text-base">{currencySymbol(selectedInvoice.currency)}{selectedInvoice.amount?.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Tax Amount</div>
                    <div className="font-medium text-gray-900 text-base">{currencySymbol(selectedInvoice.currency)}{(selectedInvoice.taxAmount || 0).toFixed(2)}</div>
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

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Vendor Invoice</DialogTitle>
          </DialogHeader>
          {editInvoice && (
            <VendorInvoiceForm
              vendors={vendors}
              onSubmit={handleEditInvoice}
              onCancel={() => { setIsEditModalOpen(false); setEditInvoice(null); }}
              isSubmitting={false}
              initialData={editInvoice}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorInvoices; 