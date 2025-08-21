import React, { useState, useEffect } from 'react';
import { Bell, Lock, CreditCard, User, Building, Mail, Settings as SettingsIcon, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  browserNotifications: boolean;
  emailNotifications: boolean;
  emailRecipient: string;
  dailySummary: boolean;
  batchNotifications: boolean;
}

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    browserNotifications: true,
    emailNotifications: false,
    emailRecipient: '',
    dailySummary: false,
    batchNotifications: true,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
      
      // Validate email if email notifications are enabled
      if (settings.emailNotifications && !settings.emailRecipient) {
        toast({
          title: 'Email Required',
          description: 'Please enter an email address for email notifications.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Settings Saved',
        description: 'Your notification settings have been saved successfully.',
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (settings.browserNotifications) {
      if (Notification.permission === 'granted') {
        new Notification('Test Notification', {
          body: 'This is a test notification from VAMS Finance System.',
          icon: '/assets/vetqure.png',
        });
        toast({
          title: 'Test Sent',
          description: 'Test browser notification sent successfully.',
        });
      } else {
        toast({
          title: 'Permission Required',
          description: 'Please enable browser notifications in your browser settings.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Notifications Disabled',
        description: 'Please enable browser notifications to test.',
        variant: 'destructive',
      });
    }
  };

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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <Button onClick={handleSaveSettings} disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
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

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Browser Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="browser-notifications" className="text-base font-medium">
                  Browser Notifications
                </Label>
                <p className="text-sm text-gray-600">
                  Receive notifications in your browser for due date alerts
                </p>
              </div>
              <Switch
                id="browser-notifications"
                checked={settings.browserNotifications}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, browserNotifications: checked }))
                }
              />
            </div>
            
            {settings.browserNotifications && (
              <div className="ml-6 space-y-2">
                <Button variant="outline" size="sm" onClick={handleTestNotification}>
                  Test Browser Notification
                </Button>
                <p className="text-xs text-gray-500">
                  Current permission: {Notification.permission}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications" className="text-base font-medium">
                  Email Notifications
                </Label>
                <p className="text-sm text-gray-600">
                  Receive email alerts for due date notifications
                </p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings(prev => ({ ...prev, emailNotifications: checked }))
                }
              />
            </div>
            
            {settings.emailNotifications && (
              <div className="ml-6 space-y-4">
                <div>
                  <Label htmlFor="email-recipient">Email Address</Label>
                  <Input
                    id="email-recipient"
                    type="email"
                    placeholder="Enter email address"
                    value={settings.emailRecipient}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, emailRecipient: e.target.value }))
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="daily-summary" className="text-sm">
                      Daily Summary
                    </Label>
                    <p className="text-xs text-gray-600">
                      Receive a daily summary of all due date alerts
                    </p>
                  </div>
                  <Switch
                    id="daily-summary"
                    checked={settings.dailySummary}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, dailySummary: checked }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Batch Notifications */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="batch-notifications" className="text-base font-medium">
                Batch Notifications
              </Label>
              <p className="text-sm text-gray-600">
                Group multiple alerts into a single notification
              </p>
            </div>
            <Switch
              id="batch-notifications"
              checked={settings.batchNotifications}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, batchNotifications: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Notification Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">Due Date Alerts</h4>
              <p className="text-gray-600">
                You will receive notifications for vendor invoices that have due dates in the current month.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Overdue Alerts</h4>
              <p className="text-gray-600">
                Immediate notifications for invoices that have passed their due date.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Notification Frequency</h4>
              <p className="text-gray-600">
                To prevent spam, notifications for the same invoice are limited to once per hour.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
