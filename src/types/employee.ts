export interface Employee {
    id: string;
    staffId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    status: 'active' | 'inactive' | 'terminated';
    joiningDate: Date;
    terminationDate?: Date;
    salary: number;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
    notes?: string;
}

export type EmployeeFormData = Omit<Employee, 'id' | 'staffId' | 'createdAt' | 'updatedAt'>;

export type EmployeeDocument = Omit<Employee, 'id'> & { createdAt: any; updatedAt: any; joiningDate: any; terminationDate?: any; }; 