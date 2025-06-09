
import React from 'react';
import { FileText, DollarSign, User, Clock } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'invoice',
      description: 'Invoice #001 sent to Dr. Smith',
      time: '2 hours ago',
      icon: FileText,
      iconColor: 'bg-blue-500',
    },
    {
      id: 2,
      type: 'payment',
      description: 'Payment received from Pet Clinic',
      time: '4 hours ago',
      icon: DollarSign,
      iconColor: 'bg-green-500',
    },
    {
      id: 3,
      type: 'client',
      description: 'New client registered: Animal Hospital',
      time: '1 day ago',
      icon: User,
      iconColor: 'bg-purple-500',
    },
    {
      id: 4,
      type: 'overdue',
      description: 'Invoice #003 is overdue',
      time: '2 days ago',
      icon: Clock,
      iconColor: 'bg-red-500',
    },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
        <p className="text-sm text-gray-600">Latest updates and actions</p>
      </div>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${activity.iconColor}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
