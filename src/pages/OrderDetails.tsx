import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Package, ArrowRight } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  priceAtPurchase: number;
  size: string;
  color: string;
}

interface Order {
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
  items: OrderItem[];
}

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        if (!apiUrl) {
          throw new Error('API base URL is not configured.');
        }

        if (!id) {
          throw new Error('Order ID is missing.');
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found. Please log in again.');
        }

        const response = await fetch(`${apiUrl}/api/orders/${id}`, {
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
          throw new Error(`Failed to fetch order: ${response.status} ${errorText}`);
        }

        const data: Order = await response.json();
        
        // Map numeric status and paymentMethod to string values
        const mappedOrder = {
          ...data,
          status: mapStatus(data.status),
          paymentMethod: mapPaymentMethod(data.paymentMethod),
        };

        setOrder(mappedOrder);
      } catch (err: any) {
        // console.error('Error fetching order:', err);
        setError(err.message || 'An error occurred while fetching order details.');
      } finally {
        setLoading(false);
      }
    };

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

    if (isAuthenticated) {
      fetchOrder();
    } else {
      setError('You must be logged in to view order details.');
      setLoading(false);
    }
  }, [isAuthenticated, id]);

  // Helper functions (same as MyOrders for consistency)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل تفاصيل الطلب...</span>
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

  if (!order) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">لم يتم العثور على الطلب.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">تفاصيل الطلب #{order.orderNumber}</h1>
        <Link
          to="/my-orders"
          className="flex items-center text-pink-600 hover:text-pink-800"
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          العودة إلى الطلبات
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">معلومات الطلب</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">التاريخ:</span>
                <span className="text-gray-900">{formatDate(order.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">الحالة:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">طريقة الدفع:</span>
                <span className="text-gray-900">{getPaymentMethodText(order.paymentMethod)}</span>
              </div>
              {order.paymentTransactionId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">رقم المعاملة:</span>
                  <span className="text-gray-900">{order.paymentTransactionId}</span>
                </div>
              )}
              {order.discountCodeUsed && (
                <div className="flex justify-between">
                  <span className="text-gray-500">كود الخصم:</span>
                  <span className="text-gray-900">{order.discountCodeUsed}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">الإجمالي:</span>
                <span className="text-gray-900 font-semibold">{order.total.toFixed(2)} جنيه</span>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">معلومات الشحن</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">الاسم:</span>
                <span className="text-gray-900">{order.fullName || 'غير متوفر'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">رقم الهاتف:</span>
                <span className="text-gray-900">{order.phoneNumber || 'غير متوفر'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">العنوان:</span>
                <span className="text-gray-900">{order.address || 'غير متوفر'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المحافظة:</span>
                <span className="text-gray-900">{order.governorate || 'غير متوفر'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">المنتجات</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">كود المنتج</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السعر</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المقاس</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اللون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.productName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.productCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.priceAtPurchase.toFixed(2)} جنيه</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.size}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.color}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;