import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, endBefore, getDocs, QueryDocumentSnapshot, DocumentData, startAt, endAt, where, writeBatch } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Vendor, VendorDocument, VendorFormData, VendorInvoice } from '@/types/vendor';
import { vendorToDocument } from '@/utils/vendorUtils';

const VENDORS_COLLECTION = 'vendors';
const VENDOR_INVOICES_COLLECTION = 'vendor_invoices';

export const createVendor = async (data: VendorFormData): Promise<string> => {
    const vendorData = {
        ...data,
        name_lower: data.name.toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const docData = vendorToDocument(vendorData as unknown as Vendor);
    const docRef = await addDoc(collection(db, VENDORS_COLLECTION), docData);
    return docRef.id;
};

export const updateVendor = async (id: string, data: Partial<VendorFormData>): Promise<void> => {
    console.log('vendorService: Starting updateVendor');
    console.log('vendorService: Vendor ID:', id);
    console.log('vendorService: Raw update data:', data);

    // Clean up undefined values
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
            acc[key] = value;
        }
        return acc;
    }, {} as Record<string, any>);

    console.log('vendorService: Cleaned update data:', cleanData);

    const vendorRef = doc(db, VENDORS_COLLECTION, id);
    const updateData = {
        ...cleanData,
        name_lower: data.name ? data.name.toLowerCase() : undefined,
        updatedAt: new Date(),
    };

    console.log('vendorService: Processed update data:', updateData);
    const docData = vendorToDocument(updateData as unknown as Vendor);
    console.log('vendorService: Final document data for update:', docData);

    try {
        await updateDoc(vendorRef, docData as { [key: string]: any });
        console.log('vendorService: Vendor updated successfully');
    } catch (error) {
        console.error('vendorService: Error updating vendor:', error);
        throw error;
    }
};

export const deleteVendor = async (id: string): Promise<void> => {
    const vendorRef = doc(db, VENDORS_COLLECTION, id);
    await deleteDoc(vendorRef);
};

export const getVendorsPaginated = async (
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null,
    direction: 'next' | 'prev' | 'init' = 'init'
) => {
    const vendorsRef = collection(db, VENDORS_COLLECTION);
    let q;
    if (direction === 'next' && lastDoc) {
        q = query(vendorsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else if (direction === 'prev' && lastDoc) {
        q = query(vendorsRef, orderBy('createdAt', 'desc'), endBefore(lastDoc), limit(pageSize));
    } else {
        q = query(vendorsRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    const vendors = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) }) as Vendor);
    return {
        vendors,
        firstDoc: snapshot.docs[0] || null,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        isLastPage: snapshot.docs.length < pageSize,
    };
};

export const searchVendorsPaginated = async (
    searchTerm: string,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null,
    direction: 'next' | 'prev' | 'init' = 'init'
) => {
    // For now, fetch a page and filter client-side (Firestore text search is limited)
    const vendorsRef = collection(db, VENDORS_COLLECTION);
    let q;
    if (direction === 'next' && lastDoc) {
        q = query(vendorsRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
    } else if (direction === 'prev' && lastDoc) {
        q = query(vendorsRef, orderBy('createdAt', 'desc'), endBefore(lastDoc), limit(pageSize));
    } else {
        q = query(vendorsRef, orderBy('createdAt', 'desc'), limit(pageSize));
    }
    const snapshot = await getDocs(q);
    let vendors = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) }) as Vendor);
    vendors = vendors.filter((vendor) =>
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return {
        vendors,
        firstDoc: snapshot.docs[0] || null,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        isLastPage: snapshot.docs.length < pageSize,
    };
};

export const searchVendorsPaginatedByName = async (
    searchTerm: string,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
) => {
    const vendorsRef = collection(db, VENDORS_COLLECTION);
    let q = query(
        vendorsRef,
        orderBy('name'),
        startAt(searchTerm),
        endAt(searchTerm + '\uf8ff'),
        limit(pageSize)
    );
    if (lastDoc) {
        q = query(
            vendorsRef,
            orderBy('name'),
            startAt(searchTerm),
            endAt(searchTerm + '\uf8ff'),
            startAfter(lastDoc),
            limit(pageSize)
        );
    }
    const snapshot = await getDocs(q);
    const vendors = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) }) as Vendor);
    return {
        vendors,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        isLastPage: snapshot.docs.length < pageSize,
    };
};

// Paginated Vendor Invoice Fetch
export const getVendorInvoicesPaginated = async (
    pageSize: number,
    lastDoc?: DocumentData // pass the last document from previous page for next page
): Promise<{ invoices: VendorInvoice[]; lastDoc: DocumentData | null }> => {
    try {
        let q = query(
            collection(db, VENDOR_INVOICES_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );
        if (lastDoc) {
            q = query(
                collection(db, VENDOR_INVOICES_COLLECTION),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(pageSize)
            );
        }
        const querySnapshot = await getDocs(q);
        const invoices = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as VendorInvoice));
        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        return { invoices, lastDoc: lastVisible };
    } catch (error) {
        console.error('Error getting paginated vendor invoices:', error);
        throw error;
    }
};

