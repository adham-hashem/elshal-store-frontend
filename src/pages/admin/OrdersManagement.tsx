import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Ship, 
  Package, 
  Eye, 
  Search, 
  Filter, 
  AlertCircle, 
  Trash2, 
  User, 
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Interfaces based on backend DTOs
interface OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  priceAtPurchase: number;
  size: string;
  color: string;
}

interface OrderResponseDto {
  id: string;
  orderNumber: string;
  customerId: string;
  total: number;
  paymentMethod: 'Cash' | 'Card' | 'OnlinePayment';
  status: 'UnderReview' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  discountCodeUsed: string | null;
  paymentTransactionId: string | null;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  governorate?: string;
  items: OrderItemResponseDto[];
}

interface PaginatedOrdersResponse {
  items: OrderResponseDto[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const OrdersManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponseDto | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<OrderResponseDto[]>([]);
  const [showCustomerOrders, setShowCustomerOrders] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;
  const pageSize = 10;

  const statusSequence = ['UnderReview', 'Confirmed', 'Shipped', 'Delivered'];

  const getPreviousStatus = (currentStatus: string): string | null => {
    if (currentStatus === 'Cancelled') {
      return 'UnderReview';
    }
    const index = statusSequence.findIndex(s => s === currentStatus);
    if (index > 0) {
      return statusSequence[index - 1];
    }
    return null;
  };

  // Check authentication and role on mount
  useEffect(() => {
    if (!isAuthenticated) {
      // console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

    if (userRole !== 'admin') {
      // console.log('User is not admin, redirecting to home');
      navigate('/');
      return;
    }

    fetchOrders(currentPage);
  }, [isAuthenticated, userRole, navigate, currentPage]);

  // Helper functions to map numeric values to strings
  const mapStatus = (status: number | string): 'UnderReview' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled' => {
    switch (Number(status)) {
      case 0: return 'UnderReview';
      case 1: return 'Confirmed';
      case 2: return 'Shipped';
      case 3: return 'Delivered';
      case 4: return 'Cancelled';
      default: return 'UnderReview';
    }
  };

  const mapPaymentMethod = (method: number | string): 'Cash' | 'Card' | 'OnlinePayment' => {
    switch (Number(method)) {
      case 0: return 'Cash';
      case 1: return 'Card';
      case 2: return 'OnlinePayment';
      default: return 'Cash';
    }
  };

  // Fetch orders from backend
  const fetchOrders = async (page: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      // console.log('Retrieved token:', token ? 'Token found' : 'No token found');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      // console.log('Fetching orders from:', `${apiUrl}/api/orders?pageNumber=${page}&pageSize=${pageSize}`);
      const response = await fetch(
        `${apiUrl}/api/orders?pageNumber=${page}&pageSize=${pageSize}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // console.log('Response status:', response.status);
      const responseText = await response.text();
      // console.log('Raw response:', responseText);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        throw new Error(`Failed to fetch orders: ${response.status} ${responseText}`);
      }

      const data: PaginatedOrdersResponse = JSON.parse(responseText);
      
      // Map numeric status and paymentMethod to string values
      const mappedOrders = data.items.map(order => ({
        ...order,
        status: mapStatus(order.status),
        paymentMethod: mapPaymentMethod(order.paymentMethod),
      }));

      // console.log('Parsed and mapped data:', { ...data, items: mappedOrders });
      setOrders(mappedOrders);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.pageNumber);
    } catch (err) {
      // console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Search order by order number
  const searchOrderByNumber = async (orderNumber: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      // console.log('Searching for order:', orderNumber);
      const response = await fetch(
        `${apiUrl}/api/orders/number/${orderNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          alert('لم يتم العثور على الطلب');
          return;
        }
        throw new Error(`Failed to search order: ${response.status}`);
      }

      const orderDetails: OrderResponseDto = await response.json();
      const mappedOrderDetails = {
        ...orderDetails,
        status: mapStatus(orderDetails.status),
        paymentMethod: mapPaymentMethod(orderDetails.paymentMethod),
      };
      
      setSelectedOrder(mappedOrderDetails);
      setShowOrderDetails(true);
    } catch (err) {
      // console.error('Error searching order:', err);
      alert(err instanceof Error ? err.message : 'فشل في البحث عن الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Get customer orders
  const getCustomerOrders = async (customerId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      // console.log('Fetching customer orders:', customerId);
      const response = await fetch(
        `${apiUrl}/api/orders/customer/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          alert('لا توجد طلبات لهذا العميل');
          return;
        }
        throw new Error(`Failed to fetch customer orders: ${response.status}`);
      }

      const orders: OrderResponseDto[] = await response.json();
      const mappedOrders = orders.map(order => ({
        ...order,
        status: mapStatus(order.status),
        paymentMethod: mapPaymentMethod(order.paymentMethod),
      }));
      
      setCustomerOrders(mappedOrders);
      setShowCustomerOrders(true);
    } catch (err) {
      // console.error('Error fetching customer orders:', err);
      alert(err instanceof Error ? err.message : 'فشل في جلب طلبات العميل');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      // console.log('Updating order status:', { orderId, newStatus });
      const response = await fetch(
        `${apiUrl}/api/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newStatus),
        }
      );

      // console.log('Update status response:', response.status);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        const errorText = await response.text();
        throw new Error(`Failed to update order status: ${response.status} ${errorText}`);
      }

      await fetchOrders(currentPage);
      alert('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      // console.error('Error updating order status:', err);
      alert(err instanceof Error ? err.message : 'فشل في تحديث حالة الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      setLoading(true);
      // console.log('Deleting order:', orderId);
      const response = await fetch(
        `${apiUrl}/api/orders/${orderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        const errorText = await response.text();
        throw new Error(`Failed to delete order: ${response.status} ${errorText}`);
      }

      await fetchOrders(currentPage);
      alert('تم حذف الطلب بنجاح');
    } catch (err) {
      // console.error('Error deleting order:', err);
      alert(err instanceof Error ? err.message : 'فشل في حذف الطلب');
    } finally {
      setLoading(false);
    }
  };

  // Get order details
  const getOrderDetails = async (orderId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        throw new Error('No authentication token found. Please log in again.');
      }

      // console.log('Fetching order details for:', orderId);
      const response = await fetch(
        `${apiUrl}/api/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // console.log('Order details response:', response.status);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('Unauthorized: Please log in again.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('Forbidden: Admin access required.');
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch order details: ${response.status} ${errorText}`);
      }

      const orderDetails: OrderResponseDto = await response.json();
      // Map status and paymentMethod for order details
      const mappedOrderDetails = {
        ...orderDetails,
        status: mapStatus(orderDetails.status),
        paymentMethod: mapPaymentMethod(orderDetails.paymentMethod),
      };
      // console.log('Order details:', mappedOrderDetails);
      setSelectedOrder(mappedOrderDetails);
      setShowOrderDetails(true);
    } catch (err) {
      // console.error('Error fetching order details:', err);
      alert(err instanceof Error ? err.message : 'فشل في جلب تفاصيل الطلب');
    }
  };

  // Toggle row expansion
  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'underreview': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'underreview': return 'تحت المراجعة';
      case 'confirmed': return 'مؤكد';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التسليم';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'الدفع عند الاستلام';
      case 'card': return 'بطاقة ائتمانية';
      case 'onlinepayment': return 'دفع إلكتروني';
      default: return method;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Check if search term looks like an order number
      if (searchTerm.startsWith('ORD') || searchTerm.includes('-')) {
        searchOrderByNumber(searchTerm.trim());
      } else {
        // Filter existing orders
        fetchOrders(1);
      }
    }
  };

  // Filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.fullName && order.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' ||
      order.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesPaymentMethod = paymentMethodFilter === 'all' ||
      order.paymentMethod.toLowerCase() === paymentMethodFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesPaymentMethod;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل الطلبات...</span>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-full overflow-hidden bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-0">إدارة الطلبات</h2>
        <div className="text-sm text-gray-600">
          إجمالي الطلبات: {totalItems}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mb-2 sm:mb-0 sm:ml-2" />
          <span className="text-red-800 flex-1">{error}</span>
          <button
            onClick={() => fetchOrders(currentPage)}
            className="mt-2 sm:mt-0 sm:mr-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm text-red-800"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Mobile Search Bar */}
      <div className="block sm:hidden mb-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="البحث برقم الطلب"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            dir="rtl"
          />
          <button
            type="submit"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-pink-600 text-white px-2 py-1 rounded text-sm"
          >
            بحث
          </button>
        </form>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="block sm:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md"
        >
          <Filter className="h-4 w-4 ml-2" />
          فلترة الطلبات
          {showFilters ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
        </button>
      </div>

      {/* Filters */}
      <div className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 sm:p-6 mb-6 ${showFilters ? 'block' : 'hidden sm:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="hidden sm:block relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="البحث برقم الطلب أو معرف العميل"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
              dir="rtl"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-right"
            dir="rtl"
          >
            <option value="all">جميع الحالات</option>
            <option value="underreview">تحت المراجعة</option>
            <option value="confirmed">مؤكد</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التسليم</option>
            <option value="cancelled">ملغي</option>
          </select>

          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 text-right"
            dir="rtl"
          >
            <option value="all">جميع طرق الدفع</option>
            <option value="cash">الدفع عند الاستلام</option>
            <option value="card">بطاقة ائتمانية</option>
            <option value="onlinepayment">دفع إلكتروني</option>
          </select>

          <button
            onClick={() => fetchOrders(1)}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 transition-colors flex items-center justify-center"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد طلبات متاحة</p>
          <button
            onClick={() => fetchOrders(currentPage)}
            className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            disabled={loading}
          >
            إعادة التحميل
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الطلب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">معرف العميل</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">طريقة الدفع</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عناصر الطلب</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const previous = getPreviousStatus(order.status);
                    return (
                    <React.Fragment key={order.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => getCustomerOrders(order.customerId)}
                            className="text-pink-600 hover:text-pink-800 underline"
                          >
                            {order.customerId.substring(0, 8)}...
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {order.total.toFixed(2)} جنيه
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getPaymentMethodText(order.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(order.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleRowExpansion(order.id)}
                            className="text-gray-600 hover:text-gray-800 underline"
                          >
                            {expandedRows.has(order.id) ? 'إخفاء العناصر' : 'عرض العناصر'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-reverse space-x-2">
                            <button
                              onClick={() => getOrderDetails(order.id)}
                              className="text-pink-600 hover:text-pink-900 p-1"
                              title="عرض التفاصيل"
                              disabled={loading}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {order.status.toLowerCase() === 'underreview' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Confirmed')}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors flex items-center"
                                title="تأكيد الطلب"
                                disabled={loading}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                تأكيد
                              </button>
                            )}
                            {order.status.toLowerCase() === 'confirmed' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Shipped')}
                                className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700 transition-colors flex items-center"
                                title="تم الشحن"
                                disabled={loading}
                              >
                                <Ship className="h-3 w-3 mr-1" />
                                تم الشحن
                              </button>
                            )}
                            {order.status.toLowerCase() === 'shipped' && (
                              <button
                                onClick={() => updateOrderStatus(order.id, 'Delivered')}
                                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors flex items-center"
                                title="تم التسليم"
                                disabled={loading}
                              >
                                <Package className="h-3 w-3 mr-1" />
                                تم التسليم
                              </button>
                            )}
                            {previous && (
                              <button
                                onClick={() => updateOrderStatus(order.id, previous)}
                                className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 transition-colors flex items-center"
                                title={`التراجع إلى ${getStatusText(previous)}`}
                                disabled={loading}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                تراجع
                              </button>
                            )}
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="حذف الطلب"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows.has(order.id) && (
                        <tr>
                          <td colSpan={8} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-3">
                              <p className="text-sm font-medium text-gray-700">عناصر الطلب</p>
                              {order.items.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-white rounded-lg border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <Package className="h-4 w-4 text-pink-600 ml-2" />
                                      <p className="font-medium text-gray-900">{item.productName}</p>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <p><span className="font-medium">كود المنتج:</span> {item.productCode}</p>
                                      <p><span className="font-medium">الكمية:</span> {item.quantity}</p>
                                      {item.size && <p><span className="font-medium">المقاس:</span> {item.size}</p>}
                                      {item.color && <p><span className="font-medium">اللون:</span> {item.color}</p>}
                                    </div>
                                  </div>
                                  <p className="font-semibold text-gray-900 mt-3 sm:mt-0">
                                    {item.priceAtPurchase.toFixed(2)} جنيه
                                  </p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {filteredOrders.map((order) => {
              const previous = getPreviousStatus(order.status);
              return (
              <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">العميل:</span>
                    <button
                      onClick={() => getCustomerOrders(order.customerId)}
                      className="text-sm text-pink-600 hover:text-pink-800 underline"
                    >
                      {order.customerId.substring(0, 8)}...
                    </button>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">المبلغ:</span>
                    <span className="text-sm font-semibold text-gray-900">{order.total.toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">طريقة الدفع:</span>
                    <span className="text-sm text-gray-900">{getPaymentMethodText(order.paymentMethod)}</span>
                  </div>
                </div>

                {expandedRows.has(order.id) && (
                  <div className="border-t pt-3 mt-3">
                    <div className="space-y-3">
                      {order.fullName && (
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 ml-2" />
                          <span className="text-sm text-gray-600">{order.fullName}</span>
                        </div>
                      )}
                      {order.phoneNumber && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-400 ml-2" />
                          <span className="text-sm text-gray-600">{order.phoneNumber}</span>
                        </div>
                      )}
                      {order.address && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-400 ml-2" />
                          <span className="text-sm text-gray-600">{order.address}, {order.governorate}</span>
                        </div>
                      )}
                      {order.discountCodeUsed && (
                        <div className="flex items-center">
                          <span className="text-sm text-green-600 font-medium">كود الخصم: {order.discountCodeUsed}</span>
                        </div>
                      )}
                      <div className="border-t pt-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">عناصر الطلب</p>
                        {order.items.map((item, index) => (
                          <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-200">
                            <div className="flex items-center">
                              <Package className="h-4 w-4 text-pink-600 ml-2" />
                              <p className="font-medium text-gray-900">{item.productName}</p>
                            </div>
                            <div className="text-sm text-gray-600 mt-2 space-y-1">
                              <p><span className="font-medium">كود المنتج:</span> {item.productCode}</p>
                              <p><span className="font-medium">الكمية:</span> {item.quantity}</p>
                              {item.size && <p><span className="font-medium">المقاس:</span> {item.size}</p>}
                              {item.color && <p><span className="font-medium">اللون:</span> {item.color}</p>}
                              <p><span className="font-medium">السعر:</span> {item.priceAtPurchase.toFixed(2)} جنيه</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleRowExpansion(order.id)}
                    className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded"
                  >
                    {expandedRows.has(order.id) ? (
                      <>
                        <ChevronUp className="h-3 w-3 ml-1" />
                        أقل
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 ml-1" />
                        المزيد
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => getOrderDetails(order.id)}
                    className="flex items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded"
                    disabled={loading}
                  >
                    <Eye className="h-3 w-3 ml-1" />
                    التفاصيل
                  </button>

                  {order.status.toLowerCase() === 'underreview' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Confirmed')}
                      className="flex items-center text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                      disabled={loading}
                    >
                      <Check className="h-3 w-3 ml-1" />
                      تأكيد
                    </button>
                  )}

                  {order.status.toLowerCase() === 'confirmed' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Shipped')}
                      className="flex items-center text-xs text-white bg-purple-600 px-2 py-1 rounded hover:bg-purple-700"
                      disabled={loading}
                    >
                      <Ship className="h-3 w-3 ml-1" />
                      شحن
                    </button>
                  )}

                  {order.status.toLowerCase() === 'shipped' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'Delivered')}
                      className="flex items-center text-xs text-white bg-green-600 px-2 py-1 rounded hover:bg-green-700"
                      disabled={loading}
                    >
                      <Package className="h-3 w-3 ml-1" />
                      تسليم
                    </button>
                  )}

                  {previous && (
                    <button
                      onClick={() => updateOrderStatus(order.id, previous)}
                      className="flex items-center text-xs text-white bg-yellow-600 px-2 py-1 rounded hover:bg-yellow-700"
                      disabled={loading}
                    >
                      <RefreshCw className="h-3 w-3 ml-1" />
                      تراجع
                    </button>
                  )}

                  <button
                    onClick={() => deleteOrder(order.id)}
                    className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100"
                    disabled={loading}
                  >
                    <Trash2 className="h-3 w-3 ml-1" />
                    حذف
                  </button>
                </div>
              </div>
            )})}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500 mb-4 sm:mb-0 text-center sm:text-right">
              عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من {totalItems}
            </div>
            <div className="flex items-center justify-center space-x-reverse space-x-2">
              <button
                onClick={() => fetchOrders(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-sm text-gray-700 px-2">
                {currentPage} من {totalPages}
              </span>
              <button
                onClick={() => fetchOrders(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Orders Modal */}
      {showCustomerOrders && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  طلبات العميل ({customerOrders.length} طلب)
                </h3>
                <button
                  onClick={() => setShowCustomerOrders(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {customerOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-500">{formatDate(order.date)}</p>
                        {order.fullName && (
                          <p className="text-sm text-gray-600">
                            <User className="inline h-4 w-4 ml-1" />
                            {order.fullName}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-start sm:items-end mt-2 sm:mt-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} mb-1`}>
                          {getStatusText(order.status)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{order.total.toFixed(2)} جنيه</span>
                      </div>
                    </div>
                    <div className="border-t pt-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">عناصر الطلب</p>
                      {order.items.map((item, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 border border-gray-200">
                          <div className="flex items-center">
                            <Package className="h-4 w-4 text-pink-600 ml-2" />
                            <p className="font-medium text-gray-900">{item.productName}</p>
                          </div>
                          <div className="text-sm text-gray-600 mt-2 space-y-1">
                            <p><span className="font-medium">كود المنتج:</span> {item.productCode}</p>
                            <p><span className="font-medium">الكمية:</span> {item.quantity}</p>
                            {item.size && <p><span className="font-medium">المقاس:</span> {item.size}</p>}
                            {item.color && <p><span className="font-medium">اللون:</span> {item.color}</p>}
                            <p><span className="font-medium">السعر:</span> {item.priceAtPurchase.toFixed(2)} جنيه</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => {
                          setShowCustomerOrders(false);
                          getOrderDetails(order.id);
                        }}
                        className="flex items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded hover:bg-pink-100"
                      >
                        <Eye className="h-3 w-3 ml-1" />
                        عرض التفاصيل
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  تفاصيل الطلب #{selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowOrderDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">معرف العميل</label>
                    <p className="text-sm text-gray-900 break-all">{selectedOrder.customerId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">التاريخ</label>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">الحالة</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusText(selectedOrder.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">طريقة الدفع</label>
                    <p className="text-sm text-gray-900">{getPaymentMethodText(selectedOrder.paymentMethod)}</p>
                  </div>
                </div>

                {selectedOrder.fullName && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">الاسم الكامل</label>
                      <p className="text-sm text-gray-900">{selectedOrder.fullName}</p>
                    </div>
                    {selectedOrder.phoneNumber && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                        <p className="text-sm text-gray-900">{selectedOrder.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedOrder.address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">العنوان</label>
                    <p className="text-sm text-gray-900">{selectedOrder.address}, {selectedOrder.governorate}</p>
                  </div>
                )}

                {selectedOrder.discountCodeUsed && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">كود الخصم المستخدم</label>
                    <p className="text-sm text-green-600 font-medium">{selectedOrder.discountCodeUsed}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">عناصر الطلب</label>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-pink-600 ml-2" />
                              <p className="font-semibold text-gray-900">{item.productName}</p>
                            </div>
                            <a
                              href={`https://www.elshal.store/product/${item.productId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-pink-600 hover:text-pink-800 underline flex items-center"
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              عرض المنتج
                            </a>
                          </div>
                          <div className="text-sm text-gray-600 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <p><span className="font-medium">كود المنتج:</span> {item.productCode}</p>
                            <p><span className="font-medium">الكمية:</span> {item.quantity}</p>
                            {item.size && <p><span className="font-medium">المقاس:</span> {item.size}</p>}
                            {item.color && <p><span className="font-medium">اللون:</span> {item.color}</p>}
                          </div>
                        </div>
                        <p className="font-semibold text-gray-900 mt-3 sm:mt-0 text-lg">
                          {item.priceAtPurchase.toFixed(2)} جنيه
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">الإجمالي:</span>
                    <span className="text-lg font-bold text-pink-600">{selectedOrder.total.toFixed(2)} جنيه</span>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">إجراءات الطلب</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status.toLowerCase() === 'underreview' && (
                      <button
                        onClick={() => {
                          setShowOrderDetails(false);
                          updateOrderStatus(selectedOrder.id, 'Confirmed');
                        }}
                        className="flex items-center bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 ml-1" />
                        تأكيد الطلب
                      </button>
                    )}
                    {selectedOrder.status.toLowerCase() === 'confirmed' && (
                      <button
                        onClick={() => {
                          setShowOrderDetails(false);
                          updateOrderStatus(selectedOrder.id, 'Shipped');
                        }}
                        className="flex items-center bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <Ship className="h-4 w-4 ml-1" />
                        تم الشحن
                      </button>
                    )}
                    {selectedOrder.status.toLowerCase() === 'shipped' && (
                      <button
                        onClick={() => {
                          setShowOrderDetails(false);
                          updateOrderStatus(selectedOrder.id, 'Delivered');
                        }}
                        className="flex items-center bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <Package className="h-4 w-4 ml-1" />
                        تم التسليم
                      </button>
                    )}
                    {selectedOrder.status.toLowerCase() !== 'delivered' && selectedOrder.status.toLowerCase() !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setShowOrderDetails(false);
                          updateOrderStatus(selectedOrder.id, 'Cancelled');
                        }}
                        className="flex items-center bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <X className="h-4 w-4 ml-1" />
                        إلغاء الطلب
                      </button>
                    )}
                    {getPreviousStatus(selectedOrder.status) && (
                      <button
                        onClick={() => {
                          setShowOrderDetails(false);
                          updateOrderStatus(selectedOrder.id, getPreviousStatus(selectedOrder.status)!);
                        }}
                        className="flex items-center bg-yellow-600 text-white px-3 py-2 rounded hover:bg-yellow-700 transition-colors text-sm"
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 ml-1" />
                        التراجع إلى {getStatusText(getPreviousStatus(selectedOrder.status)!)}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowOrderDetails(false);
                        deleteOrder(selectedOrder.id);
                      }}
                      className="flex items-center bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors text-sm"
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف الطلب
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;