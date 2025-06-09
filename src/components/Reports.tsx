import React from 'react';
import { Download, Calendar, BarChart2, PieChart, LineChart } from 'lucide-react';

const Reports: React.FC = () => {
  const reports = [
    {
      id: 1,
      title: 'Revenue Overview',
      type: 'line',
      icon: LineChart,
      description: 'Monthly revenue trends and analysis',
      lastUpdated: '2024-03-15',
    },
    {
      id: 2,
      title: 'Client Distribution',
      type: 'pie',
      icon: PieChart,
      description: 'Geographic distribution of clients',
      lastUpdated: '2024-03-14',
    },
    {
      id: 3,
      title: 'Invoice Status',
      type: 'bar',
      icon: BarChart2,
      description: 'Current status of all invoices',
      lastUpdated: '2024-03-13',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate and view financial reports and analytics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </button>
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <report.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-gray-900">
                  {report.title}
                </h3>
              </div>
              <button className="text-gray-400 hover:text-gray-500">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">{report.description}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-gray-500">Last updated</span>
              <span className="font-medium text-gray-900">{report.lastUpdated}</span>
            </div>
            <div className="mt-6">
              <button className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                View Report
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Download className="w-4 h-4 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Report exported
                  </p>
                  <p className="text-sm text-gray-500">
                    Revenue Overview - March 2024
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;
