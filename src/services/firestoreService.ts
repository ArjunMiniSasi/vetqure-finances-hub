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
    status: 'pending' | 'completed' | 'cancelled';
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
    currency: string;
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

export const updateInvoiceStatus = async (invoiceId: string, status: 'pending' | 'completed' | 'cancelled') => {
    try {
        const invoiceRef = doc(db, 'customer_invoices', invoiceId);
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
        await deleteDoc(doc(db, 'customer_invoices', invoiceId));
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
        let q = query(
            collection(db, 'customers'),
            orderBy('name'),
            startAt(searchTerm),
            endAt(searchTerm + '\uf8ff'),
            limit(pageSize)
        );
        if (lastDoc) {
            q = query(
                collection(db, 'customers'),
                orderBy('name'),
                startAt(searchTerm),
                endAt(searchTerm + '\uf8ff'),
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
        console.error('Error getting paginated customers by name:', error);
        throw error;
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