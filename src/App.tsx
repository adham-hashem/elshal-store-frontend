// src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { onForegroundMessage } from './services/firebase';

// Public Pages
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import WomenPage from './pages/WomenPage';
import ChildrenPage from './pages/ChildrenPage';
import OffersPage from './pages/OffersPage';
import NotFoundPage from './pages/NotFoundPage';
import MyOrders from './pages/MyOrders';
import OrderDetails from './pages/OrderDetails';

// Admin Pages
import AdminPage from './pages/admin/AdminPage';
import ProductsManagement from './pages/admin/ProductsManagement';
import OrdersManagement from './pages/admin/OrdersManagement';
import CustomersManagement from './pages/admin/CustomersManagement';
import DiscountCodesManagement from './pages/admin/DiscountCodesManagement';
import ShippingManagement from './pages/admin/ShippingManagement';
import { Unsubscribe } from 'firebase/messaging';
import OrderNotifications from './pages/admin/OrderNotifications';
import CompleteProfile from './pages/CompleteProfile';

function AppContent() {
  // 🚨 THE PROBLEMATIC useEffect FOR FCM REGISTRATION HAS BEEN REMOVED. 🚨
  // Its logic is now correctly placed in NotificationButton.tsx

  // Handle foreground notifications (This part is correct and should remain)
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;
    
    // Check for notification support before subscribing
    if ('Notification' in window) {
      unsubscribe = onForegroundMessage((payload) => {
        const { notification } = payload;
        toast.info(<div><strong>{notification?.title}</strong><br/>{notification?.body}</div>, {
          position: 'top-right',
          autoClose: 6000,
        });
      });
    }

    // Cleanup subscription on component unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<Header />} />
        </Routes>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/women" element={<WomenPage />} />
            <Route path="/children" element={<ChildrenPage />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/order/:id" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPage />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="notifications" replace />} />
              <Route path="notifications" element={<OrderNotifications />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="customers" element={<CustomersManagement />} />
              <Route path="discounts" element={<DiscountCodesManagement />} />
              <Route path="shipping" element={<ShippingManagement />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<Footer />} />
        </Routes>

        <ToastContainer />
      </div>
    </Router>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;