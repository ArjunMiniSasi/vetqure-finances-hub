import {
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    DocumentData,
    setDoc,
    limit,
    startAfter,
    startAt,
    endAt
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types
export interface Customer {
    id?: string;
    name: string;
    entity_name: string;
    email: string;
    phone: string;
    address: string;
    type: 'individual' | 'business';
    status: 'active' | 'inactive';
    renewal_date: Timestamp | null;
    gst_number?: string; // GST number for B2B clients
    state?: string; // Customer state for GST calculation
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Invoice {
    id?: string; // Document ID (stable UUID for new invoices, invoice_id for existing)
    document_id?: string; // Stable UUID (for new invoices)
    invoice_id?: string; // Generated invoice number (VAMS/2024-25/001) - kept for backward compatibility
    invoice_number?: string; // New field for invoice number (replaces invoice_id for new invoices)
    customer_id: string;
    customer_name: string;
    date_created: Timestamp;
    due_date: Timestamp;
    status: 'pending' | 'completed' | 'cancelled';
    total: number;
    items: InvoiceItem[];
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    currency: string;
    // Version tracking for stable ID system
    version?: number; // Version number (1, 2, 3...)
    is_latest?: boolean; // Is this the latest version?
    original_invoice_number?: string; // First invoice number (for audit trail)
    // GST Fields
    company_gst_number: string; // Fixed company GST number
    customer_gst_number?: string; // Customer GST number
    customer_state?: string; // Customer state
    gst_type: 'intra_state' | 'inter_state'; // CGST+SGST or IGST
    // Invoice Prefix
    invoice_prefix?: string; // Prefix for invoice number (VAMS or VQ, default: VQ)
    taxable_amount: number; // Total before tax
    cgst_amount: number; // CGST amount (9% for intra-state)
    sgst_amount: number; // SGST amount (9% for intra-state)
    igst_amount: number; // IGST amount (18% for inter-state)
    total_gst_amount: number; // Total GST amount
    grand_total: number; // Total including GST
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    hsn_sac_code: string; // HSN/SAC code for GST
    tax_rate: number; // Tax rate percentage (e.g., 18 for 18%)
    taxable_amount: number; // Amount before tax
    tax_amount: number; // GST amount for this item
}

export interface Receipt {
    id?: string;
    invoice_id: string; // Current invoice number (for display and backward compatibility)
    invoice_document_id?: string; // Stable reference to invoice document (for new receipts)
    customer_id: string;
    customer_name: string;
    amount: number;
    date: Date;
    method: 'card' | 'cash' | 'bank_transfer';
    status: 'successful' | 'pending' | 'failed';
    reference_number?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
    currency: string;
}

// Customer Operations
export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const now = Timestamp.now();
        const customerWithTimestamps = {
            ...customerData,
            renewal_date: customerData.renewal_date,
            // Add lowercase search fields for case-insensitive search
            name_lower: customerData.name.toLowerCase(),
            email_lower: customerData.email.toLowerCase(),
            entity_name_lower: customerData.entity_name.toLowerCase(),
            createdAt: now,
            updatedAt: now
        };
        const docRef = await addDoc(collection(db, 'customers'), customerWithTimestamps);
        return { id: docRef.id, ...customerWithTimestamps };
    } catch (error) {
        console.error('Error adding customer:', error);
        throw error;
    }
};

export const getCustomers = async (): Promise<Customer[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, 'customers'));
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Customer));
    } catch (error) {
        console.error('Error getting customers:', error);
        throw error;
    }
};

