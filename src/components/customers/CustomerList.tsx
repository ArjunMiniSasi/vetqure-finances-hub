import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Customer, addCustomer, getCustomers, updateCustomer } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';

const CustomerList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual' as 'individual' | 'business',
    status: 'active' as 'active' | 'inactive',
    renewal_date: null as Date | null
  });

  const getSubscriptionStatus = (renewalDate: Date | null): 'active' | 'expired' | 'pending' => {
    if (!renewalDate) return 'pending';
    const now = new Date();
    if (renewalDate < now) return 'expired';
    return 'active';
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customersData = await getCustomers();
      setCustomers(customersData);
    } catch (error) {
      toast.error('Failed to load customers');
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customerData = {
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        type: newCustomer.type,
        status: newCustomer.status,
        renewal_date: newCustomer.renewal_date ? Timestamp.fromDate(newCustomer.renewal_date) : null
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id!, customerData);
        toast.success('Customer updated successfully');
      } else {
        await addCustomer(customerData);
        toast.success('Customer added successfully');
      }
      setIsModalOpen(false);
      resetForm();
      loadCustomers();
    } catch (error) {
      toast.error(editingCustomer ? 'Failed to update customer' : 'Failed to add customer');
      console.error('Error:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      type: customer.type,
      status: customer.status,
      renewal_date: customer.renewal_date ? new Date(customer.renewal_date.toDate()) : null
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setNewCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      type: 'individual',
      status: 'active',
      renewal_date: null
    });
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader className="border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search customers..."
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const subscriptionStatus = getSubscriptionStatus(
                      customer.renewal_date ? customer.renewal_date.toDate() : null
                    );
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 capitalize">{customer.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              customer.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              subscriptionStatus === 'active'
                                ? 'bg-green-100 text-green-800'
                                : subscriptionStatus === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {subscriptionStatus}
                          </span>
                          {customer.renewal_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              Renews: {customer.renewal_date.toDate().toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleEdit(customer)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Customer Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newCustomer.type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value as 'individual' | 'business' })}
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newCustomer.status}
                  onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as 'active' | 'inactive' })}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal_date">Renewal Date</Label>
                <Input
                  id="renewal_date"
                  type="date"
                  value={newCustomer.renewal_date ? newCustomer.renewal_date.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const dateValue = e.target.value;
                    if (dateValue) {
                      const date = new Date(dateValue + 'T00:00:00');
                      if (!isNaN(date.getTime())) {
                        setNewCustomer({
                          ...newCustomer,
                          renewal_date: date
                        });
                      }
                    } else {
                      setNewCustomer({
                        ...newCustomer,
                        renewal_date: null
                      });
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {editingCustomer ? 'Update Customer' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerList; 