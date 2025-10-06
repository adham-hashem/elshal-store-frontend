import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { requestNotificationPermission, onForegroundMessage } from './services/firebase';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

function AppContent() {
  const { user } = useAuth();

  // Register FCM token with backend
  const registerFCMToken = useCallback(async (token: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(`${apiUrl}/api/notification/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register notification token');
      }

      const data = await response.json();
      console.log('FCM token registered successfully:', data);
      toast.success('تم تسجيل إشعارات الجهاز بنجاح', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error registering FCM token:', error);
      toast.error(
        error instanceof Error
          ? `فشل تسجيل إشعارات الجهاز: ${error.message}`
          : 'فشل تسجيل إشعارات الجهاز',
        {
          position: 'top-right',
          autoClose: 5000,
        }
      );
    }
  }, []);

  // Handle FCM token registration for admin users
  useEffect(() => {
    let isMounted = true;

    const initializeFCM = async () => {
      // Only register for Admin users
      if (!user || !user.role?.includes('Admin')) {
        console.log('User is not admin, skipping FCM registration');
        return;
      }

      try {
        console.log('Requesting FCM notification permission for admin...');
        const token = await requestNotificationPermission();
        
        if (!isMounted) return;

        if (token) {
          console.log('FCM token received:', token);
          await registerFCMToken(token);
        } else {
          console.warn('No FCM token received');
          toast.warn('لم يتم الحصول على رمز الإشعارات. قد لا تتلقى إشعارات.', {
            position: 'top-right',
            autoClose: 5000,
          });
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error initializing FCM:', error);
        toast.error('فشل طلب إذن الإشعارات. قد لا تتلقى إشعارات.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    };

    // Add a small delay to ensure auth state is fully settled
    const timeoutId = setTimeout(() => {
      initializeFCM();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [user, registerFCMToken]);

  // Handle foreground notifications
  useEffect(() => {
    onForegroundMessage((payload) => {
      const { notification } = payload;
      toast.info(`${notification?.title}: ${notification?.body}`, {
        position: 'top-right',
        autoClose: 5000,
      });
    });
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
              <Route index element={<Navigate to="products" replace />} />
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

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;