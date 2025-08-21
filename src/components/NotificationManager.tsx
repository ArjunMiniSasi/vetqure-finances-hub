import React, { useEffect, useState } from 'react';
import { DueDateNotificationService } from '@/services/dueDateNotificationService';
import { PushNotificationService } from '@/services/pushNotificationService';
import { EmailNotificationService } from '@/services/emailNotificationService';
import { DueDateAlert } from '@/services/dueDateNotificationService';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  emailEnabled: boolean;
  emailRecipient: string;
  browserNotificationsEnabled: boolean;
  dashboardAlertsEnabled: boolean;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string;
}

export const NotificationManager: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<DueDateAlert[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailEnabled: false,
    emailRecipient: '',
    browserNotificationsEnabled: false,
    dashboardAlertsEnabled: true,
    dailySummaryEnabled: false,
    dailySummaryTime: '09:00',
  });
  const { toast } = useToast();

  const dueDateService = new DueDateNotificationService();
  const pushNotificationService = new PushNotificationService();
  const emailNotificationService = new EmailNotificationService();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('notificationSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Request notification permission on component mount
    if (settings.browserNotificationsEnabled) {
      pushNotificationService.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Save settings to localStorage whenever they change
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  const startMonitoring = async () => {
    try {
      setIsMonitoring(true);
      
      // Start real-time monitoring
      dueDateService.monitorCurrentMonthDueDates((newAlerts) => {
        setAlerts(newAlerts);
        
        // Only include alerts with dueDate in current month and type 'services'
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const filterCurrentMonth = (alerts: DueDateAlert[]) =>
          alerts.filter(alert =>
            alert.dueDate &&
            alert.dueDate >= startOfMonth &&
            alert.dueDate <= endOfMonth 
          );

        const filteredAlerts = filterCurrentMonth(newAlerts);

        // Send notifications based on settings
        if (settings.dashboardAlertsEnabled) {
          // Dashboard alerts are handled by the DueDateAlerts component
          console.log('Dashboard alerts updated:', filteredAlerts.length);
        }

        if (settings.browserNotificationsEnabled && filteredAlerts.length > 0) {
          // Send browser notifications for new alerts
          filteredAlerts.forEach(alert => {
            pushNotificationService.showDueDateNotification(alert);
          });
        }

        if (settings.emailEnabled && settings.emailRecipient && filteredAlerts.length > 0) {
          // Send email notifications
          if (filteredAlerts.length === 1) {
            emailNotificationService.sendDueDateAlert(filteredAlerts[0], settings.emailRecipient);
          } else {
            emailNotificationService.sendBatchDueDateAlerts(filteredAlerts, settings.emailRecipient);
          }
        }
      });

      toast({
        title: "Monitoring Started",
        description: "Real-time due date monitoring is now active",
      });
    } catch (error) {
      console.error('Error starting monitoring:', error);
      toast({
        title: "Error",
        description: "Failed to start monitoring",
        variant: "destructive",
      });
      setIsMonitoring(false);
    }
  };

  const stopMonitoring = async () => {
    try {
      dueDateService.cleanup();
      setIsMonitoring(false);
      setAlerts([]);
      
      toast({
        title: "Monitoring Stopped",
        description: "Real-time due date monitoring has been stopped",
      });
    } catch (error) {
      console.error('Error stopping monitoring:', error);
      toast({
        title: "Error",
        description: "Failed to stop monitoring",
        variant: "destructive",
      });
    }
  };

  const sendTestNotification = async () => {
    try {
      if (settings.browserNotificationsEnabled) {
        const testAlert: DueDateAlert = {
          id: 'test-001',
          invoiceId: 'TEST-001',
          vendorName: 'Test Vendor',
          amount: 1000,
          currency: 'INR',
          dueDate: new Date(),
          daysUntilDue: 5,
          isOverdue: false,
        };
        
        pushNotificationService.showDueDateNotification(testAlert);
      }

      if (settings.emailEnabled && settings.emailRecipient) {
        const testAlert: DueDateAlert = {
          id: 'test-001',
          invoiceId: 'TEST-001',
          vendorName: 'Test Vendor',
          amount: 1000,
          currency: 'INR',
          dueDate: new Date(),
          daysUntilDue: 5,
          isOverdue: false,
        };

        await emailNotificationService.sendDueDateAlert(testAlert, settings.emailRecipient);
        toast({
          title: "Test Email Sent",
          description: `Test email sent to ${settings.emailRecipient}`,
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Manager</h2>
          <p className="text-muted-foreground">
            Manage real-time notifications for invoice due dates
          </p>
        </div>
        
        <div className="flex gap-2">
          {!isMonitoring ? (
            <button
              onClick={startMonitoring}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Start Monitoring
            </button>
          ) : (
            <button
              onClick={stopMonitoring}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Stop Monitoring
            </button>
          )}
          
          <button
            onClick={sendTestNotification}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Send Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Email Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Email Notifications</h3>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => updateSettings({ emailEnabled: e.target.checked })}
                className="rounded"
              />
              <span>Enable Email Notifications</span>
            </label>
          </div>

          {settings.emailEnabled && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Email Recipient
              </label>
              <input
                type="email"
                value={settings.emailRecipient}
                onChange={(e) => updateSettings({ emailRecipient: e.target.value })}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.dailySummaryEnabled}
                onChange={(e) => updateSettings({ dailySummaryEnabled: e.target.checked })}
                className="rounded"
              />
              <span>Daily Summary Email</span>
            </label>
          </div>

          {settings.dailySummaryEnabled && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Summary Time
              </label>
              <input
                type="time"
                value={settings.dailySummaryTime}
                onChange={(e) => updateSettings({ dailySummaryTime: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Browser Notification Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Browser Notifications</h3>
          
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.browserNotificationsEnabled}
                onChange={(e) => updateSettings({ browserNotificationsEnabled: e.target.checked })}
                className="rounded"
              />
              <span>Enable Browser Notifications</span>
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.dashboardAlertsEnabled}
                onChange={(e) => updateSettings({ dashboardAlertsEnabled: e.target.checked })}
                className="rounded"
              />
              <span>Show Dashboard Alerts</span>
            </label>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Status</h3>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Monitoring:</span>{' '}
            <span className={isMonitoring ? 'text-green-600' : 'text-red-600'}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </span>
          </p>
          <p>
            <span className="font-medium">Active Alerts:</span> {alerts.length}
          </p>
          <p>
            <span className="font-medium">Email:</span>{' '}
            <span className={settings.emailEnabled ? 'text-green-600' : 'text-red-600'}>
              {settings.emailEnabled ? 'Enabled' : 'Disabled'}
            </span>
            {settings.emailEnabled && settings.emailRecipient && (
              <span className="text-gray-600"> ({settings.emailRecipient})</span>
            )}
          </p>
          <p>
            <span className="font-medium">Browser Notifications:</span>{' '}
            <span className={settings.browserNotificationsEnabled ? 'text-green-600' : 'text-red-600'}>
              {settings.browserNotificationsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}; 