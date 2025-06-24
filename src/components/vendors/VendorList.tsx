import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { collection, query, orderBy, onSnapshot, limit, startAfter, endBefore, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Vendor, VendorType, VendorDocument } from '@/types/vendor';
import { documentToVendor } from '@/utils/vendorUtils';
import VendorForm from './VendorForm';
import { useToast } from '@/components/ui/use-toast';
import { createVendor, updateVendor, searchVendorsPaginatedByName, getVendorsPaginated } from '@/services/vendorService';
import VendorDetailsDialog from './VendorDetailsDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PAGE_SIZE = 10;

const VendorList: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [prevDocs, setPrevDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [isLastPage, setIsLastPage] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const { toast } = useToast();

  // Fetch paginated vendors
  const fetchVendors = async (direction: 'next' | 'prev' = 'next', reset = false) => {
    setIsLoading(true);
    try {
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
          result = await searchVendorsPaginatedByName(searchTerm, PAGE_SIZE, reset ? null : lastDoc);
        } else if (direction === 'prev') {
          newPrevDocs.pop();
          const prevDoc = newPrevDocs.length > 0 ? newPrevDocs[newPrevDocs.length - 1] : null;
          result = await searchVendorsPaginatedByName(searchTerm, PAGE_SIZE, prevDoc);
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
          result = await getVendorsPaginated(PAGE_SIZE, reset ? null : lastDoc, 'next');
        } else if (direction === 'prev') {
          newPrevDocs.pop();
          const prevDoc = newPrevDocs.length > 0 ? newPrevDocs[newPrevDocs.length - 1] : null;
          result = await getVendorsPaginated(PAGE_SIZE, prevDoc, 'next');
          setCurrentPage((prev) => Math.max(1, prev - 1));
        } else {
          setCurrentPage(1);
          result = await getVendorsPaginated(PAGE_SIZE, null, 'init');
        }
      }
      setVendors(result.vendors);
      setLastDoc(result.lastDoc);
      setPrevDocs(newPrevDocs);
      setIsLastPage(result.isLastPage);
    } catch (error) {
      setVendors([]);
      setIsLastPage(true);
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, fetch first page
  useEffect(() => {
    fetchVendors('next', true);
    // eslint-disable-next-line
  }, []);

  // On search term change, reset pagination and fetch first page of search results
  useEffect(() => {
    setLastDoc(null);
    setPrevDocs([]);
    setCurrentPage(1);
    setIsLastPage(false);
    fetchVendors('next', true);
    // eslint-disable-next-line
  }, [searchTerm]);

  const handleNextPage = () => {
    if (!isLastPage) {
      fetchVendors('next');
    }
  };
  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchVendors('prev');
    }
  };

  const handleAddVendor = async (data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsAddLoading(true);
    try {
      await createVendor(data);
      setIsAddModalOpen(false);
      // Refresh the vendors list to show the new vendor
      fetchVendors('next', true);
      toast({
        title: 'Success',
        description: 'Vendor added successfully',
      });
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to add vendor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditVendor = async (data: Partial<Vendor>) => {
    if (!editVendor) return;
    console.log('VendorList: Starting edit vendor process');
    console.log('VendorList: Original vendor data:', editVendor);
    console.log('VendorList: Edit vendor data:', data);
    console.log('VendorList: Edit vendor ID:', editVendor.id);
    
    setIsEditLoading(true);
    try {
      // Only include fields that have changed
      const changedFields = Object.entries(data).reduce((acc, [key, value]) => {
        if (value !== editVendor[key as keyof Vendor]) {
          acc[key] = value;
        }
        return acc;
      }, {} as Record<string, any>);

      console.log('VendorList: Changed fields:', changedFields);
      
      if (Object.keys(changedFields).length === 0) {
        console.log('VendorList: No changes detected');
        setIsEditOpen(false);
        setEditVendor(null);
        return;
      }

      await updateVendor(editVendor.id, changedFields);
      console.log('VendorList: Vendor updated successfully');
      setIsEditOpen(false);
      setEditVendor(null);
      // Refresh the vendors list to show updated data
      await fetchVendors('next', true);
      toast({
        title: 'Success',
        description: 'Vendor details updated successfully',
      });
    } catch (error) {
      console.error('VendorList: Error updating vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vendor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsEditLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Vendors</h1>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search vendors..."
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
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No vendors found
                      </td>
                    </tr>
                  ) : (
                    vendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                          {vendor.gstNumber && (
                            <div className="text-sm text-gray-500">GST: {vendor.gstNumber}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {vendor.email && (
                            <div className="text-sm text-gray-900">{vendor.email}</div>
                          )}
                          {vendor.phone && (
                            <div className="text-sm text-gray-500">{vendor.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              vendor.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {vendor.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                          <Button variant="ghost" className="text-blue-600 hover:text-blue-900" onClick={() => { setSelectedVendor(vendor); setIsDetailsOpen(true); }}>
                            View Details
                          </Button>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-green-600 hover:text-green-900" onClick={() => { setEditVendor(vendor); setIsEditOpen(true); }} aria-label="Edit Details">
                                  <Pencil className="w-5 h-5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Details</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex justify-end items-center gap-2 p-4 border-t border-gray-200">
            <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>
              Previous
            </Button>
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <Button variant="outline" onClick={handleNextPage} disabled={isLastPage}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <VendorForm
            onSubmit={handleAddVendor}
            onCancel={() => setIsAddModalOpen(false)}
            isSubmitting={isAddLoading}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) setEditVendor(null); }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Vendor Details</DialogTitle>
          </DialogHeader>
          <VendorForm
            initialData={editVendor || undefined}
            onSubmit={handleEditVendor}
            onCancel={() => { setIsEditOpen(false); setEditVendor(null); }}
            isSubmitting={isEditLoading}
          />
        </DialogContent>
      </Dialog>
      <VendorDetailsDialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen} vendor={selectedVendor} />
    </div>
  );
};

export default VendorList; 