export const updateCustomer = async (customerId: string, customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const now = Timestamp.now();
        const customerRef = doc(db, 'customers', customerId);
        await updateDoc(customerRef, {
            ...customerData,
            renewal_date: customerData.renewal_date,
            // Update lowercase search fields for case-insensitive search
            name_lower: customerData.name.toLowerCase(),
            email_lower: customerData.email.toLowerCase(),
            entity_name_lower: customerData.entity_name.toLowerCase(),
            updatedAt: now
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        throw error;
    }
};

// Helper to generate stable UUID for document IDs
export const generateStableId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Helper to convert invoice number to Firestore-safe document ID
// Replaces slashes with dashes since Firestore document IDs cannot contain slashes
export const invoiceNumberToDocId = (invoiceNumber: string): string => {
    return invoiceNumber.replace(/\//g, '-');
};

// Helper to convert document ID back to invoice number format (if needed)
// Replaces dashes with slashes
export const docIdToInvoiceNumber = (docId: string): string => {
    // Only convert if it looks like our format (contains dashes in expected pattern)
    if (docId.includes('-') && (docId.startsWith('VAMS-') || docId.startsWith('VQ-'))) {
        return docId.replace(/-/g, '/');
    }
    return docId;
};

// Helper to generate custom invoice ID
export const generateCustomInvoiceId = async (): Promise<string> => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    const dateStr = dd + mm + yy;
    // Query for today's invoices
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    const q = query(
        collection(db, 'customer_invoices'),
        where('date_created', '>=', Timestamp.fromDate(startOfDay)),
        where('date_created', '<=', Timestamp.fromDate(endOfDay))
    );
    const querySnapshot = await getDocs(q);
    const count = querySnapshot.size + 1;
    const sequence = String(count).padStart(6, '0');
    return `VAMS${dateStr}${sequence}`;
};

// Invoice Operations
export const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = Timestamp.now();
        const prefix = invoiceData.invoice_prefix || 'VQ'; // Default to VQ
        const invoiceNumber = await generateInvoiceNumber(prefix); // Generate invoice number

        // Calculate GST if not already calculated
        let gstData = {};
        if (invoiceData.customer_state) {
            const taxableAmount = invoiceData.items.reduce((sum, item) => sum + (item.taxable_amount || item.amount), 0);
            gstData = calculateGST(taxableAmount, invoiceData.customer_state);
        }

        const invoiceWithTimestamps = {
            ...invoiceData,
            document_id: invoiceNumber, // Invoice number is the document ID
            invoice_number: invoiceNumber, // New field for invoice number
            invoice_id: invoiceNumber, // Keep for backward compatibility
            original_invoice_number: invoiceNumber, // First invoice number
            version: 1, // First version
            is_latest: true, // This is the latest version
            company_gst_number: '32AAGCV9195E1Z2', // Fixed company GST number
            date_created: invoiceData.date_created,
            due_date: invoiceData.due_date,
            createdAt: now,
            updatedAt: now,
            ...gstData
        };

        // Convert invoice number to Firestore-safe document ID (replace / with -)
        const documentId = invoiceNumberToDocId(invoiceNumber);

        // Use invoice number as document ID (with slashes replaced by dashes)
        await setDoc(doc(db, 'customer_invoices', documentId), invoiceWithTimestamps);
        return invoiceNumber; // Return original invoice number format
    } catch (error) {
        console.error('Error adding invoice:', error);
        throw error;
    }
};

export const getCustomerInvoices = async (customerId: string): Promise<Invoice[]> => {
    try {
        const q = query(
            collection(db, 'customer_invoices'),
            where('customer_id', '==', customerId),
            orderBy('date_created', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Invoice));
    } catch (error) {
        console.error('Error getting customer invoices:', error);
        throw error;
    }
};

export const getAllInvoices = async (): Promise<Invoice[]> => {
    try {
        const q = query(
            collection(db, 'customer_invoices'),
            orderBy('date_created', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Invoice));
    } catch (error) {
        console.error('Error getting all invoices:', error);
        throw error;
    }
};

// Receipt Operations
export const addReceipt = async (receiptData: Omit<Receipt, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
        const now = Timestamp.now();
        const receiptWithTimestamps = {
            ...receiptData,
            createdAt: now,
            updatedAt: now
        };
        const docRef = await addDoc(collection(db, 'customer_receipts'), receiptWithTimestamps);
        return docRef.id;
    } catch (error) {
        console.error('Error adding receipt:', error);
        throw error;
    }
};

