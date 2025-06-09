import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginScreen from './pages/auth/LoginScreen';
import RegisterScreen from './pages/auth/RegisterScreen';
import PasswordResetScreen from './pages/auth/PasswordResetScreen';
import Dashboard from './components/Dashboard';
import CustomerList from './components/customers/CustomerList';
import CustomerInvoices from './components/customers/CustomerInvoices';
import CustomerReceipts from './components/customers/CustomerReceipts';
import VendorList from './components/vendors/VendorList';
import VendorInvoices from './components/vendors/VendorInvoices';
import VendorReceipts from './components/vendors/VendorReceipts';
import Reports from './components/Reports';
import Settings from './components/Settings';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/reset-password" element={<PasswordResetScreen />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Customer routes */}
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/customers/invoices" element={<CustomerInvoices />} />
            <Route path="/customers/receipts" element={<CustomerReceipts />} />
            
            {/* Vendor routes */}
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/vendors/invoices" element={<VendorInvoices />} />
            <Route path="/vendors/receipts" element={<VendorReceipts />} />
            
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
