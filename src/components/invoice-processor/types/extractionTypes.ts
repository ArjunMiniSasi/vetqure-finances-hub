import { VendorType, Currency } from '@/types/vendor';

// Extracted data from PDF using AI
export interface ExtractedInvoiceData {
    // Vendor Information
    vendorName: string;
    vendorEmail?: string;
    vendorPhone?: string;
    vendorGstNumber?: string;
    vendorAddress?: string;

    // Invoice Information
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate?: Date;
    serviceEndDate?: Date;

    // Financial Information
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
    currency: Currency;

    // Line Items (if available)
    lineItems?: InvoiceLineItem[];

    // Additional Information
    notes?: string;
    terms?: string;

    // Confidence scores for AI extraction
    confidence: {
        vendorName: number;
        invoiceNumber: number;
        totalAmount: number;
        invoiceDate: number;
        overall: number;
    };
}

export interface InvoiceLineItem {
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
}

// Processing workflow status
export type ProcessingStatus =
    | 'idle'
    | 'uploading'
    | 'extracting'
    | 'analyzing'
    | 'matching_vendor'
    | 'confirming'
    | 'saving'
    | 'completed'
    | 'error';

// Processing step details
export interface ProcessingStep {
    status: ProcessingStatus;
    message: string;
    progress: number; // 0-100
    error?: string;
    timestamp: Date;
}

// Vendor matching result
export interface VendorMatchResult {
    type: 'exact_match' | 'fuzzy_match' | 'no_match' | 'multiple_matches';
    vendor?: {
        id: string;
        name: string;
        email?: string;
        phone?: string;
        gstNumber?: string;
        type: VendorType;
        status: 'active' | 'inactive';
    };
    confidence: number;
    suggestedVendor?: {
        name: string;
        email?: string;
        phone?: string;
        gstNumber?: string;
        type: VendorType;
    };
    multipleMatches?: Array<{
        id: string;
        name: string;
        email?: string;
        phone?: string;
        confidence: number;
    }>;
}

// File upload information
export interface UploadedFile {
    file: File;
    id: string;
    name: string;
    size: number;
    type: string;
    uploadProgress: number;
    uploadStatus: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}

// Processing result
export interface ProcessingResult {
    success: boolean;
    extractedData?: ExtractedInvoiceData;
    vendorMatch?: VendorMatchResult;
    invoiceId?: string;
    vendorId?: string;
    error?: string;
    processingTime: number;
    timestamp: Date;
    usedFallback?: boolean;
}

// Gemini AI response structure
export interface GeminiExtractionResponse {
    vendorName: string;
    vendorEmail?: string;
    vendorPhone?: string;
    vendorGstNumber?: string;
    vendorAddress?: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    serviceEndDate?: string;
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
    currency: string;
    lineItems?: Array<{
        description: string;
        quantity?: number;
        unitPrice?: number;
        amount: number;
    }>;
    notes?: string;
    terms?: string;
    confidence: {
        vendorName: number;
        invoiceNumber: number;
        totalAmount: number;
        invoiceDate: number;
        overall: number;
    };
} 