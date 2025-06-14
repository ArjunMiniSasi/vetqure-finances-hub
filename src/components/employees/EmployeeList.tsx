import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmployeesPaginated, searchEmployeesPaginatedByName, createEmployeeWithFiles } from '@/services/employeeService';
import EmployeeForm from './EmployeeForm';
import EmployeeDetailsDialog from './EmployeeDetailsDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import GeneratePayslipDialog from './GeneratePayslipDialog';

const PAGE_SIZE = 10;

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [prevDocs, setPrevDocs] = useState<any[]>([]);
  const [isLastPage, setIsLastPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isPayslipDialogOpen, setIsPayslipDialogOpen] = useState(false);
  const [payslipEmployee, setPayslipEmployee] = useState<any>(null);

  const fetchPage = async (direction: 'next' | 'prev' = 'next', reset = false) => {
    setLoading(true);
    let newPrevDocs = reset ? [] : [...prevDocs];
    let localLastDoc = reset ? null : lastDoc;
    let result;
    if (searchTerm.trim() !== '') {
      if (direction === 'next') {
        if (!reset && localLastDoc) {
          newPrevDocs.push(localLastDoc);
          setCurrentPage((prev) => prev + 1);
        } else if (reset) {
          setCurrentPage(1);
        }
        result = await searchEmployeesPaginatedByName(searchTerm, PAGE_SIZE, reset ? null : lastDoc);
      } else if (direction === 'prev') {
        newPrevDocs.pop();
        const prevDoc = newPrevDocs.length > 0 ? newPrevDocs[newPrevDocs.length - 1] : null;
        result = await searchEmployeesPaginatedByName(searchTerm, PAGE_SIZE, prevDoc);
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }
    } else {
      if (direction === 'next') {
        if (!reset && localLastDoc) {
          newPrevDocs.push(localLastDoc);
          setCurrentPage((prev) => prev + 1);
        } else if (reset) {
          setCurrentPage(1);
        }
        result = await getEmployeesPaginated(PAGE_SIZE, reset ? null : lastDoc);
      } else if (direction === 'prev') {
        newPrevDocs.pop();
        const prevDoc = newPrevDocs.length > 0 ? newPrevDocs[newPrevDocs.length - 1] : null;
        result = await getEmployeesPaginated(PAGE_SIZE, prevDoc);
        setCurrentPage((prev) => Math.max(1, prev - 1));
      }
    }
    setEmployees(result.employees);
    setLastDoc(result.lastDoc);
    setPrevDocs(newPrevDocs);
    setIsLastPage(result.isLastPage);
    setLoading(false);
  };

  useEffect(() => {
    fetchPage('next', true);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setLastDoc(null);
    setPrevDocs([]);
    setCurrentPage(1);
    setIsLastPage(false);
    fetchPage('next', true);
    // eslint-disable-next-line
  }, [searchTerm]);

  const handleNextPage = () => {
    if (!isLastPage) fetchPage('next');
  };
  const handlePrevPage = () => {
    if (currentPage > 1) fetchPage('prev');
  };

  const handleAddEmployee = async (data: any) => {
    setIsSubmitting(true);
    try {
      console.log('Submitting employee data:', data);
      const employeeId = await createEmployeeWithFiles(data);
      console.log('Employee created successfully with ID:', employeeId);
      toast.success('Employee added successfully');
      setIsAddModalOpen(false);
      fetchPage('next', true);
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDetailsDialogOpen(true);
  };

  const handleOpenPayslipDialog = (employee: any) => {
    setPayslipEmployee(employee);
    setIsPayslipDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Employees</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>
      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAMS ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No employees found
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.vamsId}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.firstName} {emp.lastName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${emp.status === 'active' ? 'bg-green-100 text-green-800' : emp.status === 'terminated' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{emp.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.joiningDate ? new Date(emp.joiningDate.seconds ? emp.joiningDate.seconds * 1000 : emp.joiningDate).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                          <Button 
                            variant="ghost" 
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleViewDetails(emp)}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1"
                            onClick={() => handleOpenPayslipDialog(emp)}
                          >
                            <FileText className="w-4 h-4" />
                            Generate Document
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end items-center gap-2 p-4 border-t border-gray-200">
            <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>Previous</Button>
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <Button variant="outline" onClick={handleNextPage} disabled={isLastPage}>Next</Button>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-[50vw] max-w-[95vw] max-h-[80vh] flex flex-col p-0 rounded-xl shadow-xl">
          <div className="flex flex-col px-8 py-5 border-b">
            <DialogTitle className="text-2xl font-bold">Add New Employee</DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-1">Fill out the form to add a new employee. All fields marked * are required.</DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
            <EmployeeForm
              onSubmit={handleAddEmployee}
              isSubmitting={isSubmitting}
            />
          </div>
          <div className="flex justify-end gap-2 px-8 py-5 border-t bg-gray-50">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" form="employee-form" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="loader border-white border-2 border-t-blue-200 rounded-full w-4 h-4 animate-spin"></span>
              ) : null}
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <EmployeeDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        employee={selectedEmployee}
      />
      <GeneratePayslipDialog
        open={isPayslipDialogOpen}
        onOpenChange={setIsPayslipDialogOpen}
        employee={payslipEmployee}
      />
    </div>
  );
};

export default EmployeeList;
