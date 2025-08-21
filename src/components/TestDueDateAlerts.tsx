import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DueDateNotificationService, DueDateAlert } from '@/services/dueDateNotificationService';
import { PushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';

export const TestDueDateAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<DueDateAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);
  const { toast } = useToast();

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    addTestResult('Starting due date monitoring...');
    
    const service = new DueDateNotificationService();
    
    const unsubscribe = service.monitorCurrentMonthDueDates((currentAlerts) => {
      setAlerts(currentAlerts);
      addTestResult(`Found ${currentAlerts.length} invoices with due dates in current month`);
      
      if (currentAlerts.length > 0) {
        currentAlerts.forEach(alert => {
          addTestResult(`- ${alert.invoiceId} (${alert.vendorName}): Due ${alert.dueDate.toLocaleDateString()}, ${alert.daysUntilDue} days ${alert.isOverdue ? 'overdue' : 'left'}`);
        });
      }
    });

    // Store unsubscribe function
    (window as any).stopMonitoring = () => {
      unsubscribe();
      service.cleanup();
      setIsMonitoring(false);
      addTestResult('Monitoring stopped');
    };
  };

  const stopMonitoring = () => {
    if ((window as any).stopMonitoring) {
      (window as any).stopMonitoring();
    }
  };

  const testBrowserNotification = async () => {
    const pushService = new PushNotificationService();
    const granted = await pushService.requestPermission();
    
    if (granted) {
      // Create a test alert if no real alerts exist
      const testAlert: DueDateAlert = {
        id: 'test-notification',
        invoiceId: 'TEST-001',
        vendorName: 'Test Vendor',
        amount: 5000,
        currency: 'INR',
        dueDate: new Date(),
        daysUntilDue: 5,
        isOverdue: false,
      };
      
      pushService.showDueDateNotification(testAlert);
      addTestResult('Test browser notification sent successfully');
    } else {
      addTestResult('Failed to send browser notification - permission denied');
    }
  };

  const testBatchNotification = async () => {
    const pushService = new PushNotificationService();
    const granted = await pushService.requestPermission();
    
    if (granted) {
      if (alerts.length > 0) {
        // Only include alerts with dueDate in current month and type 'services'
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const currentMonthAlerts = alerts.filter(alert =>
          alert.dueDate &&
          alert.dueDate >= startOfMonth &&
          alert.dueDate <= endOfMonth 
        );
        
        pushService.showBatchNotification(currentMonthAlerts);
        addTestResult(`Batch notification sent for ${currentMonthAlerts.length} alerts`);
      } else {
        // Create test alerts for batch notification
        const testAlerts: DueDateAlert[] = [
          {
            id: 'test-1',
            invoiceId: 'TEST-001',
            vendorName: 'Test Vendor 1',
            amount: 3000,
            currency: 'INR',
            dueDate: new Date(),
            daysUntilDue: 3,
            isOverdue: false,
          },
          {
            id: 'test-2',
            invoiceId: 'TEST-002',
            vendorName: 'Test Vendor 2',
            amount: 2000,
            currency: 'INR',
            dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            daysUntilDue: 2,
            isOverdue: true,
          }
        ];
        
        pushService.showBatchNotification(testAlerts);
        addTestResult('Test batch notification sent with mock data');
      }
    } else {
      addTestResult('Failed to send batch notification - permission denied');
    }
  };

  const getCurrentMonthInfo = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      currentMonth: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
      startDate: startOfMonth.toLocaleDateString(),
      endDate: endOfMonth.toLocaleDateString(),
      daysInMonth: endOfMonth.getDate()
    };
  };

  const monthInfo = getCurrentMonthInfo();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Due Date Alert System Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Current Month Info</h3>
                <p>Month: {monthInfo.currentMonth}</p>
                <p>Start: {monthInfo.startDate}</p>
                <p>End: {monthInfo.endDate}</p>
                <p>Days: {monthInfo.daysInMonth}</p>
              </div>
              <div>
                <h3 className="font-semibold">Monitoring Status</h3>
                <Badge variant={isMonitoring ? "default" : "secondary"}>
                  {isMonitoring ? "Active" : "Inactive"}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Alerts Found: {alerts.length}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {!isMonitoring ? (
                <Button onClick={startMonitoring}>
                  Start Monitoring
                </Button>
              ) : (
                <Button onClick={stopMonitoring} variant="outline">
                  Stop Monitoring
                </Button>
              )}
              
              <Button onClick={testBrowserNotification} variant="outline">
                Test Browser Notification
              </Button>
              
              <Button onClick={testBatchNotification} variant="outline">
                Test Batch Notification
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Alerts ({alerts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{alert.invoiceId}</p>
                      <p className="text-sm text-gray-600">{alert.vendorName}</p>
                      <p className="text-sm">
                        Amount: ₹{alert.amount.toFixed(2)} | Due: {alert.dueDate.toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={alert.isOverdue ? "destructive" : "secondary"}>
                      {alert.isOverdue ? `${alert.daysUntilDue} days overdue` : `${alert.daysUntilDue} days left`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Start monitoring to see results.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 