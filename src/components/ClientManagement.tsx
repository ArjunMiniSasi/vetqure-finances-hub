
import React, { useState } from 'react';
import { Plus, Search, Mail, Phone, MapPin } from 'lucide-react';

const ClientManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const clients = [
    {
      id: 1,
      name: 'Dr. Sarah Smith',
      email: 'sarah.smith@email.com',
      phone: '+1 (555) 123-4567',
      address: '123 Main St, City, ST 12345',
      status: 'Active',
      renewalDate: '2024-06-15',
      totalInvoices: 12,
      totalAmount: '$15,230.50',
    },
    {
      id: 2,
      name: 'Pet Care Clinic',
      email: 'info@petcareclinic.com',
      phone: '+1 (555) 987-6543',
      address: '456 Oak Ave, City, ST 12345',
      status: 'Active',
      renewalDate: '2024-08-20',
      totalInvoices: 8,
      totalAmount: '$9,450.00',
    },
    {
      id: 3,
      name: 'Animal Hospital',
      email: 'contact@animalhospital.com',
      phone: '+1 (555) 456-7890',
      address: '789 Pine Rd, City, ST 12345',
      status: 'Inactive',
      renewalDate: '2024-03-10',
      totalInvoices: 15,
      totalAmount: '$22,180.75',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Client Management</h1>
          <p className="text-gray-600">Manage your clients and their subscriptions</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{client.name}</h3>
                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                  client.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {client.status}
                </span>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {client.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                {client.email}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                {client.phone}
              </div>
              <div className="flex items-start text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                <span className="break-words">{client.address}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Invoices</span>
                  <div className="font-semibold text-gray-900">{client.totalInvoices}</div>
                </div>
                <div>
                  <span className="text-gray-500">Total Amount</span>
                  <div className="font-semibold text-gray-900">{client.totalAmount}</div>
                </div>
              </div>
              <div className="mt-3">
                <span className="text-gray-500 text-sm">Renewal Date</span>
                <div className="font-semibold text-gray-900">{client.renewalDate}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientManagement;
