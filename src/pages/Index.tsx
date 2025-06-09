
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import InvoiceManagement from '../components/InvoiceManagement';
import ClientManagement from '../components/ClientManagement';
import Reports from '../components/Reports';

const Index = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices" element={<InvoiceManagement />} />
          <Route path="/clients" element={<ClientManagement />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default Index;
