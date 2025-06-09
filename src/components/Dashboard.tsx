
import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, FileText, Clock, Users } from 'lucide-react';
import MetricCard from './MetricCard';
import ChartCard from './ChartCard';
import RecentActivity from './RecentActivity';

const Dashboard: React.FC = () => {
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$12,345',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      title: 'Outstanding Invoices',
      value: '$3,456',
      change: '-5.2%',
      changeType: 'negative' as const,
      icon: FileText,
    },
    {
      title: 'Pending Payments',
      value: '8',
      change: '+2',
      changeType: 'positive' as const,
      icon: Clock,
    },
    {
      title: 'Active Clients',
      value: '24',
      change: '+3',
      changeType: 'positive' as const,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Financial Dashboard</h1>
        <p className="text-gray-600">Overview of VetQure's financial performance</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard />
        </div>
        <div>
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
