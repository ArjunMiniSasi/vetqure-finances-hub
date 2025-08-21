import { DueDateAlert } from './dueDateNotificationService';

export class PushNotificationService {
    private permission: NotificationPermission = 'default';

    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.log('This browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission === 'granted';
        }

        return false;
    }

    showDueDateNotification(alert: DueDateAlert) {
        if (this.permission !== 'granted') return;

        const title = alert.isOverdue
            ? `🚨 Overdue Invoice Alert`
            : `📅 Invoice Due Soon`;

        const body = alert.isOverdue
            ? `Invoice ${alert.invoiceId} from ${alert.vendorName} is ${alert.daysUntilDue} day(s) overdue. Amount: ${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}`
            : `Invoice ${alert.invoiceId} from ${alert.vendorName} is due in ${alert.daysUntilDue} day(s). Amount: ${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}`;

        const notification = new Notification(title, {
            body,
            icon: '/assets/vetqure.png',
            badge: '/assets/vetqure.png',
            tag: `invoice-${alert.id}`,
            requireInteraction: alert.isOverdue, // Require interaction for overdue invoices
        });

        notification.onclick = () => {
            window.focus();
            // Navigate to vendor invoices page
            window.location.href = '/vendors/invoices';
            notification.close();
        };

        // Auto-close non-overdue notifications after 10 seconds
        if (!alert.isOverdue) {
            setTimeout(() => {
                notification.close();
            }, 10000);
        }
    }

    showBatchNotification(alerts: DueDateAlert[]) {
        if (this.permission !== 'granted' || alerts.length === 0) return;

        const overdue = alerts.filter(alert => alert.isOverdue);
        const dueSoon = alerts.filter(alert => !alert.isOverdue);

        let title = '';
        let body = '';

        if (overdue.length > 0 && dueSoon.length > 0) {
            title = '📊 Multiple Invoice Alerts';
            body = `${overdue.length} overdue and ${dueSoon.length} due soon. Total: ${this.getCurrencySymbol('INR')}${alerts.reduce((sum, alert) => sum + alert.amount, 0).toFixed(2)}`;
        } else if (overdue.length > 0) {
            title = '🚨 Overdue Invoices';
            body = `${overdue.length} invoice(s) overdue. Total: ${this.getCurrencySymbol('INR')}${overdue.reduce((sum, alert) => sum + alert.amount, 0).toFixed(2)}`;
        } else {
            title = '📅 Invoices Due Soon';
            body = `${dueSoon.length} invoice(s) due soon. Total: ${this.getCurrencySymbol('INR')}${dueSoon.reduce((sum, alert) => sum + alert.amount, 0).toFixed(2)}`;
        }

        const notification = new Notification(title, {
            body,
            icon: '/assets/vetqure.png',
            badge: '/assets/vetqure.png',
            tag: 'batch-invoice-alerts',
            requireInteraction: overdue.length > 0,
        });

        notification.onclick = () => {
            window.focus();
            window.location.href = '/vendors/invoices';
            notification.close();
        };

        // Auto-close if no overdue invoices
        if (overdue.length === 0) {
            setTimeout(() => {
                notification.close();
            }, 15000);
        }
    }

    private getCurrencySymbol(currency: string): string {
        switch (currency) {
            case 'INR': return '₹';
            case 'USD': return '$';
            case 'EUR': return '€';
            case 'GBP': return '£';
            default: return currency;
        }
    }
} 