# 🧪 Simple Testing Guide - VAMS Notification System

## 🚨 **Why It Might Not Be Working**

The notification system only shows alerts for vendor invoices with due dates in the **current month**. If you don't see any alerts, it's likely because:

1. **No vendor invoices exist** in your database
2. **No invoices have due dates** in the current month
3. **Firebase connection issues**

## 📋 **Step-by-Step Testing**

### **Step 1: Check Current Month**
- Current month: **December 2024**
- System looks for invoices with `serviceEndDate` between **Dec 1, 2024** and **Dec 31, 2024**

### **Step 2: Create Test Data**

#### **Option A: Create via UI (Recommended)**
1. Go to **Vendors** → **Add Vendor**
   - Name: `Test Vendor`
   - Email: `test@example.com`
   - Phone: `1234567890`

2. Go to **Vendor Invoices** → **Add Invoice**
   - Invoice ID: `TEST-001`
   - Vendor: Select your test vendor
   - Amount: `5000`
   - Currency: `INR`
   - **Service End Date: `2024-12-25`** ← **IMPORTANT: Set this to current month**
   - Description: `Test invoice for notifications`

#### **Option B: Create Multiple Test Invoices**
Create these invoices with different due dates:

```
Invoice 1:
- Invoice ID: TEST-OVERDUE-001
- Service End Date: 2024-12-15 (overdue)
- Amount: 3000

Invoice 2:
- Invoice ID: TEST-DUE-001  
- Service End Date: 2024-12-25 (due soon)
- Amount: 5000

Invoice 3:
- Invoice ID: TEST-DUE-002
- Service End Date: 2024-12-30 (due soon)
- Amount: 2000
```

### **Step 3: Test the System**

#### **Method 1: Dashboard Test**
1. Go to **Dashboard** (`/dashboard`)
2. Look for **"Current Month Due Date Alerts"** section
3. You should see alerts if invoices exist with current month due dates

#### **Method 2: Test Page**
1. Go to **`/test-due-date-alerts`**
2. Click **"Start Monitoring"**
3. Check the **"Test Results"** section for real-time updates
4. You should see messages like:
   ```
   Found 3 invoices with due dates in current month
   - TEST-OVERDUE-001 (Test Vendor): Due 12/15/2024, 10 days overdue
   - TEST-DUE-001 (Test Vendor): Due 12/25/2024, 5 days left
   ```

#### **Method 3: Notification Manager**
1. Go to **Settings** → **Notification Manager**
2. Enable **Email Notifications** and add your email
3. Enable **Browser Notifications**
4. Click **"Start Monitoring"**
5. Click **"Send Test"** to test notifications

### **Step 4: Verify Email Notifications**

1. **Enable email notifications** in Notification Manager
2. **Add your email address**
3. **Start monitoring**
4. **Check your email** (may take 30-60 seconds)
5. You should receive emails with VAMS branding

### **Step 5: Test Browser Notifications**

1. **Enable browser notifications** in Notification Manager
2. **Allow permission** when browser asks
3. **Start monitoring**
4. **Look for browser notifications** (top-right corner)
5. **Click notifications** to navigate to vendor invoices

## 🔍 **Troubleshooting**

### **No Alerts Showing?**
1. **Check browser console** (F12 → Console) for errors
2. **Verify Firebase connection** - check if other data loads
3. **Create test invoices** with current month due dates
4. **Check Firestore security rules** allow reading `vendor_invoices`

### **Email Not Working?**
1. **Check Firebase Extensions** - ensure Trigger Email is configured
2. **Check spam folder**
3. **Verify email address** is correct
4. **Check Firebase console** for email delivery status

### **Browser Notifications Not Working?**
1. **Check browser permission** - should be "granted"
2. **Test with "Send Test"** button
3. **Check browser console** for errors
4. **Try different browser** if issues persist

## 🎯 **Quick Test Checklist**

- [ ] Created vendor with test data
- [ ] Created invoice with `serviceEndDate` in current month
- [ ] Navigated to `/test-due-date-alerts`
- [ ] Clicked "Start Monitoring"
- [ ] Saw test results showing invoice count
- [ ] Enabled email notifications
- [ ] Received test email
- [ ] Enabled browser notifications
- [ ] Saw browser notification
- [ ] Checked dashboard for alerts

## 📞 **Still Not Working?**

If you're still having issues:

1. **Check browser console** for specific error messages
2. **Verify you have vendor invoices** with current month due dates
3. **Test with simple data first** - one vendor, one invoice
4. **Check Firebase project settings** and extensions

## 🚀 **Expected Results**

When working correctly, you should see:

- **Dashboard**: Due date alerts section with invoice details
- **Test Page**: Real-time monitoring results
- **Email**: Rich HTML emails with VAMS branding
- **Browser**: Desktop notifications with invoice details
- **Real-time**: Updates as you add/modify invoices 