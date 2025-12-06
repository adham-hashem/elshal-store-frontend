import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Package, Eye } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

interface PaginatedOrdersResponse {
  items: Order[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const MyOrders: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!apiUrl) {
          throw new Error('عنوان URL الخاص بالـ API غير مكوّن.');
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('لم يتم العثور على رمز الوصول. الرجاء تسجيل الدخول مرة أخرى.');
        }

        // console.log('Fetching orders from:', `${apiUrl}/api/orders/my-orders`);
        const response = await fetch(`${apiUrl}/api/orders/my-orders`, {
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
            throw new Error('غير مصرح: الرجاء تسجيل الدخول مرة أخرى.');
          }
          const errorText = await response.text();
          throw new Error(`فشل في جلب الطلبات: ${response.status} ${errorText}`);
        }

        const data: PaginatedOrdersResponse = await response.json();
        // console.log('API response:', data);

        // Ensure data.items is an array
        if (!Array.isArray(data.items)) {
          // console.error('Expected an array for data.items, received:', data.items);
          setOrders([]);
          throw new Error('تنسيق الاستجابة غير صالح: متوقع مصفوفة من الطلبات في data.items.');
        }

        // Map numeric status and paymentMethod to string values
        const mappedOrders = data.items.map((order: any) => ({
          ...order,
          status: mapStatus(order.status),
          paymentMethod: mapPaymentMethod(order.paymentMethod),
        }));

        setOrders(mappedOrders);
      } catch (err: any) {
        // console.error('Error fetching orders:', err);
        setError(err.message || 'حدث خطأ أثناء جلب الطلبات.');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    // Map status and payment method for consistency
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
      fetchOrders();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Helper function to get status text
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

  // Helper function to get payment method text
  const getPaymentMethodText = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'الدفع عند الاستلام';
      case 'card': return 'بطاقة ائتمانية';
      case 'onlinepayment': return 'دفع إلكتروني';
      default: return method;
    }
  };

  // Helper function to get status color
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

  // Helper function to format date
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
        <span className="mr-3 text-gray-600">جاري تحميل الطلبات...</span>
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
      <h1 className="text-2xl font-bold mb-6 text-gray-800">طلباتي</h1>
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد طلبات بعد.</p>
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
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{order.orderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(order.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{order.total.toFixed(2)} جنيه</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/order/${order.id}`}
                          className="flex items-center text-pink-600 hover:text-pink-800"
                          title="عرض التفاصيل"
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض التفاصيل
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="block sm:hidden space-y-4">
            {orders.map((order) => (
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
                    <span className="text-sm text-gray-500">المبلغ:</span>
                    <span className="text-sm font-semibold text-gray-900">{order.total.toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">طريقة الدفع:</span>
                    <span className="text-sm text-gray-900">{getPaymentMethodText(order.paymentMethod)}</span>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link
                    to={`/order/${order.id}`}
                    className="flex items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded hover:bg-pink-100"
                  >
                    <Eye className="h-3 w-3 ml-1" />
                    التفاصيل
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyOrders;