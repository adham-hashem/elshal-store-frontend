import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, X, Check } from 'lucide-react';

// OrderNotification interface matching the backend response
interface OrderNotification {
  id: string;
  orderId: string;
  title: string;
  body: string;
  sentAt: string;
  success: boolean;
  errorMessage: string | null;
  isRead: boolean;
}

interface PaginatedNotificationsResponse {
  items: OrderNotification[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const OrderNotifications: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<OrderNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Utility function to format notification body with Egyptian Pound
  const formatNotificationBody = (body: string) => {
    return body.replace(/\$/g, 'جنية مصري ');
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (!apiUrl) {
          throw new Error('API base URL is not configured.');
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found. Please log in again.');
        }

        const response = await fetch(`${apiUrl}/api/OrderNotifications?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            throw new Error('Unauthorized: Please log in again.');
          }
          const errorText = await response.text();
          throw new Error(`Failed to fetch notifications: ${response.status} ${errorText}`);
        }

        const data: PaginatedNotificationsResponse = await response.json();

        if (!Array.isArray(data.items)) {
          // console.error('Expected an array for data.items, received:', data.items);
          setNotifications([]);
          throw new Error('Invalid response format: Expected an array of notifications.');
        }

        // Map backend response to frontend interface (handle missing isRead)
        const mappedNotifications = data.items.map((item) => ({
          ...item,
          isRead: item.isRead ?? false, // Default to false if isRead is not provided
        }));

        setNotifications(mappedNotifications);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        // console.error('Error fetching notifications:', err);
        setError(err.message || 'An error occurred while fetching notifications.');
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchNotifications();
    } else {
      setError('You must be logged in to view notifications.');
      setLoading(false);
      setNotifications([]);
    }
  }, [isAuthenticated, pageNumber]);

  const handleViewNotification = (notification: OrderNotification) => {
    setSelectedNotification(notification);
  };

  const handleCloseDetails = () => {
    setSelectedNotification(null);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found. Please log in again.');
      }

      const response = await fetch(`${apiUrl}/api/OrderNotifications/${notificationId}/mark-as-read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to mark notification as read: ${response.status} ${errorText}`);
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      if (selectedNotification?.id === notificationId) {
        setSelectedNotification({ ...selectedNotification, isRead: true });
      }
    } catch (err: any) {
      // console.error('Error marking notification as read:', err);
      setError(err.message || 'An error occurred while marking notification as read. Please try again or contact support.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل الإشعارات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500 bg-red-50 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">إشعارات الطلبات</h2>

      {selectedNotification ? (
        <div className="mb-6 p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">تفاصيل الإشعار</h3>
          <div className="space-y-3">
            {/* <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">رقم الطلب:</span>
              <span className="text-gray-900">{selectedNotification.orderId}</span>
            </div> */}
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">العنوان:</span>
              <span className="text-gray-900">{selectedNotification.title}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">الرسالة:</span>
              <span className="text-gray-900">{formatNotificationBody(selectedNotification.body)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">تاريخ الإنشاء:</span>
              <span className="text-gray-900">{formatDate(selectedNotification.sentAt)}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">الحالة:</span>
              <span className="text-gray-900">{selectedNotification.isRead ? 'مقروء' : 'غير مقروء'}</span>
            </div>
            {/* <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">نجاح الإرسال:</span>
              <span className="text-gray-900">{selectedNotification.success ? 'نعم' : 'لا'}</span>
            </div> */}
            {selectedNotification.errorMessage && (
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="text-gray-500 font-medium">رسالة الخطأ:</span>
                <span className="text-gray-900">{selectedNotification.errorMessage}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex space-x-4 space-x-reverse">
            {!selectedNotification.isRead && (
              <button
                onClick={() => handleMarkAsRead(selectedNotification.id)}
                className="bg-green-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center text-sm sm:text-base"
              >
                <Check className="h-4 w-4 ml-2" />
                تحديد كمقروء
              </button>
            )}
            <button
              onClick={handleCloseDetails}
              className="bg-gray-300 text-gray-700 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center text-sm sm:text-base"
            >
              <X className="h-4 w-4 ml-2" />
              إغلاق
            </button>
          </div>
        </div>
      ) : notifications.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-xl shadow-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الطلب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العنوان</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الرسالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نجاح الإرسال</th> */}
                    {/* <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="hover:bg-gray-50 transition-colors">
                      {/* <td className={`px-6 py-4 whitespace-nowrap text-sm ${notification.isRead ? 'text-gray-900' : 'font-bold text-gray-900'}`}>
                        {notification.orderId}
                      </td> */}
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${notification.isRead ? 'text-gray-500' : 'font-bold text-gray-900'}`}>
                        {notification.title}
                        {!notification.isRead && (
                          <span className="inline-block w-2 h-2 mr-2 rounded-full bg-pink-600"></span>
                        )}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${notification.isRead ? 'text-gray-500' : 'font-bold text-gray-900'}`}>
                        {formatNotificationBody(notification.body)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(notification.sentAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notification.isRead ? 'مقروء' : 'غير مقروء'}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {notification.success ? 'نعم' : 'لا'}
                      </td> */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewNotification(notification)}
                          className="flex items-center text-pink-600 hover:text-pink-800"
                        >
                          <Bell className="h-4 w-4 ml-1" />
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {/* <p className={`font-semibold text-sm ${notification.isRead ? 'text-gray-900' : 'font-bold text-gray-900'}`}>
                      {notification.orderId}
                    </p> */}
                    <p className={`text-xs ${notification.isRead ? 'text-gray-500' : 'font-bold text-gray-900'}`}>
                      {notification.title}
                      {!notification.isRead && (
                        <span className="inline-block w-2 h-2 mr-2 rounded-full bg-pink-600"></span>
                      )}
                    </p>
                    <p className={`text-xs ${notification.isRead ? 'text-gray-500' : 'font-bold text-gray-900'}`}>
                      {formatNotificationBody(notification.body)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleViewNotification(notification)}
                    className="flex items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded hover:bg-pink-100"
                  >
                    <Bell className="h-3 w-3 ml-1" />
                    التفاصيل
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">تاريخ الإنشاء:</span>
                    <span className="text-xs text-gray-900">{formatDate(notification.sentAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">الحالة:</span>
                    <span className="text-xs text-gray-900">{notification.isRead ? 'مقروء' : 'غير مقروء'}</span>
                  </div>
                  {/* <div className="flex justify-between">
                    <span className="text-xs text-gray-500">نجاح الإرسال:</span>
                    <span className="text-xs text-gray-900">{notification.success ? 'نعم' : 'لا'}</span>
                  </div> */}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex justify-between items-center">
            <button
              onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
              disabled={pageNumber === 1}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              السابق
            </button>
            <span className="text-gray-600">
              الصفحة {pageNumber} من {totalPages}
            </span>
            <button
              onClick={() => setPageNumber((prev) => Math.min(prev + 1, totalPages))}
              disabled={pageNumber === totalPages}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-50"
            >
              التالي
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">لا توجد إشعارات طلبات متاحة حالياً</p>
        </div>
      )}
    </div>
  );
};

export default OrderNotifications;