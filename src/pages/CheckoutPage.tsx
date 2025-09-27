import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CreditCard, Truck, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CartItem } from '../types';
// import { requestNotificationPermission } from '../services/firebase'; // Import Firebase service

interface ShippingFee {
  id: string;
  governorate: string;
  fee: number;
  deliveryTime: string;
  status: number;
  createdAt: string;
}

interface DiscountCode {
  id: string;
  code: string;
  type: number;
  percentageValue: number | null;
  fixedValue: number | null;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface ApiResponse {
  items: ShippingFee[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface ApiCartResponse {
  id: string;
  userId: string;
  createdAt: string;
  items: {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    size: string;
    color: string;
    price: number;
    images: { id: string; imagePath: string; isMain: boolean }[];
  }[];
  total: number;
}

const CheckoutPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    governorate: '',
    paymentMethod: 'cash' as 'cash' | 'visa',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    discountCode: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>([]);
  const [loadingShippingFees, setLoadingShippingFees] = useState(true);
  const [errorShippingFees, setErrorShippingFees] = useState<string | null>(null);
  const [discount, setDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [loadingDiscount, setLoadingDiscount] = useState(false);
  const [errorDiscount, setErrorDiscount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  const fetchCart = useCallback(async (retryCount = 3, retryDelay = 1000) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found');
      setCartError('يرجى تسجيل الدخول لعرض السلة');
      setLoadingCart(false);
      navigate('/login');
      return;
    }

    setLoadingCart(true);
    setCartError(null);

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        console.log(`Fetching cart, attempt ${attempt}/${retryCount}`);
        const response = await fetch(`${apiUrl}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Cart fetch failed with status ${response.status}: ${errorText}`);
          if (response.status === 401) {
            throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
          }
          throw new Error('فشل في جلب بيانات السلة');
        }

        const data: ApiCartResponse = await response.json();
        console.log('Cart API response:', data);

        const normalizedItems: CartItem[] = data.items?.map(item => ({
          id: item.id,
          product: {
            id: item.productId,
            name: item.productName || 'Unknown Product',
            price: item.price || 0,
          },
          quantity: item.quantity || 1,
          size: item.size || undefined,
          color: item.color || undefined,
          images: item.images?.map(img => ({
            ...img,
            imagePath: img.imagePath.startsWith('/Uploads') || img.imagePath.startsWith('/images')
              ? `${apiUrl}${img.imagePath}`
              : img.imagePath,
          })) || [],
        })) || [];

        console.log('Normalized cart items:', normalizedItems);
        dispatch({ type: 'SET_CART', payload: normalizedItems });
        if (normalizedItems.length === 0) {
          console.warn('Cart is empty');
          setCartError('السلة فارغة');
        }
        setLoadingCart(false);
        return;
      } catch (err) {
        console.error(`Cart fetch attempt ${attempt} failed:`, err);
        if (attempt === retryCount) {
          setCartError(err instanceof Error ? err.message : 'حدث خطأ أثناء جلب بيانات السلة');
          setLoadingCart(false);
          if (err instanceof Error && err.message.includes('جلسة منتهية')) {
            localStorage.removeItem('accessToken');
            navigate('/login');
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }, [dispatch, navigate, apiUrl]);

  const fetchShippingFees = useCallback(async () => {
    setLoadingShippingFees(true);
    setErrorShippingFees(null);
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiUrl}/api/shipping-fees?pageNumber=1&pageSize=10`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`فشل في جلب رسوم التوصيل: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      console.log('Shipping fees API response:', data);
      setShippingFees(data.items || []);
    } catch (err) {
      setErrorShippingFees(err instanceof Error ? err.message : 'فشل في جلب رسوم التوصيل');
    } finally {
      setLoadingShippingFees(false);
    }
  }, [apiUrl]);

  const { subtotal, selectedGovernorate, shippingFee, discountAmount, total } = useMemo(() => {
    const subtotalCalc = state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    const selectedGov = shippingFees.find(g => g.governorate === formData.governorate);
    const shipFee = selectedGov?.fee || 0;
    const discountAmt = discount?.amount || 0;
    const totalCalc = Math.max(0, subtotalCalc - discountAmt + shipFee);

    console.log('Calculated totals:', { subtotalCalc, shipFee, discountAmt, totalCalc });
    return {
      subtotal: subtotalCalc,
      selectedGovernorate: selectedGov,
      shippingFee: shipFee,
      discountAmount: discountAmt,
      total: totalCalc,
    };
  }, [state.cart, shippingFees, formData.governorate, discount]);

  const fetchDiscountCode = useCallback(
    async (code: string) => {
      if (!code.trim()) return;

      setLoadingDiscount(true);
      setErrorDiscount(null);
      setDiscount(null);

      try {
        const response = await fetch(`${apiUrl}/api/discount-codes/code/${code}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`فشل في التحقق من كود الخصم: ${response.status}`);
        }

        const data: DiscountCode = await response.json();
        console.log('Discount code API response:', data);

        if (!data.isActive) {
          throw new Error('الكود غير صالح أو منتهي الصلاحية');
        }

        const subtotalCalc = state.cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
        if (data.minOrderAmount > subtotalCalc) {
          throw new Error(`يجب أن يكون إجمالي الطلب ${data.minOrderAmount} جنيه على الأقل لاستخدام هذا الكود`);
        }

        let discountAmount = 0;
        if (data.percentageValue) {
          discountAmount = (subtotalCalc * data.percentageValue) / 100;
          if (data.maxDiscountAmount && discountAmount > data.maxDiscountAmount) {
            discountAmount = data.maxDiscountAmount;
          }
        } else if (data.fixedValue) {
          discountAmount = data.fixedValue;
        }

        setDiscount({ code, amount: discountAmount });
      } catch (err) {
        setErrorDiscount(err instanceof Error ? err.message : 'فشل في التحقق من الكود');
      } finally {
        setLoadingDiscount(false);
      }
    },
    [state.cart, apiUrl]
  );

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'الاسم الكامل مطلوب';

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^01[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    if (!formData.address.trim()) newErrors.address = 'العنوان مطلوب';
    if (!formData.governorate) newErrors.governorate = 'المحافظة مطلوبة';

    if (formData.paymentMethod === 'visa') {
      if (!formData.cardNumber.trim()) newErrors.cardNumber = 'رقم البطاقة مطلوب';
      if (!formData.expiryDate.trim()) newErrors.expiryDate = 'تاريخ الانتهاء مطلوب';
      if (!formData.cvv.trim()) newErrors.cvv = 'رمز الأمان مطلوب';
      if (!formData.cardName.trim()) newErrors.cardName = 'اسم حامل البطاقة مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const sendAdminNotification = useCallback(
    async (orderId: string, total: number, retryCount = 3, retryDelay = 1000) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('authentication_required');
      }

      for (let attempt = 1; attempt <= retryCount; attempt++) {
        try {
          console.log(`Sending admin notification, attempt ${attempt}/${retryCount}`);
          const response = await fetch(`${apiUrl}/api/notification/send`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              orderNumber: orderId,
              total: total.toFixed(2),
            }),
          });

          if (!response.ok) {
            const errorData = await response.text();
            console.error(`Notification failed with status ${response.status}: ${errorData}`);
            throw new Error(`فشل إرسال الإشعار: ${response.status}`);
          }

          console.log('Admin notification sent successfully');
          return;
        } catch (err) {
          console.error(`Notification attempt ${attempt} failed:`, err);
          if (attempt === retryCount) {
            throw err;
          }
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    },
    [apiUrl]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isSubmitting) return;

      if (!validateForm()) return;

      setIsSubmitting(true);
      setNotificationError(null);

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('authentication_required');
        }

        const requestBody = {
          fullname: formData.fullName.trim(),
          phonenumber: formData.phone.trim(),
          address: formData.address.trim(),
          governorate: formData.governorate,
          discountCode: discount?.code || null,
          paymentMethod: formData.paymentMethod === 'cash' ? 0 : 1,
          items: state.cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            size: item.size || null,
            color: item.color || null,
          })),
        };

        console.log('Submitting order with body:', requestBody);

        const response = await fetch(`${apiUrl}/api/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Order submission failed:', errorData);
          throw new Error(`فشل إرسال الطلب: ${response.status} - ${errorData}`);
        }

        const orderResult = await response.json();
        console.log('Order API response:', orderResult);

        // Map API response to local order format
        const mapStatus = (status: number): 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' => {
          switch (status) {
            case 0: return 'Pending';
            case 1: return 'Confirmed';
            case 2: return 'Processing';
            case 3: return 'Shipped';
            case 4: return 'Delivered';
            case 5: return 'Cancelled';
            default: return 'Pending';
          }
        };

        const mapPaymentMethod = (method: number): 'Cash' | 'Card' | 'OnlinePayment' => {
          switch (method) {
            case 0: return 'Cash';
            case 1: return 'Card';
            case 2: return 'OnlinePayment';
            default: return 'Cash';
          }
        };

        const localOrder = {
          id: orderResult.id || `order-${Date.now()}`,
          customerId: orderResult.customerId || 'authenticated-user',
          items: state.cart.map(item => ({
            id: `item-${Date.now()}-${item.product.id}`,
            productId: item.product.id,
            productName: item.product.name,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
            size: item.size || 'غير محدد',
            color: item.color || 'غير محدد',
          })),
          total: Number(total.toFixed(2)),
          shippingFee: Number(shippingFee.toFixed(2)),
          discountCode: discount?.code || null,
          discountAmount: Number(discountAmount.toFixed(2)),
          paymentMethod: mapPaymentMethod(orderResult.paymentMethod || (formData.paymentMethod === 'cash' ? 0 : 1)),
          status: mapStatus(orderResult.status || 0),
          createdAt: orderResult.date || new Date().toISOString(),
          customerInfo: {
            id: orderResult.customerId || 'authenticated-user',
            fullName: formData.fullName.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            governorate: formData.governorate,
          },
        };

        console.log('Local order created:', localOrder);
        dispatch({ type: 'ADD_ORDER', payload: localOrder });

        // Notify backend to send push notification to admin
        try {
          await sendAdminNotification(localOrder.id, total);
          console.log('Admin notification request sent');
        } catch (notificationError) {
          console.error('Failed to send admin notification:', notificationError);
          setNotificationError('فشل إرسال إشعار للإدارة، تم إنشاء الطلب بنجاح');
        }

        dispatch({ type: 'CLEAR_CART' });
        alert('تم تأكيد طلبك بنجاح! سيتم التواصل معك قريباً.');
        navigate('/', { replace: true });
      } catch (error) {
        let errorMessage = 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
        if (error instanceof Error) {
          if (error.message.includes('authentication_required') || error.message.includes('401')) {
            errorMessage = 'جلسة تسجيل الدخول منتهية أو غير صالحة. يرجى تسجيل الدخول مرة أخرى.';
            localStorage.removeItem('accessToken');
            navigate('/login', { replace: true });
          } else if (error.message.includes('400')) {
            errorMessage = 'بيانات الطلب غير صحيحة. يرجى مراجعة البيانات المدخلة.';
          } else if (error.message.includes('403')) {
            errorMessage = 'غير مصرح بإنشاء الطلب. يرجى التحقق من الصلاحيات.';
          } else if (error.message.includes('500')) {
            errorMessage = 'خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.';
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'تحقق من اتصال الإنترنت وحاول مرة أخرى.';
          }
        }
        console.error('Order submission error:', error);
        alert(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, validateForm, formData, discount, state.cart, total, shippingFee, discountAmount, dispatch, navigate, apiUrl, sendAdminNotification]
  );

  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));

      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleApplyDiscount = useCallback(() => {
    const code = formData.discountCode.trim();
    if (code) {
      fetchDiscountCode(code);
    } else {
      setErrorDiscount('يرجى إدخال كود خصم');
    }
  }, [formData.discountCode, fetchDiscountCode]);

