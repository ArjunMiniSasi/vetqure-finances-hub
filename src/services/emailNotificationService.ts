import { DueDateAlert } from './dueDateNotificationService';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface EmailNotificationData {
    to: string;
    message: {
        subject: string;
        text: string;
        html: string;
    };
}

export class EmailNotificationService {
    /**
     * Send due date alert email using Firebase Extensions Trigger Email
     */
    async sendDueDateAlert(alert: DueDateAlert, recipientEmail: string): Promise<boolean> {
        try {
            const subject = alert.isOverdue
                ? `🚨 URGENT: Overdue Invoice - ${alert.invoiceId}`
                : `📅 Invoice Due Soon - ${alert.invoiceId}`;

            const textBody = this.generateDueDateEmailBody(alert);
            const htmlBody = this.generateDueDateEmailHtml(alert);

            // Add document to 'mail' collection to trigger email
            await addDoc(collection(db, 'mail'), {
                to: recipientEmail,
                message: {
                    subject,
                    text: textBody,
                    html: htmlBody,
                },
            });

            console.log('Email queued for delivery:', subject);
            return true;
        } catch (error) {
            console.error('Error sending email notification:', error);
            return false;
        }
    }

    /**
     * Send batch due date alerts email
     */
    async sendBatchDueDateAlerts(alerts: DueDateAlert[], recipientEmail: string): Promise<boolean> {
        try {
            const filteredAlerts = this.filterCurrentMonth(alerts);
            const overdueCount = filteredAlerts.filter(alert => alert.isOverdue).length;
            const dueSoonCount = filteredAlerts.filter(alert => !alert.isOverdue).length;

            let subject = '';
            if (overdueCount > 0 && dueSoonCount > 0) {
                subject = `📊 Invoice Alerts: ${overdueCount} Overdue, ${dueSoonCount} Due Soon`;
            } else if (overdueCount > 0) {
                subject = `🚨 URGENT: ${overdueCount} Overdue Invoices`;
            } else {
                subject = `📅 ${dueSoonCount} Invoices Due Soon`;
            }

            const textBody = this.generateBatchEmailBody(filteredAlerts);
            const htmlBody = this.generateBatchEmailHtml(filteredAlerts);

            await addDoc(collection(db, 'mail'), {
                to: recipientEmail,
                message: {
                    subject,
                    text: textBody,
                    html: htmlBody,
                },
            });

            console.log('Batch email queued for delivery:', subject);
            return true;
        } catch (error) {
            console.error('Error sending batch email notification:', error);
            return false;
        }
    }

    /**
     * Send daily summary email
     */
    async sendDailySummary(alerts: DueDateAlert[], recipientEmail: string): Promise<boolean> {
        try {
            const filteredAlerts = this.filterCurrentMonth(alerts);
            const subject = `📋 Daily Invoice Summary - ${new Date().toLocaleDateString()}`;
            const textBody = this.generateDailySummaryBody(filteredAlerts);
            const htmlBody = this.generateDailySummaryHtml(filteredAlerts);

            await addDoc(collection(db, 'mail'), {
                to: recipientEmail,
                message: {
                    subject,
                    text: textBody,
                    html: htmlBody,
                },
            });

            console.log('Daily summary email queued for delivery:', subject);
            return true;
        } catch (error) {
            console.error('Error sending daily summary email:', error);
            return false;
        }
    }

    private generateDueDateEmailBody(alert: DueDateAlert): string {
        const currencySymbol = this.getCurrencySymbol(alert.currency);
        const amount = `${currencySymbol}${alert.amount.toFixed(2)}`;

        if (alert.isOverdue) {
            return `
URGENT: Overdue Invoice Alert

Invoice ID: ${alert.invoiceId}
Vendor: ${alert.vendorName}
Amount: ${amount}
Due Date: ${alert.dueDate.toLocaleDateString()}
Days Overdue: ${alert.daysUntilDue}

Please take immediate action to resolve this overdue invoice.

Best regards,
VAMS Finance System
      `.trim();
        } else {
            return `
Invoice Due Soon Alert

Invoice ID: ${alert.invoiceId}
Vendor: ${alert.vendorName}
Amount: ${amount}
Due Date: ${alert.dueDate.toLocaleDateString()}
Days Until Due: ${alert.daysUntilDue}

Please ensure payment is processed before the due date.

Best regards,
VAMS Finance System
      `.trim();
        }
    }