export const getCustomerReceipts = async (customerId: string): Promise<Receipt[]> => {
    try {
        const q = query(
            collection(db, 'customer_receipts'),
            where('customer_id', '==', customerId),
            orderBy('date', 'desc')
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Receipt));
    } catch (error) {
        console.error('Error getting customer receipts:', error);
        throw error;
    }
};

export const getAllReceipts = async (): Promise<Receipt[]> => {
    try {
        const q = query(
            collection(db, 'customer_receipts'),
            orderBy('date', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Receipt));
    } catch (error) {
        console.error('Error getting all receipts:', error);
        throw error;
    }
};

// Invoice number generation
// New format: {PREFIX}/{YEAR}/{MONTH}/{SEQUENCE}
// Example: VQ/2526/11/001 or VAMS/2526/11/002
export const generateInvoiceNumber = async (prefix: string = 'VQ'): Promise<string> => {
    try {
        const today = new Date();
        const currentYear = today.getFullYear();

        // Financial year format: last 2 digits of start + last 2 digits of end
        // e.g., 2025-26 becomes 2526
        const financialYearStr = `${currentYear.toString().slice(-2)}${(currentYear + 1).toString().slice(-2)}`;

        // Current month (two digits)
        const month = String(today.getMonth() + 1).padStart(2, '0');

        // Calculate financial year start date (April 1)
        const financialYearStart = new Date(currentYear, 3, 1); // April = month 3 (0-indexed)
        const financialYearEnd = new Date(currentYear + 1, 2, 31, 23, 59, 59); // March 31

        // Adjust if current date is before April (use previous financial year)
        let startDate = financialYearStart;
        let endDate = financialYearEnd;
        let yearStr = financialYearStr;

        if (today < financialYearStart) {
            // Current date is before April, use previous financial year
            startDate = new Date(currentYear - 1, 3, 1);
            endDate = new Date(currentYear, 2, 31, 23, 59, 59);
            yearStr = `${(currentYear - 1).toString().slice(-2)}${currentYear.toString().slice(-2)}`;
        }

        // Get all invoices for this financial year with the same prefix
        // Query by date_created to find invoices in the financial year
        const q = query(
            collection(db, 'customer_invoices'),
            where('date_created', '>=', Timestamp.fromDate(startDate)),
            where('date_created', '<=', Timestamp.fromDate(endDate)),
            orderBy('date_created', 'desc')
        );

        const querySnapshot = await getDocs(q);
        let maxSequence = 0;

        // Parse all invoice numbers to find the highest sequence for this prefix
        querySnapshot.docs.forEach(doc => {
            const invoice = doc.data() as Invoice;
            const invoiceNumber = invoice.invoice_number || invoice.invoice_id || '';

            // Check if invoice matches the prefix format and extract sequence
            // Format: PREFIX/YEAR/MONTH/SEQUENCE
            if (invoiceNumber.startsWith(prefix + '/')) {
                const parts = invoiceNumber.split('/');
                if (parts.length === 4 && parts[0] === prefix && parts[1] === yearStr) {
                    const sequence = parseInt(parts[3] || '0');
                    if (!isNaN(sequence) && sequence > maxSequence) {
                        maxSequence = sequence;
                    }
                }
            }
        });

        const nextSequence = maxSequence + 1;

        return `${prefix}/${yearStr}/${month}/${nextSequence.toString().padStart(3, '0')}`;
    } catch (error) {
        console.error('Error generating invoice number:', error);
        throw error;
    }
};

