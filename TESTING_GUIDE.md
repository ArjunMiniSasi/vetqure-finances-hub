# 🔔 VAMS Finance Notification System - Testing Guide

## Overview
This guide will help you test the real-time notification system for vendor invoice due dates, including email notifications via Firebase Extensions Trigger Email.

## 🚀 Quick Start Testing

### 1. **Access the Notification Manager**
- Navigate to `/test-due-date-alerts` in your application
- Or go to Settings → Notification Manager

### 2. **Enable Notifications**
- **Email Notifications**: Check the box and enter your email address
- **Browser Notifications**: Check the box (will request permission)
- **Dashboard Alerts**: Keep enabled to see alerts on dashboard

### 3. **Start Monitoring**
- Click **"Start Monitoring"** button
- You should see "Monitoring Started" toast notification
- Status should show "Active" in green

## 📧 Email Testing

### **Test Email Sending**
1. Enable email notifications
2. Enter your email address
3. Click **"Send Test"** button
4. Check your email inbox (may take a few seconds)
5. You should receive a test email with VAMS branding

### **Real-time Email Alerts**
1. Start monitoring
2. Create or update vendor invoices with due dates in current month
3. Emails will be automatically triggered for:
   - Overdue invoices (due date < today)
   - Due soon invoices (due date in current month)

### **Email Types You'll Receive**
- **Individual Alerts**: One email per invoice alert
- **Batch Alerts**: Summary email when multiple alerts exist
- **Daily Summary**: Scheduled summary of all active alerts

## 🔔 Browser Notification Testing

### **Permission Setup**
1. Enable browser notifications
2. Browser will ask for permission - click "Allow"
3. Test with "Send Test" button

### **Real-time Browser Alerts**
- Notifications appear automatically when monitoring is active
- Overdue invoices show with 🚨 icon
- Due soon invoices show with 📅 icon
- Click notifications to navigate to vendor invoices page

## 📊 Dashboard Alerts Testing

### **View Alerts**
1. Go to Dashboard (`/`)
2. Look for "Due Date Alerts" section
3. Alerts show in real-time as monitoring detects them

### **Alert Information**
Each alert displays:
- Invoice ID
- Vendor Name
- Amount with currency
- Due date
- Days until due/overdue status
- Color coding (red for overdue, yellow for due soon)

## 🧪 Test Data Creation

### **Create Test Vendor Invoices**
1. Go to Vendors → Add Vendor (if needed)
2. Go to Vendor Invoices → Add Invoice
3. Set `serviceEndDate` to:
   - **Overdue**: Any date before today
   - **Due Soon**: Any date in current month
   - **Future**: Any date after current month (won't trigger alerts)

### **Sample Test Data**
```javascript
// Overdue Invoice
{
  invoiceId: "TEST-OVERDUE-001",
  vendorName: "Test Vendor",
  amount: 5000,
  currency: "INR",
  serviceEndDate: "2024-01-15" // Past date
}

// Due Soon Invoice
{
  invoiceId: "TEST-DUE-001", 
  vendorName: "Test Vendor",
  amount: 3000,
  currency: "INR",
  serviceEndDate: "2024-12-25" // Current month
}
```

## 🔧 Troubleshooting

### **Email Not Working**
- ✅ Check Firebase Extensions Trigger Email is configured
- ✅ Verify email address is correct
- ✅ Check spam folder
- ✅ Look for console errors in browser dev tools
- ✅ Check Firebase console for email delivery status

### **Browser Notifications Not Working**
- ✅ Check browser permission is granted
- ✅ Ensure notifications are enabled in settings
- ✅ Test with "Send Test" button
- ✅ Check browser console for errors

### **No Alerts Showing**
- ✅ Ensure monitoring is started
- ✅ Check vendor invoices have `serviceEndDate` in current month
- ✅ Verify Firestore security rules allow reading vendor_invoices
- ✅ Check browser console for errors

### **Real-time Updates Not Working**
- ✅ Check internet connection
- ✅ Verify Firestore listener is active
- ✅ Check for JavaScript errors in console
- ✅ Restart monitoring if needed

## 📋 Testing Checklist

### **Basic Functionality**
- [ ] Notification Manager loads without errors
- [ ] Settings can be saved and loaded
- [ ] Start/Stop monitoring works
- [ ] Test notifications can be sent

### **Email Testing**
- [ ] Test email is received
- [ ] Email has proper formatting and branding
- [ ] Real-time alerts trigger emails
- [ ] Batch emails work for multiple alerts

### **Browser Notifications**
- [ ] Permission is requested and granted
- [ ] Test notification appears
- [ ] Real-time notifications work
- [ ] Clicking notification navigates correctly

### **Dashboard Integration**
- [ ] Alerts appear on dashboard
- [ ] Real-time updates work
- [ ] Alert information is accurate
- [ ] Color coding is correct

### **Data Integration**
- [ ] Vendor invoices are detected
- [ ] Due date calculations are correct
- [ ] Overdue vs due soon logic works
- [ ] Currency symbols display correctly

## 🎯 Advanced Testing

### **Performance Testing**
- Test with 100+ vendor invoices
- Monitor memory usage during long monitoring sessions
- Test rapid start/stop cycles

### **Edge Cases**
- Test with invoices due exactly today
- Test with very large amounts
- Test with special characters in vendor names
- Test with different currencies

### **Integration Testing**
- Test with actual vendor data
- Test email delivery to different email providers
- Test on different browsers and devices

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase configuration
3. Test with simple data first
4. Check this guide for troubleshooting steps

## 🔄 Continuous Testing

The system is designed for continuous operation:
- Monitoring runs 24/7 when started
- Alerts update in real-time
- Email notifications are queued and delivered automatically
- Dashboard shows current status at all times 