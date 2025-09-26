import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Users, ShoppingCart, LogOut, Tag, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminPage: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    alert('تم تسجيل خروج المدير بنجاح');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-reverse space-x-4">
              <img src="/اللجو.jpg" alt="الشال" className="h-10 w-10 object-contain" />
              <div>
                <h1 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'serif' }}>
                  لوحة تحكم الشال
                </h1>
                <p className="text-sm text-gray-600">مرحباً مدير النظام</p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
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
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <nav className="space-y-2">
                <NavLink
                  to="/admin/products"
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Package size={20} />
                  <span>إدارة المنتجات</span>
                </NavLink>
                <NavLink
                  to="/admin/orders"
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <ShoppingCart size={20} />
                  <span>إدارة الطلبات</span>
                </NavLink>
                <NavLink
                  to="/admin/customers"
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Users size={20} />
                  <span>إدارة العملاء</span>
                </NavLink>
                <NavLink
                  to="/admin/discounts"
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Tag size={20} />
                  <span>أكواد الخصم</span>
                </NavLink>
                <NavLink
                  to="/admin/shipping"
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-reverse space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-pink-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  <Truck size={20} />
                  <span>رسوم الشحن</span>
                </NavLink>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;