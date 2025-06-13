import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BadgeCheck, Mail, Phone, StickyNote, FileText, MapPin, Calendar, User, Building2 } from 'lucide-react';

interface EmployeeDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: any;
}

const EmployeeDetailsDialog: React.FC<EmployeeDetailsDialogProps> = ({ open, onOpenChange, employee }) => {
  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            Employee Details
            {employee.status === 'active' && (
              <span className="ml-2"><BadgeCheck className="text-green-500 w-5 h-5" /></span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="rounded-lg border bg-white shadow-sm divide-y divide-gray-100">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">VAMS ID</div>
                <div className="font-semibold text-gray-900 text-base">{employee.vamsId}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Role</div>
                <div className="font-medium text-gray-900 text-base">{employee.role}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${
                  employee.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : employee.status === 'terminated'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <BadgeCheck className="w-4 h-4" />
                  {employee.status}
                </span>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Joining Date</div>
                <div className="font-medium text-gray-900 text-base">
                  {employee.joiningDate ? new Date(employee.joiningDate.seconds ? employee.joiningDate.seconds * 1000 : employee.joiningDate).toLocaleDateString() : '-'}
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50">
              <div>
                <div className="text-xs text-gray-500 mb-1">Name</div>
                <div className="font-medium text-gray-900 text-base">{employee.firstName} {employee.lastName}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Age</div>
                <div className="font-medium text-gray-900 text-base">{employee.age}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Gender</div>
                <div className="font-medium text-gray-900 text-base">{employee.gender}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Salary</div>
                <div className="font-medium text-gray-900 text-base">₹{employee.salary}</div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Father's Contact</div>
                  <div className="font-medium text-gray-900 text-base">{employee.fatherContact}</div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Father's Name</div>
                <div className="font-medium text-gray-900 text-base">{employee.fatherName}</div>
              </div>
            </div>

            {/* Address Information */}
            <div className="p-6 bg-gray-50">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Address</div>
                  <div className="font-medium text-gray-900 text-base whitespace-pre-line">{employee.address}</div>
                  <div className="mt-2 text-sm text-gray-600">
                    {employee.city}, {employee.state} - {employee.pinCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Aadhar Scan</div>
                  {employee.aadharUrl ? (
                    <a href={employee.aadharUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
                  ) : (
                    <span className="text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">PAN Scan</div>
                  {employee.panUrl ? (
                    <a href={employee.panUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Document</a>
                  ) : (
                    <span className="text-gray-400">Not uploaded</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {employee.notes && (
              <div className="p-6 flex items-start gap-2 bg-gray-50 rounded-b-lg">
                <StickyNote className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Notes</div>
                  <div className="font-medium text-gray-900 text-base whitespace-pre-line">{employee.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeDetailsDialog;
