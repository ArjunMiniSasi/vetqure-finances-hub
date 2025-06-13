import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const STATUS_OPTIONS = ['active', 'inactive', 'terminated'];
const ROLE_OPTIONS = [
  'Veterinarian',
  'Veterinary Technician',
  'Lab Technician',
  'Software Developer',
  'Marketing Specialist',
  'Content Writer',
  'Sales Executive',
  'Customer Support',
  'Product Manager',
  'Operations Manager',
  'HR Manager',
  'Finance Manager',
  'Data Analyst',
  'Field Service Engineer',
  'Inventory Manager',
  'Research Scientist',
  'QA Specialist',
  'IT Support',
  'Business Development',
  'Medical Transcriptionist',
  'Animal Caretaker',
];

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  age: string;
  gender: string;
  role: string;
  vamsId: string;
  address: string;
  state: string;
  city: string;
  pinCode: string;
  aadharFile: File | null;
  panFile: File | null;
  fatherName: string;
  fatherContact: string;
  salary: string;
  joiningDate: string;
  status: 'active' | 'inactive';
  notes: string;
}

const EmployeeForm = ({ initialData = {}, onSubmit, isSubmitting }: {
  initialData?: Partial<EmployeeFormData>;
  onSubmit: (data: EmployeeFormData) => void;
  isSubmitting?: boolean;
}) => {
  const [form, setForm] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    role: '',
    vamsId: '',
    address: '',
    state: '',
    city: '',
    pinCode: '',
    aadharFile: null,
    panFile: null,
    fatherName: '',
    fatherContact: '',
    salary: '',
    joiningDate: '',
    status: 'active',
    notes: '',
    ...initialData,
  });
  const [roleSearch, setRoleSearch] = useState('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleInputRef = useRef<HTMLInputElement>(null);
  const filteredRoles = ROLE_OPTIONS.filter(role => role.toLowerCase().includes(roleSearch.toLowerCase()));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setForm(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a clean copy of the form data
    const formData = {
      ...form,
      // Convert empty strings to null for optional fields
      notes: form.notes || null,
      aadharFile: form.aadharFile || null,
      panFile: form.panFile || null,
    };

    // Log the data being submitted
    console.log('Submitting form data:', formData);
    
    onSubmit(formData);
  };

  return (
    <form id="employee-form" onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-xl">
      {/* Row 1: Personal Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label>First Name</Label>
          <Input name="firstName" value={form.firstName} onChange={handleChange} required />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input name="lastName" value={form.lastName} onChange={handleChange} required />
        </div>
        <div>
          <Label>Age</Label>
          <Input name="age" type="number" value={form.age} onChange={handleChange} required />
        </div>
        <div>
          <Label>Gender</Label>
          <select name="gender" value={form.gender} onChange={handleChange} required className="w-full rounded-md border border-gray-300 px-3 py-2">
            <option value="">Select</option>
            {GENDER_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      </div>
      {/* Row 2: Job Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="col-span-1 lg:col-span-2">
          <Label>Role</Label>
          <div className="relative">
            <Input
              name="role"
              ref={roleInputRef}
              value={roleSearch || form.role}
              onChange={e => {
                setRoleSearch(e.target.value);
                setRoleDropdownOpen(true);
                setForm(prev => ({ ...prev, role: '' }));
              }}
              onFocus={() => setRoleDropdownOpen(true)}
              onBlur={() => setTimeout(() => setRoleDropdownOpen(false), 100)}
              placeholder="Search or select role..."
              autoComplete="off"
              required
            />
            {roleDropdownOpen && filteredRoles.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                {filteredRoles.map((role) => (
                  <div
                    key={role}
                    className={`px-3 py-2 cursor-pointer hover:bg-blue-100 ${form.role === role ? 'bg-blue-50' : ''}`}
                    onMouseDown={() => {
                      setForm(prev => ({ ...prev, role }));
                      setRoleSearch(role);
                      setRoleDropdownOpen(false);
                    }}
                  >
                    {role}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label>VAMS ID</Label>
          <Input name="vamsId" value={form.vamsId} onChange={handleChange} required />
        </div>
        <div>
          <Label>Salary</Label>
          <Input name="salary" type="number" value={form.salary} onChange={handleChange} required />
        </div>
        <div>
          <Label>Status</Label>
          <div className="flex items-center gap-6 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={form.status === 'active'}
                onChange={handleChange}
                className="accent-blue-600"
                required
              />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="inactive"
                checked={form.status === 'inactive'}
                onChange={handleChange}
                className="accent-blue-600"
                required
              />
              <span>Inactive</span>
            </label>
          </div>
        </div>
      </div>
      {/* Row 3: Location & Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <Label>State</Label>
          <Input name="state" value={form.state} onChange={handleChange} required />
        </div>
        <div>
          <Label>City</Label>
          <Input name="city" value={form.city} onChange={handleChange} required />
        </div>
        <div>
          <Label>PIN Code</Label>
          <Input name="pinCode" value={form.pinCode} onChange={handleChange} required />
        </div>
        <div>
          <Label>Joining Date</Label>
          <Input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} required />
        </div>
      </div>
      {/* Row 4: Father's Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Father's Name</Label>
          <Input name="fatherName" value={form.fatherName} onChange={handleChange} required />
        </div>
        <div>
          <Label>Father's Contact</Label>
          <Input name="fatherContact" value={form.fatherContact} onChange={handleChange} required />
        </div>
      </div>
      {/* Address: Full width */}
      <div>
        <Label>Address</Label>
        <Textarea name="address" value={form.address} onChange={handleChange} required />
      </div>
      {/* Documents: Aadhar & PAN side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Aadhar Scan (PDF/Image)</Label>
          <Input name="aadharFile" type="file" accept="application/pdf,image/*" onChange={handleFileChange} />
        </div>
        <div>
          <Label>PAN Scan (PDF/Image)</Label>
          <Input name="panFile" type="file" accept="application/pdf,image/*" onChange={handleFileChange} />
        </div>
      </div>
      {/* Notes: Full width */}
      <div>
        <Label>Notes</Label>
        <Textarea name="notes" value={form.notes} onChange={handleChange} />
      </div>
    </form>
  );
};

export default EmployeeForm;
