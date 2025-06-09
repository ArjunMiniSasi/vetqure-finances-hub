import React from 'react';
import { Plus, Search, Filter, Mail, Phone, MapPin } from 'lucide-react';

const ClientManagement: React.FC = () => {
  const clients = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@vetclinic.com',
      phone: '(555) 123-4567',
      location: 'New York, NY',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Dr. Michael Brown',
      email: 'michael.brown@vetclinic.com',
      phone: '(555) 234-5678',
      location: 'Los Angeles, CA',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Dr. Emily Davis',
      email: 'emily.davis@vetclinic.com',
      phone: '(555) 345-6789',
      location: 'Chicago, IL',
      status: 'Inactive',
    },
    // Add more sample clients as needed
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
        <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search clients..."
          />
        </div>
        <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <Filter className="w-4 h-4 mr-2" />
          Filter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.status === 'Active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {client.status}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center text-sm text-gray-500">
                <Mail className="w-4 h-4 mr-2" />
                {client.email}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Phone className="w-4 h-4 mr-2" />
                {client.phone}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="w-4 h-4 mr-2" />
                {client.location}
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                View Details
              </button>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientManagement;
