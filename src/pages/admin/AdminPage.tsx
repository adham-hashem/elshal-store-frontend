// src/pages/admin/AdminPage.tsx

import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Users, ShoppingCart, LogOut, Tag, Truck, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationButton from '../../components/NotificationButton';

const AdminPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { to: '/admin/notifications', icon: Package, label: 'إشعارات الطلبات' },
    { to: '/admin/products', icon: Package, label: 'إدارة المنتجات' },
    { to: '/admin/orders', icon: ShoppingCart, label: 'إدارة الطلبات' },
    { to: '/admin/customers', icon: Users, label: 'إدارة العملاء' },
    { to: '/admin/discounts', icon: Tag, label: 'أكواد الخصم' },
    { to: '/admin/shipping', icon: Truck, label: 'رسوم الشحن' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-reverse space-x-2 sm:space-x-4">
              <img src="/اللجو.jpg" alt="الشال" className="h-8 w-8 sm:h-10 sm:w-10 object-contain" />
              <div>
                <h1 className="text-base sm:text-xl font-bold text-gray-800" style={{ fontFamily: 'serif' }}>
                  لوحة تحكم الشال
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">مرحباً مدير النظام</p>
              </div>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-reverse space-x-4">
              <NotificationButton />
              <Link
                to="/"
                className="flex items-center space-x-reverse space-x-2 text-gray-600 hover:text-pink-600 transition-colors"
              >
                <ArrowRight size={20} />
                <span>العودة للموقع</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-reverse space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <LogOut size={20} />
                <span>تسجيل خروج</span>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-reverse space-x-2">
              <NotificationButton />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-pink-600 transition-colors"
                aria-label="القائمة"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <nav className="container mx-auto px-3 py-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
              <div className="border-t pt-2 space-y-1">
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-reverse space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowRight size={20} />
                  <span>العودة للموقع</span>
                </Link>
                <button
                  onClick={() => {
                    closeMobileMenu();
                    handleLogout();
                  }}
                  className="w-full flex items-center space-x-reverse space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut size={20} />
                  <span>تسجيل خروج</span>
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                  >
                    <item.icon size={20} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;