// GST calculation helper
export const calculateGST = (taxableAmount: number, customerState: string, companyState: string = 'Kerala') => {
    const isIntraState = customerState === companyState;
    const taxRate = 18; // 18% GST for veterinary services

    if (isIntraState) {
        // Intra-state: CGST + SGST (9% each)
        const cgstAmount = (taxableAmount * 9) / 100;
        const sgstAmount = (taxableAmount * 9) / 100;
        return {
            gst_type: 'intra_state' as const,
            cgst_amount: cgstAmount,
            sgst_amount: sgstAmount,
            igst_amount: 0,
            total_gst_amount: cgstAmount + sgstAmount
        };
    } else {
        // Inter-state: IGST (18%)
        const igstAmount = (taxableAmount * taxRate) / 100;
        return {
            gst_type: 'inter_state' as const,
            cgst_amount: 0,
            sgst_amount: 0,
            igst_amount: igstAmount,
            total_gst_amount: igstAmount
        };
    }
};

// Update invoice function
export const updateInvoice = async (documentId: string, invoiceData: Partial<Invoice>) => {
    try {
        // Convert documentId to Firestore-safe format if it contains slashes
        const safeDocumentId = documentId.includes('/') ? invoiceNumberToDocId(documentId) : documentId;
        const invoiceRef = doc(db, 'customer_invoices', safeDocumentId);

        // Generate new invoice number for edited invoices (GST compliance)
        // Preserve the prefix from existing invoice or default to VQ
        const existingInvoice = (await getDoc(invoiceRef)).data() as Invoice;
        const prefix = existingInvoice?.invoice_prefix || invoiceData.invoice_prefix || 'VQ';
        const newInvoiceNumber = await generateInvoiceNumber(prefix);
        const newDocumentId = invoiceNumberToDocId(newInvoiceNumber);

        const updateData = {
            ...invoiceData,
            document_id: newInvoiceNumber, // Store original format with slashes
            invoice_number: newInvoiceNumber, // Update invoice number
            invoice_id: newInvoiceNumber, // Keep for backward compatibility
            version: (invoiceData.version || 1) + 1, // Increment version
            is_latest: true, // This becomes the latest version
            updatedAt: Timestamp.now()
        };

        // If invoice number changed, create new document with new invoice number as ID
        // and mark old document as not latest
        if (safeDocumentId !== newDocumentId) {
            // Mark old document as not latest
            await updateDoc(invoiceRef, {
                is_latest: false,
                updatedAt: Timestamp.now()
            });

            // Create new document with new invoice number as document ID (Firestore-safe format)
            const newInvoiceRef = doc(db, 'customer_invoices', newDocumentId);
            await setDoc(newInvoiceRef, {
                ...existingInvoice,
                ...updateData
            });

            return { id: newInvoiceNumber, ...updateData };
        } else {
            // Invoice number didn't change, just update the document
            await updateDoc(invoiceRef, updateData);
            return { id: newInvoiceNumber, ...updateData };
        }
    } catch (error) {
        console.error('Error updating invoice:', error);
        throw error;
    }
};

export const updateInvoiceStatus = async (invoiceId: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
        // Convert invoice ID to Firestore-safe format if it contains slashes
        const safeInvoiceId = invoiceId.includes('/') ? invoiceNumberToDocId(invoiceId) : invoiceId;
        const invoiceRef = doc(db, 'customer_invoices', safeInvoiceId);
        await updateDoc(invoiceRef, { status, updatedAt: Timestamp.now() });
    } catch (error) {
        console.error('Error updating invoice status:', error);
        throw error;
    }
};

export const updateCustomerRenewalDate = async (customerId: string, newRenewalDate: Timestamp) => {
    try {
        const customerRef = doc(db, 'customers', customerId);
        await updateDoc(customerRef, { renewal_date: newRenewalDate, updatedAt: Timestamp.now() });
    } catch (error) {
        console.error('Error updating customer renewal date:', error);
        throw error;
    }
};

