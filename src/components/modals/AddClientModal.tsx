
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: any) => void;
}

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    subscriptionStatus: 'active',
    renewalDate: ''
  });

  const handleSave = () => {
    onSave(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      subscriptionStatus: 'active',
      renewalDate: ''
    });
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b border-gray-200 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-semibold text-gray-900">Add New Client</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Client Name</Label>
              <Input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1 h-12"
                placeholder="Enter client name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1 h-12"
                placeholder="client@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1 h-12"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="subscriptionStatus">Subscription Status</Label>
              <select
                id="subscriptionStatus"
                className="w-full mt-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-12"
                value={formData.subscriptionStatus}
                onChange={(e) => handleInputChange('subscriptionStatus', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="mt-1 h-12"
              placeholder="123 Main St, City, State 12345"
            />
          </div>

          <div>
            <Label htmlFor="renewalDate">Renewal Date</Label>
            <Input
              type="date"
              id="renewalDate"
              value={formData.renewalDate}
              onChange={(e) => handleInputChange('renewalDate', e.target.value)}
              className="mt-1 h-12"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-white p-6 border-t border-gray-200 flex space-x-4 rounded-b-2xl">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 h-12"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            Save Client
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddClientModal;
