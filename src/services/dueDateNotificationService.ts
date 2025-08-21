import { collection, query, where, onSnapshot, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { VendorInvoice } from '@/types/vendor';

export interface DueDateAlert {
    id: string;
    invoiceId: string;
    vendorName: string;
    amount: number;
    currency: string;
    dueDate: Date;
    daysUntilDue: number;
    isOverdue: boolean;
}

export class DueDateNotificationService {
    private listeners: (() => void)[] = [];

    /**
     * Monitor invoices due in current month
     * Focus only on invoices that have a due date (serviceEndDate) in the current month
     */
    monitorCurrentMonthDueDates(callback: (alerts: DueDateAlert[]) => void) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Query for invoices with due dates in current month
        const q = query(
            collection(db, 'vendor_invoices'),
            where('serviceEndDate', '>=', Timestamp.fromDate(startOfMonth)),
            where('serviceEndDate', '<=', Timestamp.fromDate(endOfMonth)),
            orderBy('serviceEndDate', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const alerts: DueDateAlert[] = [];

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                const invoice = {
                    id: doc.id,
                    ...data
                } as VendorInvoice;

                // Only include if serviceEndDate exists, is in current month, and type is 'services'
                let dueDate = invoice.serviceEndDate;
                if (dueDate) {
                    if (typeof dueDate === 'object' && dueDate !== null && 'toDate' in dueDate && typeof (dueDate as any).toDate === 'function') {
                        dueDate = (dueDate as any).toDate();
                    } else if (typeof dueDate === 'string' || typeof dueDate === 'number') {
                        dueDate = new Date(dueDate);
                    }
                    if (
                        dueDate instanceof Date &&
                        dueDate >= startOfMonth &&
                        dueDate <= endOfMonth
                    ) {
                        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const isOverdue = daysUntilDue < 0;
                        alerts.push({
                            id: invoice.id,
                            invoiceId: invoice.invoiceId,
                            vendorName: invoice.vendorName,
                            amount: invoice.amount,
                            currency: invoice.currency,
                            dueDate: dueDate,
                            daysUntilDue: Math.abs(daysUntilDue),
                            isOverdue: isOverdue
                        });
                    }
                }
            });
            callback(alerts);
        });
        this.listeners.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Get summary statistics for due date alerts
     */
    getAlertSummary(alerts: DueDateAlert[]) {
        const overdue = alerts.filter(alert => alert.isOverdue);
        const dueThisMonth = alerts.filter(alert => !alert.isOverdue);

        const totalAmount = alerts.reduce((sum, alert) => sum + alert.amount, 0);
        const overdueAmount = overdue.reduce((sum, alert) => sum + alert.amount, 0);
        const dueThisMonthAmount = dueThisMonth.reduce((sum, alert) => sum + alert.amount, 0);

        return {
            totalAlerts: alerts.length,
            overdueCount: overdue.length,
            dueThisMonthCount: dueThisMonth.length,
            totalAmount,
            overdueAmount,
            dueThisMonthAmount
        };
    }

    cleanup() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners = [];
    }
} 