export const deleteInvoice = async (invoiceId: string) => {
    try {
        // Convert invoice ID to Firestore-safe format if it contains slashes
        const safeInvoiceId = invoiceId.includes('/') ? invoiceNumberToDocId(invoiceId) : invoiceId;
        await deleteDoc(doc(db, 'customer_invoices', safeInvoiceId));
    } catch (error) {
        console.error('Error deleting invoice:', error);
        throw error;
    }
};

// Helper function to convert Firestore Timestamp to Date
export const convertTimestampToDate = (data: DocumentData): any => {
    const result = { ...data };
    for (const key in result) {
        if (result[key] instanceof Timestamp) {
            result[key] = result[key].toDate();
        }
    }
    return result;
};

export const getCustomerById = async (customerId: string): Promise<Customer | null> => {
    try {
        const customerRef = doc(db, 'customers', customerId);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
            return { id: customerSnap.id, ...customerSnap.data() } as Customer;
        }
        return null;
    } catch (error) {
        console.error('Error fetching customer by ID:', error);
        return null;
    }
};

// Paginated Customer Fetch
export const getCustomersPaginated = async (
    pageSize: number,
    lastDoc?: DocumentData // pass the last document from previous page for next page
): Promise<{ customers: Customer[]; lastDoc: DocumentData | null }> => {
    try {
        let q = query(
            collection(db, 'customers'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );
        if (lastDoc) {
            q = query(
                collection(db, 'customers'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(pageSize)
            );
        }
        const querySnapshot = await getDocs(q);
        const customers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Customer));
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        return { customers, lastDoc: lastVisible };
    } catch (error) {
        console.error('Error getting paginated customers:', error);
        throw error;
    }
};

// Paginated Customer Search by Name
export const getCustomersPaginatedByName = async (
    searchTerm: string,
    pageSize: number,
    lastDoc?: DocumentData
): Promise<{ customers: Customer[]; lastDoc: DocumentData | null }> => {
    try {
        // For case-insensitive search, we'll use a different approach
        // Since Firestore doesn't support case-insensitive queries directly,
        // we'll search for the lowercase version and then filter client-side

        const lowerSearchTerm = searchTerm.toLowerCase();
        const upperSearchTerm = searchTerm.toUpperCase();
        const capitalizedSearchTerm = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();

        // Create multiple queries for different case variations
        const queries = [
            query(
                collection(db, 'customers'),
                orderBy('name'),
                startAt(lowerSearchTerm),
                endAt(lowerSearchTerm + '\uf8ff'),
                limit(pageSize * 3) // Get more results to account for filtering
            ),
            query(
                collection(db, 'customers'),
                orderBy('name'),
                startAt(upperSearchTerm),
                endAt(upperSearchTerm + '\uf8ff'),
                limit(pageSize * 3)
            ),
            query(
                collection(db, 'customers'),
                orderBy('name'),
                startAt(capitalizedSearchTerm),
                endAt(capitalizedSearchTerm + '\uf8ff'),
                limit(pageSize * 3)
            )
        ];

        // Execute all queries in parallel
        const querySnapshots = await Promise.all(queries.map(q => getDocs(q)));

        // Combine and deduplicate results
        const allDocs = new Map();
        querySnapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
                allDocs.set(doc.id, doc);
            });
        });

        // Convert to customers and filter client-side for case-insensitive match
        const allCustomers = Array.from(allDocs.values()).map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Customer));

        // Filter for case-insensitive match
        const filteredCustomers = allCustomers.filter(customer =>
            customer.name.toLowerCase().includes(lowerSearchTerm) ||
            customer.email.toLowerCase().includes(lowerSearchTerm) ||
            customer.entity_name.toLowerCase().includes(lowerSearchTerm)
        );

        // Sort by name and apply pagination
        filteredCustomers.sort((a, b) => a.name.localeCompare(b.name));

        // For pagination, we'll return the first pageSize results
        // Note: This is a simplified pagination for case-insensitive search
        const paginatedCustomers = filteredCustomers.slice(0, pageSize);

        return {
            customers: paginatedCustomers,
            lastDoc: null // Simplified pagination for case-insensitive search
        };
    } catch (error) {
        console.error('Error getting paginated customers by name:', error);
        throw error;
    }
};

