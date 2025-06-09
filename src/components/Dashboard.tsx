import React from 'react';
import { BarChart3, DollarSign, Users, FileText } from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    {
      name: 'Total Revenue',
      value: '$45,231.89',
      change: '+20.1%',
      icon: DollarSign,
    },
    {
      name: 'Active Clients',
      value: '2,338',
      change: '+15.3%',
      icon: Users,
    },
    {
      name: 'Pending Invoices',
      value: '12',
      change: '-2.5%',
      icon: FileText,
    },
    {
      name: 'Monthly Growth',
      value: '+12.5%',
      change: '+4.3%',
      icon: BarChart3,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
            >
              <dt>
                <div className="absolute rounded-lg bg-blue-500 p-3">
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <p
                  className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.change.startsWith('+')
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </p>
              </dd>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="mt-6 flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((item) => (
                <li key={item} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        New client registration
                      </p>
                      <p className="truncate text-sm text-gray-500">
                        2 hours ago
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Completed
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Create Invoice
            </button>
            <button className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Add Client
            </button>
            <button className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Generate Report
            </button>
            <button className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              View Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