  useEffect(() => {
    console.log('CheckoutPage mounted, fetching cart and shipping fees');
    fetchCart();
    fetchShippingFees();
  }, [fetchCart, fetchShippingFees]);

  if (loadingCart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="animate-spin text-pink-600" size={32} />
        <span className="mr-3 text-lg text-gray-600">جاري تحميل السلة...</span>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="container mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">خطأ</h2>
            <p className="text-gray-600 mb-6">{cartError}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={() => fetchCart()}
                className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium text-base"
              >
                إعادة المحاولة
              </button>
              <button
                onClick={() => navigate('/cart')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium text-base"
              >
                العودة إلى السلة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="container mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-4">السلة فارغة</h2>
            <p className="text-gray-600 mb-6">لا يمكن إتمام الطلب بسلة فارغة</p>
            <button
              onClick={() => navigate('/')}
              className="bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors font-medium text-base"
            >
              العودة للتسوق
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <Link
          to="/cart"
          className="flex items-center space-x-reverse space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors text-base"
        >
          <ArrowRight size={18} />
          <span>العودة للسلة</span>
        </Link>

        {notificationError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
            <p className="text-yellow-600 text-sm">{notificationError}</p>
          </div>
        )}

        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">إتمام الطلب</h2>

              {errorShippingFees && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                  <p className="text-red-600 text-sm">{errorShippingFees}</p>
                  <button
                    onClick={fetchShippingFees}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">معلومات العميل</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        الاسم الكامل *
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right text-base ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        dir="rtl"
                        disabled={isSubmitting}
                      />
                      {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        رقم الهاتف *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="01xxxxxxxxx"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right text-base ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        dir="rtl"
                        disabled={isSubmitting}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العنوان التفصيلي *
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right text-base ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="rtl"
                      disabled={isSubmitting}
                    />
                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المحافظة *
                    </label>
                    {loadingShippingFees ? (
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Loader2 className="animate-spin text-pink-600" size={18} />
                        <span className="text-gray-600 text-sm">جاري تحميل المحافظات...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.governorate}
                        onChange={(e) => handleInputChange('governorate', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right text-base ${
                          errors.governorate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        dir="rtl"
                        disabled={shippingFees.length === 0 || isSubmitting}
                      >
                        <option value="">اختر المحافظة</option>
                        {shippingFees.map((gov) => (
                          <option key={gov.id} value={gov.governorate}>
                            {gov.governorate} - {gov.fee} جنيه ({gov.deliveryTime})
                          </option>
                        ))}
                      </select>
                    )}
                    {errors.governorate && <p className="text-red-500 text-sm mt-1">{errors.governorate}</p>}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      كود الخصم
                    </label>
                    <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-reverse sm:space-x-2">
                      <input
                        type="text"
                        value={formData.discountCode}
                        onChange={(e) => handleInputChange('discountCode', e.target.value)}
                        placeholder="أدخل كود الخصم"
                        className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right text-base ${
                          errorDiscount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        dir="rtl"
                        disabled={loadingDiscount || isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={handleApplyDiscount}
                        disabled={loadingDiscount || isSubmitting}
                        className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium text-base ${
                          loadingDiscount || isSubmitting
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-pink-600 text-white hover:bg-pink-700'
                        } transition-colors`}
                      >
                        {loadingDiscount ? (
                          <Loader2 className="animate-spin inline-block" size={18} />
                        ) : (
                          'تطبيق'
                        )}
                      </button>
                    </div>
                    {errorDiscount && <p className="text-red-500 text-sm mt-1">{errorDiscount}</p>}
                    {discount && (
                      <p className="text-green-600 text-sm mt-1">
                        تم تطبيق كود {discount.code}: خصم {discount.amount.toFixed(2)} جنيه
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">طريقة الدفع</h3>

                  <div className="space-y-4">
                    <label className="flex items-center space-x-reverse space-x-3 p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.paymentMethod === 'cash'}
                        onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                        className="text-pink-600 w-5 h-5"
                        disabled={isSubmitting}
                      />
                      <Truck className="text-gray-600" size={20} />
                      <span className="font-medium text-base">الدفع عند الاستلام</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || loadingShippingFees}
                  className={`w-full py-3 rounded-lg font-medium text-base transition-colors ${
                    isSubmitting || loadingShippingFees
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-pink-600 text-white hover:bg-pink-700'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-reverse space-x-2">
                      <Loader2 className="animate-spin" size={18} />
                      <span>جاري تأكيد الطلب...</span>
                    </div>
                  ) : (
                    'تأكيد الطلب'
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 sticky top-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-6">ملخص الطلب</h3>

              <div className="space-y-4 mb-6">
                {state.cart.map((item) => (
                  <div key={`${item.product.id}-${item.size}-${item.color}`} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm sm:text-base">{item.product.name}</p>
                      <p className="text-xs text-gray-500">
                        الكمية: {item.quantity}
                        {item.size && ` • ${item.size}`}
                        {item.color && ` • ${item.color}`}
                      </p>
                    </div>
                    <span className="font-semibold text-sm sm:text-base">{(item.product.price * item.quantity).toFixed(2)} جنيه</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} جنيه</span>
                </div>

                {discount && (
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">الخصم ({discount.code})</span>
                    <span className="font-semibold text-green-600">-{discountAmount.toFixed(2)} جنيه</span>
                  </div>
                )}

                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">رسوم التوصيل</span>
                  <span className="font-semibold">{shippingFee.toFixed(2)} جنيه</span>
                </div>

                {selectedGovernorate && (
                  <p className="text-xs text-gray-500">
                    التوصيل خلال: {selectedGovernorate.deliveryTime}
                  </p>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-base sm:text-lg font-bold">
                    <span>المجموع الكلي</span>
                    <span className="text-pink-600">{total.toFixed(2)} جنيه</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;