// More efficient case-insensitive search using lowercase fields
export const getCustomersPaginatedByNameCaseInsensitive = async (
    searchTerm: string,
    pageSize: number,
    lastDoc?: DocumentData
): Promise<{ customers: Customer[]; lastDoc: DocumentData | null }> => {
    try {
        const lowerSearchTerm = searchTerm.toLowerCase();

        // Use the lowercase field for efficient case-insensitive search
        let q = query(
            collection(db, 'customers'),
            orderBy('name_lower'),
            startAt(lowerSearchTerm),
            endAt(lowerSearchTerm + '\uf8ff'),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(
                collection(db, 'customers'),
                orderBy('name_lower'),
                startAt(lowerSearchTerm),
                endAt(lowerSearchTerm + '\uf8ff'),
                startAfter(lastDoc),
                limit(pageSize)
            );
        }

        const querySnapshot = await getDocs(q);
        const customers = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Customer));

        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        return { customers, lastDoc: lastVisible };
    } catch (error) {
        console.error('Error getting paginated customers by name (case-insensitive):', error);
        // Fallback to the previous method if lowercase fields don't exist
        return getCustomersPaginatedByName(searchTerm, pageSize, lastDoc);
    }
};

// Check if a customer exists by email
export const checkCustomerExistsByEmail = async (email: string): Promise<boolean> => {
    try {
        const q = query(collection(db, 'customers'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error checking customer by email:', error);
        throw error;
    }
};

// Migration function for existing customers to add lowercase search fields
export const migrateExistingCustomers = async (): Promise<void> => {
    try {
        console.log('Starting customer migration for case-insensitive search...');
        const existingCustomers = await getCustomers();
        let migratedCount = 0;

        for (const customer of existingCustomers) {
            // Check if customer already has lowercase fields
            if (!customer.name_lower) {
                const customerRef = doc(db, 'customers', customer.id!);

                await updateDoc(customerRef, {
                    name_lower: customer.name.toLowerCase(),
                    email_lower: customer.email.toLowerCase(),
                    entity_name_lower: customer.entity_name.toLowerCase(),
                    updatedAt: Timestamp.now()
                });

                migratedCount++;
                console.log(`Migrated customer: ${customer.name}`);
            }
        }

        console.log(`Customer migration completed. Migrated ${migratedCount} customers.`);
    } catch (error) {
        console.error('Error during customer migration:', error);
        throw error;
    }
};

// Migration function for existing invoices (run once)
export const migrateExistingInvoices = async (): Promise<void> => {
    try {
        console.log('Starting invoice migration...');
        const existingInvoices = await getAllInvoices();
        let migratedCount = 0;

        for (const invoice of existingInvoices) {
            // Check if invoice already has stable ID structure
            if (!invoice.document_id && invoice.invoice_id) {
                // This is an old invoice that needs migration
                // Convert invoice_id to Firestore-safe format if it contains slashes
                const safeInvoiceId = invoice.invoice_id.includes('/')
                    ? invoiceNumberToDocId(invoice.invoice_id)
                    : invoice.invoice_id;
                const invoiceRef = doc(db, 'customer_invoices', safeInvoiceId);

                await updateDoc(invoiceRef, {
                    document_id: invoice.invoice_id, // Store original format with slashes
                    invoice_number: invoice.invoice_id, // Add new field with original format
                    original_invoice_number: invoice.invoice_id, // First invoice number
                    version: 1, // First version
                    is_latest: true, // This is the latest version
                    updatedAt: Timestamp.now()
                });

                migratedCount++;
                console.log(`Migrated invoice: ${invoice.invoice_id}`);
            }
        }

        console.log(`Migration completed. Migrated ${migratedCount} invoices.`);
    } catch (error) {
        console.error('Error during invoice migration:', error);
        throw error;
    }
};