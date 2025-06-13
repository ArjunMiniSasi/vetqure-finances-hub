import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, endBefore, getDocs, QueryDocumentSnapshot, DocumentData, startAt, endAt } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Vendor, VendorDocument, VendorFormData } from '@/types/vendor';
import { vendorToDocument } from '@/utils/vendorUtils';

const VENDORS_COLLECTION = 'vendors';

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
    const vendorRef = doc(db, VENDORS_COLLECTION, id);
    const updateData = {
        ...data,
        name_lower: data.name ? data.name.toLowerCase() : undefined,
        updatedAt: new Date(),
    };
    const docData = vendorToDocument(updateData as unknown as Vendor);
    await updateDoc(vendorRef, docData as { [key: string]: any });
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