// Paginated Vendor Invoice Search by Vendor Name or Invoice ID
export const getVendorInvoicesPaginatedBySearch = async (
    searchTerm: string,
    pageSize: number,
    lastDoc?: DocumentData
): Promise<{ invoices: VendorInvoice[]; lastDoc: DocumentData | null }> => {
    try {
        // More efficient approach: Use Firestore's built-in querying
        // We'll create a compound index and use range queries where possible

        // First, try to find exact matches for invoice ID (most efficient)
        if (searchTerm.match(/^[A-Z0-9-]+$/)) {
            // Looks like an invoice ID - try exact match first
            let q = query(
                collection(db, VENDOR_INVOICES_COLLECTION),
                where('invoiceId', '==', searchTerm.toUpperCase()),
                orderBy('createdAt', 'desc'),
                limit(pageSize)
            );

            if (lastDoc) {
                q = query(
                    collection(db, VENDOR_INVOICES_COLLECTION),
                    where('invoiceId', '==', searchTerm.toUpperCase()),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastDoc),
                    limit(pageSize)
                );
            }

            const querySnapshot = await getDocs(q);
            const invoices = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as VendorInvoice));

            const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
            return { invoices, lastDoc: lastVisible };
        }

        // For vendor name searches, use a more targeted approach
        // Create a lowercase vendor name field for efficient searching
        const searchTermLower = searchTerm.toLowerCase();

        // Use range queries for vendor name (requires composite index)
        let q = query(
            collection(db, VENDOR_INVOICES_COLLECTION),
            where('vendorNameLower', '>=', searchTermLower),
            where('vendorNameLower', '<=', searchTermLower + '\uf8ff'),
            orderBy('vendorNameLower'),
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );

        if (lastDoc) {
            q = query(
                collection(db, VENDOR_INVOICES_COLLECTION),
                where('vendorNameLower', '>=', searchTermLower),
                where('vendorNameLower', '<=', searchTermLower + '\uf8ff'),
                orderBy('vendorNameLower'),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(pageSize)
            );
        }

        const querySnapshot = await getDocs(q);
        const invoices = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as VendorInvoice));

        const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
        return { invoices, lastDoc: lastVisible };

    } catch (error) {
        console.error('Error getting paginated vendor invoices by search:', error);

        // Fallback to the previous method if the efficient query fails
        // This might happen if indexes aren't set up yet
        console.warn('Falling back to client-side filtering for search');

        const fetchSize = pageSize * 2; // Reduced from 5x to 2x for cost efficiency

        let q = query(
            collection(db, VENDOR_INVOICES_COLLECTION),
            orderBy('createdAt', 'desc'),
            limit(fetchSize)
        );

        if (lastDoc) {
            q = query(
                collection(db, VENDOR_INVOICES_COLLECTION),
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(fetchSize)
            );
        }

        const querySnapshot = await getDocs(q);
        const allInvoices = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as VendorInvoice));

        const filteredInvoices = allInvoices.filter((invoice) =>
            (invoice.vendorName && invoice.vendorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (invoice.invoiceId && invoice.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const pageInvoices = filteredInvoices.slice(0, pageSize);

        let lastVisible = null;
        if (pageInvoices.length > 0) {
            const lastInvoiceId = pageInvoices[pageInvoices.length - 1].id;
            lastVisible = querySnapshot.docs.find(doc => doc.id === lastInvoiceId) || null;
        }

        const isLastPage = pageInvoices.length < pageSize || filteredInvoices.length <= pageSize;

        return {
            invoices: pageInvoices,
            lastDoc: isLastPage ? null : lastVisible
        };
    }
};

// Migration function to add vendorNameLower field to existing invoices
export const migrateVendorInvoicesForSearch = async (): Promise<void> => {
    try {
        console.log('Starting migration to add vendorNameLower field...');

        const invoicesRef = collection(db, VENDOR_INVOICES_COLLECTION);
        const q = query(invoicesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        let updatedCount = 0;
        const batch = writeBatch(db);
        const batchSize = 500; // Firestore batch limit

        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();

            // Only update if vendorNameLower doesn't exist
            if (data.vendorName && !data.vendorNameLower) {
                const docRef = doc(db, VENDOR_INVOICES_COLLECTION, docSnapshot.id);
                batch.update(docRef, {
                    vendorNameLower: data.vendorName.toLowerCase()
                });
                updatedCount++;

                // Commit batch when it reaches the limit
                if (updatedCount % batchSize === 0) {
                    await batch.commit();
                    console.log(`Migrated ${updatedCount} invoices...`);
                }
            }
        }

        // Commit any remaining updates
        if (updatedCount % batchSize !== 0) {
            await batch.commit();
        }

        console.log(`Migration completed. Updated ${updatedCount} invoices.`);
    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
}; 