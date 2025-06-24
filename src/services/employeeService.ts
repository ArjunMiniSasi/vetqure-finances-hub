import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy, limit, startAfter, getDocs, QueryDocumentSnapshot, DocumentData, startAt, endAt } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Employee, EmployeeFormData } from '@/types/employee';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const EMPLOYEES_COLLECTION = 'vetqure_team';

// Helper function to remove undefined and null values from an object
const cleanObject = (obj: any): any => {
    return Object.entries(obj).reduce((acc, [key, value]) => {
        // Skip undefined and null values
        if (value === undefined || value === null) {
            return acc;
        }
        // If it's an object (but not a File or Date), recursively clean it
        if (typeof value === 'object' && !(value instanceof File) && !(value instanceof Date)) {
            const cleaned = cleanObject(value);
            // Only add if the cleaned object is not empty
            if (Object.keys(cleaned).length > 0) {
                acc[key] = cleaned;
            }
        } else {
            acc[key] = value;
        }
        return acc;
    }, {} as any);
};

export const createEmployee = async (data: EmployeeFormData & { staffId: string }): Promise<string> => {
    try {
        const now = new Date();
        const employeeData = {
            ...data,
            createdAt: now,
            updatedAt: now,
        };
        const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), employeeData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating employee:', error);
        throw new Error('Failed to create employee');
    }
};

export const updateEmployee = async (id: string, data: Partial<EmployeeFormData>): Promise<void> => {
    try {
        const employeeRef = doc(db, EMPLOYEES_COLLECTION, id);
        const updateData = {
            ...data,
            updatedAt: new Date(),
        };
        await updateDoc(employeeRef, updateData as { [key: string]: any });
    } catch (error) {
        console.error('Error updating employee:', error);
        throw new Error('Failed to update employee');
    }
};

export const deleteEmployee = async (id: string): Promise<void> => {
    try {
        const employeeRef = doc(db, EMPLOYEES_COLLECTION, id);
        await deleteDoc(employeeRef);
    } catch (error) {
        console.error('Error deleting employee:', error);
        throw new Error('Failed to delete employee');
    }
};

export const getEmployeesPaginated = async (
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
) => {
    try {
        const employeesRef = collection(db, EMPLOYEES_COLLECTION);
        let q = query(employeesRef, orderBy('createdAt', 'desc'), limit(pageSize));
        if (lastDoc) {
            q = query(employeesRef, orderBy('createdAt', 'desc'), startAfter(lastDoc), limit(pageSize));
        }
        const snapshot = await getDocs(q);
        const employees = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) }) as Employee);
        return {
            employees,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            isLastPage: snapshot.docs.length < pageSize,
        };
    } catch (error) {
        console.error('Error getting paginated employees:', error);
        throw new Error('Failed to fetch employees');
    }
};

export const searchEmployeesPaginatedByName = async (
    searchTerm: string,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot<DocumentData> | null
) => {
    try {
        // For now, fetch a page and filter client-side (Firestore text search is limited)
        const employeesRef = collection(db, EMPLOYEES_COLLECTION);
        let q = query(
            employeesRef,
            orderBy('createdAt', 'desc'),
            limit(pageSize)
        );
        if (lastDoc) {
            q = query(
                employeesRef,
                orderBy('createdAt', 'desc'),
                startAfter(lastDoc),
                limit(pageSize)
            );
        }
        const snapshot = await getDocs(q);
        let employees = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as object) }) as Employee);

        // Filter employees by firstName or lastName
        employees = employees.filter((employee) =>
            employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return {
            employees,
            lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
            isLastPage: snapshot.docs.length < pageSize,
        };
    } catch (error) {
        console.error('Error searching employees:', error);
        throw new Error('Failed to search employees');
    }
};

export const createEmployeeWithFiles = async (data: any) => {
    try {
        const storage = getStorage();
        // Generate VAMS ID if not provided
        let vamsId = data.vamsId;
        if (!vamsId) {
            // Simple VAMS ID: VAMS + timestamp (customize as needed)
            vamsId = 'VAMS' + Date.now();
        }

        // Upload Aadhar
        let aadharUrl = '';
        if (data.aadharFile) {
            try {
                const aadharRef = ref(storage, `vetqure_team/${vamsId}/aadhar_scan.${data.aadharFile.name.split('.').pop()}`);
                await uploadBytes(aadharRef, data.aadharFile);
                aadharUrl = await getDownloadURL(aadharRef);
            } catch (error) {
                console.error('Error uploading Aadhar:', error);
                throw new Error('Failed to upload Aadhar document');
            }
        }

        // Upload PAN
        let panUrl = '';
        if (data.panFile) {
            try {
                const panRef = ref(storage, `vetqure_team/${vamsId}/pan_scan.${data.panFile.name.split('.').pop()}`);
                await uploadBytes(panRef, data.panFile);
                panUrl = await getDownloadURL(panRef);
            } catch (error) {
                console.error('Error uploading PAN:', error);
                throw new Error('Failed to upload PAN document');
            }
        }

        // Prepare Firestore data
        const employeeData = {
            ...data,
            vamsId,
            aadharUrl: aadharUrl || null,  // Use null instead of empty string
            panUrl: panUrl || null,        // Use null instead of empty string
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Remove file objects and undefined values before saving to Firestore
        const cleanedData = cleanObject({
            ...employeeData,
            aadharFile: undefined,  // Remove file objects
            panFile: undefined,     // Remove file objects
        });

        console.log('Cleaned data for Firestore:', cleanedData);

        // Add to Firestore
        const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), cleanedData);
        return docRef.id;
    } catch (error) {
        console.error('Error creating employee with files:', error);
        throw error;
    }
}; 