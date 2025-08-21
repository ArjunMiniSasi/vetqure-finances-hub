import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { VendorInvoice } from '@/types/vendor';

export const DebugNotificationSystem: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const runDebugCheck = async () => {
    setIsLoading(true);
    const info: any = {};

    try {
      // Check current month info
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      info.currentMonth = {
        name: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        startDate: startOfMonth.toLocaleDateString(),
        endDate: endOfMonth.toLocaleDateString(),
        startTimestamp: Timestamp.fromDate(startOfMonth),
        endTimestamp: Timestamp.fromDate(endOfMonth)
      };

      // Check all vendor invoices
      const allInvoicesQuery = query(collection(db, 'vendor_invoices'));
      const allInvoicesSnapshot = await getDocs(allInvoicesQuery);
      const allInvoices = allInvoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      info.totalInvoices = allInvoices.length;
      info.allInvoices = allInvoices;

      // JS filter: Only invoices with serviceEndDate in current month and type 'services'
      const currentMonthInvoicesJS = allInvoices.filter(inv => {
        let dueDate = (inv as any).serviceEndDate;
        if (!dueDate) return false;
        if ((inv as any).type !== 'services') return false;
        if (typeof dueDate?.toDate === 'function') dueDate = dueDate.toDate();
        else dueDate = new Date(dueDate);
        return (
          dueDate instanceof Date &&
          dueDate >= startOfMonth &&
          dueDate <= endOfMonth
        );
      });
      info.currentMonthInvoicesJS = {
        count: currentMonthInvoicesJS.length,
        invoices: currentMonthInvoicesJS
      };

      // Overdue: Only those in current month
      const overdueInvoices = currentMonthInvoicesJS.filter((invoice: any) => {
        let dueDate = invoice.serviceEndDate;
        if (typeof dueDate?.toDate === 'function') dueDate = dueDate.toDate();
        else dueDate = new Date(dueDate);
        return dueDate < now;
      });
      info.overdueInvoices = {
        count: overdueInvoices.length,
        invoices: overdueInvoices
      };

      // Check Firebase connection
      info.firebaseConnection = 'Connected';

      // Check notification permission
      info.notificationPermission = Notification.permission;

      // Check if serviceEndDate field exists
      const invoicesWithServiceEndDate = allInvoices.filter((invoice: any) => invoice.serviceEndDate);
      info.invoicesWithServiceEndDate = {
        count: invoicesWithServiceEndDate.length,
        invoices: invoicesWithServiceEndDate
      };

    } catch (error) {
      info.error = error.message;
      info.firebaseConnection = 'Error';
    }

    setDebugInfo(info);
    setIsLoading(false);
  };

  const formatDate = (date: any) => {
    if (!date) return 'No date';
    if (date.toDate) return date.toDate().toLocaleDateString();
    if (date instanceof Date) return date.toLocaleDateString();
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug Notification System</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runDebugCheck} disabled={isLoading}>
            {isLoading ? 'Running Debug...' : 'Run Debug Check'}
          </Button>
        </CardContent>
      </Card>

      {Object.keys(debugInfo).length > 0 && (
        <>
          {/* Current Month Info */}
          <Card>
            <CardHeader>
              <CardTitle>📅 Current Month Info</CardTitle>
            </CardHeader>
            <CardContent>
              {debugInfo.currentMonth && (
                <div className="space-y-2">
                  <p><strong>Month:</strong> {debugInfo.currentMonth.name}</p>
                  <p><strong>Start Date:</strong> {debugInfo.currentMonth.startDate}</p>
                  <p><strong>End Date:</strong> {debugInfo.currentMonth.endDate}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Firebase Connection */}
          <Card>
            <CardHeader>
              <CardTitle>🔥 Firebase Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo.firebaseConnection === 'Connected' ? 'default' : 'destructive'}>
                {debugInfo.firebaseConnection}
              </Badge>
              {debugInfo.error && (
                <p className="text-red-600 mt-2">{debugInfo.error}</p>
              )}
            </CardContent>
          </Card>

          {/* Notification Permission */}
          <Card>
            <CardHeader>
              <CardTitle>🔔 Notification Permission</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={debugInfo.notificationPermission === 'granted' ? 'default' : 'secondary'}>
                {debugInfo.notificationPermission}
              </Badge>
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{debugInfo.totalInvoices || 0}</div>
                  <div className="text-sm text-gray-600">Total Invoices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {debugInfo.currentMonthInvoicesJS?.count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Current Month</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {debugInfo.overdueInvoices?.count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service End Date Check */}
          <Card>
            <CardHeader>
              <CardTitle>📅 Service End Date Check</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Invoices with serviceEndDate:</strong> {debugInfo.invoicesWithServiceEndDate?.count || 0}</p>
              <p><strong>Invoices without serviceEndDate:</strong> {(debugInfo.totalInvoices || 0) - (debugInfo.invoicesWithServiceEndDate?.count || 0)}</p>
            </CardContent>
          </Card>

          {/* Current Month Invoices (JS filtered) */}
          {debugInfo.currentMonthInvoicesJS?.invoices && debugInfo.currentMonthInvoicesJS.invoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📋 Current Month Invoices (JS Filtered) ({debugInfo.currentMonthInvoicesJS.count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.currentMonthInvoicesJS.invoices.map((invoice: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{invoice.invoiceId || 'No ID'}</p>
                          <p className="text-sm text-gray-600">{invoice.vendorName || 'No vendor'}</p>
                          <p className="text-sm">
                            Amount: ₹{invoice.amount?.toFixed(2) || '0.00'} | 
                            Due: {formatDate(invoice.serviceEndDate)}
                          </p>
                        </div>
                        <Badge variant={new Date(invoice.serviceEndDate) < new Date() ? "destructive" : "secondary"}>
                          {new Date(invoice.serviceEndDate) < new Date() ? 'Overdue' : 'Due Soon'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Invoices (First 5) */}
          {debugInfo.allInvoices && debugInfo.allInvoices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📋 All Invoices (First 5)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {debugInfo.allInvoices.slice(0, 5).map((invoice: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{invoice.invoiceId || 'No ID'}</p>
                          <p className="text-sm text-gray-600">{invoice.vendorName || 'No vendor'}</p>
                          <p className="text-sm">
                            Amount: ₹{invoice.amount?.toFixed(2) || '0.00'} | 
                            Due: {formatDate(invoice.serviceEndDate)}
                          </p>
                        </div>
                        <Badge variant={invoice.serviceEndDate ? "default" : "secondary"}>
                          {invoice.serviceEndDate ? 'Has Due Date' : 'No Due Date'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}; 