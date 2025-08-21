import React, { useEffect, useState } from 'react';
import { BarChart3, DollarSign, Users, FileText, TrendingUp, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { getCustomers, getAllInvoices, getAllReceipts } from '@/services/firestoreService';
import AddInvoiceModal from '@/components/customers/invoices/AddInvoiceModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { addCustomer, checkCustomerExistsByEmail } from '@/services/firestoreService';
import { Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { DueDateAlerts } from './DueDateAlerts';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeClients, setActiveClients] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const [monthlyGrowth, setMonthlyGrowth] = useState(0);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [revenueByCurrency, setRevenueByCurrency] = useState<{ [currency: string]: number }>({});
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    entity_name: '',
    email: '',
    phone: '',
    address: '',
    type: 'individual',
    status: 'active',
    renewal_date: null as Date | null
  });
  const [error, setError] = useState('');

  // Helper to safely get a JS Date from Firestore Timestamp, string, or number
  const getDate = (val: any) => {
    if (val && typeof val.toDate === 'function') return val.toDate();
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
    return new Date(0); // fallback to epoch
  };

  // Helper to format date for input type="date"
  function formatDateForInput(date: Date | null) {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [customers, invoices, receipts] = await Promise.all([
          getCustomers(),
          getAllInvoices(),
          getAllReceipts(),
        ]);
        setCustomersList(customers);

        // Total Revenue: sum of all successful receipts
        const totalRevenueValue = receipts
          .filter((r) => r.status === 'successful')
          .reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : 0), 0);
        setTotalRevenue(totalRevenueValue);

        // Active Clients: customers with status 'active'
        setActiveClients(customers.filter((c) => c.status === 'active').length);

        // Pending Invoices: invoices with status 'pending'
        setPendingInvoices(invoices.filter((inv) => inv.status === 'pending').length);

        // Monthly Growth: revenue this month vs last month
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
        const thisMonthRevenue = receipts.filter((r) => {
          const d = getDate(r.date);
          return (
            r.status === 'successful' &&
            d.getMonth() === thisMonth &&
            d.getFullYear() === thisYear
          );
        }).reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : 0), 0);
        const lastMonthRevenue = receipts.filter((r) => {
          const d = getDate(r.date);
          return (
            r.status === 'successful' &&
            d.getMonth() === lastMonth &&
            d.getFullYear() === lastMonthYear
          );
        }).reduce((sum, r) => sum + (typeof r.amount === 'number' ? r.amount : 0), 0);
        let growth = 0;
        if (lastMonthRevenue > 0) {
          growth = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
        } else if (thisMonthRevenue > 0) {
          growth = 100;
        }
        setMonthlyGrowth(growth);

        // Recent Activity: last 5 customers by createdAt
        const sortedCustomers = [...customers].sort((a, b) => {
          const aDate = getDate(a.createdAt);
          const bDate = getDate(b.createdAt);
          return bDate.getTime() - aDate.getTime();
        });
        setRecentCustomers(sortedCustomers.slice(0, 5));

        // Revenue by currency
        const revenueMap: { [currency: string]: number } = {};
        receipts.filter((r) => r.status === 'successful').forEach((r) => {
          const currency = r.currency || 'INR';
          if (!revenueMap[currency]) revenueMap[currency] = 0;
          revenueMap[currency] += typeof r.amount === 'number' ? r.amount : 0;
        });
        setRevenueByCurrency(revenueMap);
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currencySymbols: { [currency: string]: string } = { INR: '₹', USD: '$' };

  const stats = [
    // Revenue cards for each currency (prioritized first)
    ...Object.entries(revenueByCurrency).map(([currency, amount]) => ({
      name: `Total Revenue (${currency})`,
      value: loading ? '...' : `${currencySymbols[currency] || currency + ' '} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
      change: '',
      icon: DollarSign,
    })),
    {
      name: 'Active Clients',
      value: loading ? '...' : activeClients,
      change: '',
      icon: Users,
    },
    {
      name: 'Monthly Growth',
      value: loading ? '...' : `${monthlyGrowth >= 0 ? '+' : ''}${monthlyGrowth.toFixed(1)}%`,
      change: '',
      icon: BarChart3,
    },
    {
      name: 'Pending Invoices',
      value: loading ? '...' : pendingInvoices,
      change: '',
      icon: FileText,
    },
  ];

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    try {
      // Check for duplicate email before adding
      const exists = await checkCustomerExistsByEmail(newCustomer.email);
      if (exists) {
        setError('Customer already exists in the database.');
        setSubmitLoading(false);
        return;
      }
      await addCustomer({
        ...newCustomer,
        type: newCustomer.type as 'individual' | 'business',
        status: newCustomer.status as 'active' | 'inactive',
        renewal_date: newCustomer.renewal_date ? Timestamp.fromDate(newCustomer.renewal_date) : null
      });
      toast.success('Customer added successfully');
      setIsAddClientOpen(false);
      setNewCustomer({
        name: '',
        entity_name: '',
        email: '',
        phone: '',
        address: '',
        type: 'individual',
        status: 'active',
        renewal_date: null
      });
      if (typeof window !== 'undefined') window.location.reload();
    } catch (error) {
      setError('Failed to add customer');
      console.error('Error:', error);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Today
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5"
            >
              <dt>
                <div className="absolute rounded-lg bg-blue-500 p-3">
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {stat.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                {stat.change && (
                  <p className={`ml-2 flex items-baseline text-sm font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </p>
                )}
              </dd>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <div className="mt-6 flow-root">
            <ul className="-my-5 divide-y divide-gray-200">
              {loading ? (
                <li className="py-4 text-gray-500">Loading...</li>
              ) : recentCustomers.length === 0 ? (
                <li className="py-4 text-gray-500">No recent customers.</li>
              ) : (
                recentCustomers.map((customer) => (
                  <li key={customer.id} className="py-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{customer.name}</p>
                        <p className="truncate text-xs text-gray-500">{customer.email}</p>
                        <p className="truncate text-xs text-gray-400">
                          {getDate(customer.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          New
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setIsAddInvoiceOpen(true)}
            >
              Create Invoice
            </button>
            <button
              className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setIsAddClientOpen(true)}
            >
              Add Client
            </button>
            <button className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              Generate Report
            </button>
            <button className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Due Date Alerts - Move this below the above sections */}
      <DueDateAlerts />

      <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 p-4 border border-red-200">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Contact Name</Label>
                <input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Enter contact person name"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newCustomer.type}
                  onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value as 'individual' | 'business' })}
                  required
                >
                  <option value="individual">Individual</option>
                  <option value="business">Business</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entity_name">{newCustomer.type === 'individual' ? 'Firm Name' : 'Business Name'}</Label>
                <input
                  id="entity_name"
                  value={newCustomer.entity_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, entity_name: e.target.value })}
                  placeholder={newCustomer.type === 'individual' ? 'Enter firm name' : 'Enter business name'}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <input
                  id="phone"
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  value={newCustomer.status}
                  onChange={(e) => setNewCustomer({ ...newCustomer, status: e.target.value as 'active' | 'inactive' })}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <textarea
                id="address"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
                rows={3}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renewal_date">Renewal Date</Label>
              <input
                id="renewal_date"
                type="date"
                value={formatDateForInput(newCustomer.renewal_date)}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  if (dateValue) {
                    const date = new Date(dateValue + 'T00:00:00');
                    if (!isNaN(date.getTime())) {
                      setNewCustomer({
                        ...newCustomer,
                        renewal_date: date
                      });
                    }
                  } else {
                    setNewCustomer({
                      ...newCustomer,
                      renewal_date: null
                    });
                  }
                }}
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddClientOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <span className="flex items-center"><span className="loader mr-2"></span>Adding...</span>
                ) : (
                  'Add Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddInvoiceModal
        open={isAddInvoiceOpen}
        onOpenChange={setIsAddInvoiceOpen}
        customers={customersList}
        onInvoiceCreated={() => window.location.reload()}
      />
    </div>
  );
};

export default Dashboard;
