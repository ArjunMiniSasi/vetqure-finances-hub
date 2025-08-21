import { Timestamp } from 'firebase/firestore';

export type VendorType =
    | 'Goods'
    | 'Services'
    | 'Equipment'
    | 'Electronics'
    | 'Maintenance'
    | 'Software'
    | 'Consumables'
    | 'Infrastructure';

export type VendorStatus = 'active' | 'inactive';

export type Currency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type UploadStatus = 'pending' | 'uploaded';

// export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export interface Vendor {
    id: string;
    name: string;
    type: VendorType;
    status: VendorStatus;
    email?: string;
    phone?: string;
    gstNumber?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface VendorInvoice {
    id: string;
    invoiceId: string;
    vendorId: string;
    vendorName: string;
    invoiceDate: Date;
    serviceEndDate?: Date;
    currency: Currency;
    amount: number;
    invoiceUrl?: string;
    receiptUrl?: string;
    uploadStatus: UploadStatus;
    createdAt: Date;
}

export interface VendorFormData extends Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> { }

export interface InvoiceFormData extends Omit<VendorInvoice, 'id' | 'createdAt' | 'invoiceUrl' | 'receiptUrl'> {
    invoiceFile?: File;
    receiptFile?: File;
}

// Firebase collection types
export interface VendorDocument extends Omit<Vendor, 'createdAt' | 'updatedAt'> {
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface VendorInvoiceDocument extends Omit<VendorInvoice, 'createdAt' | 'invoiceDate' | 'serviceEndDate'> {
    createdAt: Timestamp;
    invoiceDate: Timestamp;
    serviceEndDate?: Timestamp;
}

// Storage paths
export const getInvoiceStoragePath = (invoiceId: string) => `vendor_invoices/${invoiceId}/invoice.pdf`;
export const getReceiptStoragePath = (invoiceId: string) => `vendor_invoices/${invoiceId}/receipt.pdf`; 