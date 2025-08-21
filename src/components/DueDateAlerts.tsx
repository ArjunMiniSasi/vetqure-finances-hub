import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Calendar, 
  ExternalLink,
  Bell
} from 'lucide-react';
import { DueDateNotificationService, DueDateAlert } from '@/services/dueDateNotificationService';
import { PushNotificationService } from '@/services/pushNotificationService';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export const DueDateAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<DueDateAlert[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const service = new DueDateNotificationService();
    const pushService = new PushNotificationService();

    // Monitor current month due dates only
    const unsubscribe = service.monitorCurrentMonthDueDates((currentAlerts) => {
      setAlerts(currentAlerts);
    });

    // Check notification permission
    setNotificationPermission(Notification.permission);
    setIsNotificationEnabled(Notification.permission === 'granted');

    return () => {
      service.cleanup();
      unsubscribe();
    };
  }, []);

  const handleRequestNotificationPermission = async () => {
    const pushService = new PushNotificationService();
    const granted = await pushService.requestPermission();
    
    if (granted) {
      setNotificationPermission('granted');
      setIsNotificationEnabled(true);
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive browser notifications for due date alerts.',
      });
    } else {
      toast({
        title: 'Notifications Disabled',
        description: 'Please enable notifications in your browser settings to receive alerts.',
        variant: 'destructive',
      });
    }
  };

  const handleViewInvoices = () => {
    window.location.href = '/vendors/invoices';
  };

  const getCurrencySymbol = (currency: string): string => {
    switch (currency) {
      case 'INR': return '₹';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return currency;
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getAlertVariant = (alert: DueDateAlert) => {
    if (alert.isOverdue) return 'destructive';
    if (alert.daysUntilDue <= 3) return 'destructive';
    if (alert.daysUntilDue <= 7) return 'default';
    return 'default';
  };

  const getAlertIcon = (alert: DueDateAlert) => {
    if (alert.isOverdue) return <AlertTriangle className="h-4 w-4" />;
    if (alert.daysUntilDue <= 3) return <AlertTriangle className="h-4 w-4" />;
    if (alert.daysUntilDue <= 7) return <Clock className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  const getAlertTitle = (alert: DueDateAlert) => {
    if (alert.isOverdue) return 'Overdue Invoice';
    if (alert.daysUntilDue <= 3) return 'Invoice Due Soon';
    if (alert.daysUntilDue <= 7) return 'Invoice Due This Week';
    return 'Invoice Due This Month';
  };

  const getAlertDescription = (alert: DueDateAlert) => {
    const amount = `${getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}`;
    
    if (alert.isOverdue) {
      return `${alert.invoiceId} from ${alert.vendorName} is ${alert.daysUntilDue} day(s) overdue. Amount: ${amount}`;
    }
    
    return `${alert.invoiceId} from ${alert.vendorName} is due in ${alert.daysUntilDue} day(s). Amount: ${amount}`;
  };

  // Helper to group alerts by vendor
  const groupByVendor = (alerts: DueDateAlert[]) => {
    const map: { [vendor: string]: DueDateAlert[] } = {};
    alerts.forEach(alert => {
      if (!map[alert.vendorName]) map[alert.vendorName] = [];
      map[alert.vendorName].push(alert);
    });
    return map;
  };

  // Only include alerts with dueDate in current month and type 'services'
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const currentMonthAlerts = alerts.filter(alert =>
    alert.dueDate &&
    alert.dueDate >= startOfMonth &&
    alert.dueDate <= endOfMonth
  );

  const overdueAlerts = currentMonthAlerts.filter(alert => alert.isOverdue);
  const dueSoonAlerts = currentMonthAlerts.filter(alert => !alert.isOverdue);
  const totalAmount = currentMonthAlerts.reduce((sum, alert) => sum + alert.amount, 0);

  // Group overdue by vendor
  const overdueByVendor = groupByVendor(overdueAlerts);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Current Month Due Date Alerts
            </CardTitle>
            <div className="flex items-center gap-2">
              {notificationPermission !== 'granted' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestNotificationPermission}
                  className="flex items-center gap-2"
                >
                  <Bell className="h-4 h-4" />
                  Enable Notifications
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewInvoices}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 h-4" />
                View All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overdueAlerts.length}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{dueSoonAlerts.length}</div>
              <div className="text-sm text-gray-600">Due Soon</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {getCurrencySymbol('INR')}{totalAmount.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overdue Alerts - Minimal Collapsible Vendor View */}
      {overdueAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Overdue Invoices ({overdueAlerts.length})
          </h3>
          <Accordion type="multiple" className="bg-white rounded-xl shadow-sm border border-gray-100">
            {Object.entries(overdueByVendor).map(([vendor, vendorAlerts]) => (
              <AccordionItem key={vendor} value={vendor} className="border-b border-gray-100">
                <AccordionTrigger className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <span className="font-medium text-gray-900 flex items-center gap-2">
                    {vendor}
                    <Badge variant="destructive" className="ml-2">{vendorAlerts.length}</Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="bg-gray-50 px-4 pb-4">
                  <ul className="space-y-2">
                    {vendorAlerts.map(alert => (
                      <li key={alert.id} className="flex items-center justify-between rounded-lg p-3 bg-white border border-gray-200">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">{alert.invoiceId}</span>
                          <span className="text-xs text-gray-500">Amount: {getCurrencySymbol(alert.currency)}{alert.amount.toFixed(2)}</span>
                        </div>
                        <span className="text-xs text-red-600 font-medium">{alert.daysUntilDue} day(s) overdue</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Due Soon Alerts */}
      {dueSoonAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-orange-600 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Due This Month ({dueSoonAlerts.length})
          </h3>
          {dueSoonAlerts.map((alert) => (
            <Alert key={alert.id} variant={getAlertVariant(alert)}>
              {getAlertIcon(alert)}
              <AlertTitle>{getAlertTitle(alert)}</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span>{getAlertDescription(alert)}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={alert.daysUntilDue <= 3 ? "destructive" : "secondary"}>
                    Due: {formatDate(alert.dueDate)}
                  </Badge>
                  <Badge variant="outline">
                    {alert.daysUntilDue} day(s) left
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}; 