    private generateDueDateEmailHtml(alert: DueDateAlert): string {
        const currencySymbol = this.getCurrencySymbol(alert.currency);
        const amount = `${currencySymbol}${alert.amount.toFixed(2)}`;
        const isOverdue = alert.isOverdue;

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #01358c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .alert { padding: 15px; margin: 15px 0; border-radius: 5px; }
        .urgent { background: #fee; border-left: 4px solid #e53e3e; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .info { background: #d1ecf1; border-left: 4px solid #17a2b8; }
        .amount { font-size: 24px; font-weight: bold; color: #01358c; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VAMS Finance System</h1>
            <h2>${isOverdue ? '🚨 Overdue Invoice Alert' : '📅 Invoice Due Soon'}</h2>
        </div>
        
        <div class="content">
            <div class="alert ${isOverdue ? 'urgent' : 'warning'}">
                <h3>${isOverdue ? 'URGENT: Overdue Invoice' : 'Invoice Due Soon'}</h3>
                
                <p><strong>Invoice ID:</strong> ${alert.invoiceId}</p>
                <p><strong>Vendor:</strong> ${alert.vendorName}</p>
                <p><strong>Amount:</strong> <span class="amount">${amount}</span></p>
                <p><strong>Due Date:</strong> ${alert.dueDate.toLocaleDateString()}</p>
                <p><strong>${isOverdue ? 'Days Overdue:' : 'Days Until Due:'}</strong> ${alert.daysUntilDue}</p>
                
                ${isOverdue ?
                '<p><strong>Action Required:</strong> Please take immediate action to resolve this overdue invoice.</p>' :
                '<p><strong>Action Required:</strong> Please ensure payment is processed before the due date.</p>'
            }
            </div>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from VAMS Finance System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
    }

    private generateBatchEmailBody(alerts: DueDateAlert[]): string {
        const overdue = alerts.filter(alert => alert.isOverdue);
        const dueSoon = alerts.filter(alert => !alert.isOverdue);
        const totalAmount = alerts.reduce((sum, alert) => sum + alert.amount, 0);

        let body = `
Invoice Alerts Summary

Total Alerts: ${alerts.length}
Total Amount: ${this.getCurrencySymbol('INR')}${totalAmount.toFixed(2)}

`;

        if (overdue.length > 0) {
            body += `OVERDUE INVOICES (${overdue.length}):
`;
            overdue.forEach(alert => {
                body += `- ${alert.invoiceId} (${alert.vendorName}): ${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)} - ${alert.daysUntilDue} days overdue
`;
            });
            body += `
`;
        }

        if (dueSoon.length > 0) {
            body += `DUE SOON (${dueSoon.length}):
`;
            dueSoon.forEach(alert => {
                body += `- ${alert.invoiceId} (${alert.vendorName}): ${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)} - Due in ${alert.daysUntilDue} days
`;
            });
        }

        body += `

Please review and take appropriate action.

Best regards,
VAMS Finance System
`;

        return body.trim();
    }

    private generateBatchEmailHtml(alerts: DueDateAlert[]): string {
        const overdue = alerts.filter(alert => alert.isOverdue);
        const dueSoon = alerts.filter(alert => !alert.isOverdue);
        const totalAmount = alerts.reduce((sum, alert) => sum + alert.amount, 0);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #01358c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .summary { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
        .overdue { background: #fee; border-left: 4px solid #e53e3e; padding: 15px; margin: 10px 0; }
        .dueSoon { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 10px 0; }
        .amount { font-weight: bold; color: #01358c; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VAMS Finance System</h1>
            <h2>📊 Invoice Alerts Summary</h2>
        </div>
        
        <div class="content">
            <div class="summary">
                <h3>Summary</h3>
                <p><strong>Total Alerts:</strong> ${alerts.length}</p>
                <p><strong>Total Amount:</strong> <span class="amount">${this.getCurrencySymbol('INR')}${totalAmount.toFixed(2)}</span></p>
            </div>
            
            ${overdue.length > 0 ? `
            <div class="overdue">
                <h3>🚨 Overdue Invoices (${overdue.length})</h3>
                ${overdue.map(alert => `
                    <p><strong>${alert.invoiceId}</strong> (${alert.vendorName})<br>
                    Amount: <span class="amount">${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}</span><br>
                    ${alert.daysUntilDue} days overdue</p>
                `).join('')}
            </div>
            ` : ''}
            
            ${dueSoon.length > 0 ? `
            <div class="dueSoon">
                <h3>📅 Due Soon (${dueSoon.length})</h3>
                ${dueSoon.map(alert => `
                    <p><strong>${alert.invoiceId}</strong> (${alert.vendorName})<br>
                    Amount: <span class="amount">${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}</span><br>
                    Due in ${alert.daysUntilDue} days</p>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>This is an automated notification from VAMS Finance System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
    }

    private generateDailySummaryBody(alerts: DueDateAlert[]): string {
        const overdue = alerts.filter(alert => alert.isOverdue);
        const dueSoon = alerts.filter(alert => !alert.isOverdue);
        const totalAmount = alerts.reduce((sum, alert) => sum + alert.amount, 0);

        return `
Daily Invoice Summary - ${new Date().toLocaleDateString()}

Summary:
- Total Active Alerts: ${alerts.length}
- Overdue Invoices: ${overdue.length}
- Due Soon: ${dueSoon.length}
- Total Amount: ${this.getCurrencySymbol('INR')}${totalAmount.toFixed(2)}

${overdue.length > 0 ? `
Overdue Invoices Requiring Immediate Attention:
${overdue.map(alert => `- ${alert.invoiceId} (${alert.vendorName}): ${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}`).join('\n')}
` : ''}

${dueSoon.length > 0 ? `
Invoices Due Soon:
${dueSoon.map(alert => `- ${alert.invoiceId} (${alert.vendorName}): ${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)} - Due in ${alert.daysUntilDue} days`).join('\n')}
` : ''}

Best regards,
VAMS Finance System
    `.trim();
    }

    private generateDailySummaryHtml(alerts: DueDateAlert[]): string {
        const overdue = alerts.filter(alert => alert.isOverdue);
        const dueSoon = alerts.filter(alert => !alert.isOverdue);
        const totalAmount = alerts.reduce((sum, alert) => sum + alert.amount, 0);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #01358c; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .summary { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border: 1px solid #ddd; }
        .section { margin: 20px 0; }
        .amount { font-weight: bold; color: #01358c; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VAMS Finance System</h1>
            <h2>📋 Daily Invoice Summary</h2>
            <p>${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <h3>Summary</h3>
                <p><strong>Total Active Alerts:</strong> ${alerts.length}</p>
                <p><strong>Overdue Invoices:</strong> ${overdue.length}</p>
                <p><strong>Due Soon:</strong> ${dueSoon.length}</p>
                <p><strong>Total Amount:</strong> <span class="amount">${this.getCurrencySymbol('INR')}${totalAmount.toFixed(2)}</span></p>
            </div>
            
            ${overdue.length > 0 ? `
            <div class="section">
                <h3>🚨 Overdue Invoices Requiring Immediate Attention</h3>
                ${overdue.map(alert => `
                    <p><strong>${alert.invoiceId}</strong> (${alert.vendorName})<br>
                    Amount: <span class="amount">${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}</span></p>
                `).join('')}
            </div>
            ` : ''}
            
            ${dueSoon.length > 0 ? `
            <div class="section">
                <h3>📅 Invoices Due Soon</h3>
                ${dueSoon.map(alert => `
                    <p><strong>${alert.invoiceId}</strong> (${alert.vendorName})<br>
                    Amount: <span class="amount">${this.getCurrencySymbol(alert.currency)}${alert.amount.toFixed(2)}</span><br>
                    Due in ${alert.daysUntilDue} days</p>
                `).join('')}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>This is an automated daily summary from VAMS Finance System.</p>
            <p>Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
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

    // Helper to filter alerts to only those with dueDate in current month and type 'services'
    private filterCurrentMonth(alerts: DueDateAlert[]): DueDateAlert[] {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return alerts.filter(alert =>
            alert.dueDate &&
            alert.dueDate >= startOfMonth &&
            alert.dueDate <= endOfMonth 
        );
    }
} 