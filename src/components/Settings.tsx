import React from 'react';
import { Bell, Lock, CreditCard, User, Building, Mail } from 'lucide-react';

const Settings: React.FC = () => {
  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Settings',
      icon: User,
      description: 'Manage your personal information and preferences',
    },
    {
      id: 'notifications',
      title: 'Notification Preferences',
      icon: Bell,
      description: 'Configure how and when you receive notifications',
    },
    {
      id: 'security',
      title: 'Security Settings',
      icon: Lock,
      description: 'Manage your password and security preferences',
    },
    {
      id: 'billing',
      title: 'Billing Information',
      icon: CreditCard,
      description: 'Update your payment methods and billing details',
    },
    {
      id: 'organization',
      title: 'Organization Settings',
      icon: Building,
      description: 'Manage your organization details and preferences',
    },
    {
      id: 'email',
      title: 'Email Settings',
      icon: Mail,
      description: 'Configure email templates and preferences',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <section.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="ml-3 text-lg font-semibold text-gray-900">
                {section.title}
              </h3>
            </div>
            <p className="mt-2 text-sm text-gray-500">{section.description}</p>
            <div className="mt-6">
              <button className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Manage Settings
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Changes</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Profile updated
                  </p>
                  <p className="text-sm text-gray-500">
                    Personal information was modified
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

export default Settings;
