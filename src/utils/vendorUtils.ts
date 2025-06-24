import { Vendor, VendorDocument, VendorInvoice, VendorInvoiceDocument } from '../types/vendor';
import { Timestamp } from 'firebase/firestore';

export const validateVendorData = (data: Partial<Vendor>): string[] => {
    const errors: string[] = [];

    if (!data.name?.trim()) {
        errors.push('Vendor name is required');
    }

    if (!data.type) {
        errors.push('Vendor type is required');
    }

    if (!data.status) {
        errors.push('Vendor status is required');
    }

    if (data.email && !isValidEmail(data.email)) {
        errors.push('Invalid email format');
    }

    if (data.phone && !isValidPhone(data.phone)) {
        errors.push('Invalid phone format');
    }

    if (data.gstNumber && !isValidGST(data.gstNumber)) {
        errors.push('Invalid GST number format');
    }

    return errors;
};

export const validateInvoiceData = (data: Partial<VendorInvoice>): string[] => {
    const errors: string[] = [];

    if (!data.vendorId) {
        errors.push('Vendor is required');
    }

    if (!data.invoiceDate) {
        errors.push('Invoice date is required');
    }

    if (!data.currency) {
        errors.push('Currency is required');
    }

    if (!data.amount || data.amount <= 0) {
        errors.push('Amount must be greater than 0');
    }

    return errors;
};

// Helper validation functions
const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    return phoneRegex.test(phone);
};

const isValidGST = (gst: string): boolean => {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstRegex.test(gst);
};

// Firebase document conversion utilities
export const vendorToDocument = (vendor: Partial<Vendor>): Partial<VendorDocument> => {
    const doc = { ...vendor } as any;
    delete doc.createdAt;
    delete doc.updatedAt;

    // Only convert dates if they exist
    if (vendor.createdAt) {
        doc.createdAt = Timestamp.fromDate(vendor.createdAt);
    }
    if (vendor.updatedAt) {
        doc.updatedAt = Timestamp.fromDate(vendor.updatedAt);
    }

    return doc;
};

export const documentToVendor = (doc: VendorDocument): Vendor => {
    return {
        ...doc,
        createdAt: doc.createdAt.toDate(),
        updatedAt: doc.updatedAt.toDate(),
    };
};

export const invoiceToDocument = (invoice: VendorInvoice): VendorInvoiceDocument => {
    return {
        ...invoice,
        createdAt: Timestamp.fromDate(invoice.createdAt),
        invoiceDate: Timestamp.fromDate(invoice.invoiceDate),
        serviceEndDate: invoice.serviceEndDate
            ? Timestamp.fromDate(invoice.serviceEndDate)
            : undefined,
    };
};

export const documentToInvoice = (doc: VendorInvoiceDocument): VendorInvoice => {
    return {
        ...doc,
        createdAt: doc.createdAt.toDate(),
        invoiceDate: doc.invoiceDate.toDate(),
        serviceEndDate: doc.serviceEndDate?.toDate(),
    };
}; 