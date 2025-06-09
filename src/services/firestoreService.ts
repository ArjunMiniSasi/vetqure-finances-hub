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
    setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Types
export interface Customer {
    id?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    type: 'individual' | 'business';
    status: 'active' | 'inactive';
    renewal_date: Timestamp | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Invoice {
    id?: string;
    invoice_id?: string;
    customer_id: string;
    customer_name: string;
    date_created: Timestamp;
    due_date: Timestamp;
    status: 'paid' | 'sent' | 'draft' | 'overdue';
    total: number;
    items: InvoiceItem[];
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    currency: string;
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
}

export interface Receipt {
    id?: string;
    invoice_id: string;
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
}

// Customer Operations
export const addCustomer = async (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const now = Timestamp.now();
        const customerWithTimestamps = {
            ...customerData,
            renewal_date: customerData.renewal_date,
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
            updatedAt: now
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        throw error;
    }
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
        const customId = await generateCustomInvoiceId();
        const invoiceWithTimestamps = {
            ...invoiceData,
            invoice_id: customId,
            date_created: invoiceData.date_created,
            due_date: invoiceData.due_date,
            createdAt: now,
            updatedAt: now
        };
        await setDoc(doc(db, 'customer_invoices', customId), invoiceWithTimestamps);
        return customId;
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
        const now = new Date();
        const receiptWithTimestamps = {
            ...receiptData,
            createdAt: now,
            updatedAt: now
        };

        const docRef = await addDoc(collection(db, 'receipts'), receiptWithTimestamps);

        // Update invoice status to 'paid' if receipt is successful
        if (receiptData.status === 'successful') {
            const invoiceRef = doc(db, 'invoices', receiptData.invoice_id);
            await updateDoc(invoiceRef, {
                status: 'paid',
                updatedAt: now
            });
        }

        return docRef.id;
    } catch (error) {
        console.error('Error adding receipt:', error);
        throw error;
    }
};

export const getCustomerReceipts = async (customerId: string): Promise<Receipt[]> => {
    try {
        const q = query(
            collection(db, 'receipts'),
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