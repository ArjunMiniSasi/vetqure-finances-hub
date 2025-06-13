import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, FileText, Users, BarChart2, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { logout } from '../services/firebaseAuthService';
import { toast } from 'react-hot-toast';

const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Customers',
      icon: Users,
      subItems: [
        { name: 'List', href: '/customers' },
        { name: 'Invoices', href: '/customers/invoices' },
        { name: 'Receipts', href: '/customers/receipts' },
      ]
    },
    {
      name: 'Vendors',
      icon: FileText,
      subItems: [
        { name: 'List', href: '/vendors' },
        { name: 'Invoices', href: '/vendors/invoices' },
      ]
    },
    {
      name: 'Team',
      icon: Users,
      subItems: [
        { name: 'Employees', href: '/team/employees' },
      ]
    },
    { name: 'Reports', href: '/reports', icon: BarChart2 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const toggleSubMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  const renderNavItem = (item: any) => {
    const isActive = location.pathname === item.href || 
                    (item.subItems && item.subItems.some((subItem: any) => location.pathname === subItem.href));
    const isExpanded = expandedMenus.includes(item.name);

    if (item.subItems) {
      return (
        <div key={item.name} className="space-y-1">
          <button
            onClick={() => toggleSubMenu(item.name)}
            className={`group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-lg ${
              isActive
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center">
              <item.icon
                className={`mr-3 h-5 w-5 ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {item.subItems.map((subItem: any) => {
                const isSubActive = location.pathname === subItem.href;
                return (
                  <button
                    key={subItem.name}
                    onClick={() => {
                      navigate(subItem.href);
                      setIsSidebarOpen(false);
                    }}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg w-full ${
                      isSubActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {subItem.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.name}
        onClick={() => {
          navigate(item.href);
          setIsSidebarOpen(false);
        }}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg w-full ${
          isActive
            ? 'bg-blue-50 text-blue-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <item.icon
          className={`mr-3 h-5 w-5 ${
            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
          }`}
        />
        {item.name}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          {isSidebarOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)} />
          )}
          <div
            className={`fixed inset-y-0 left-0 flex w-64 flex-col bg-white transition-transform duration-300 ease-in-out ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <h1 className="text-xl font-semibold text-gray-900">VetQure</h1>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map(renderNavItem)}
            </nav>
            <div className="border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-gray-900">VetQure</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map(renderNavItem)}
          </nav>
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1"></div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <button
                  type="button"
                  className="flex max-w-xs items-center rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.email?.[0].toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
