import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CartItem } from '../types';

// --- Inline Interfaces ---
interface CartItemImage {
  id: string;
  imagePath: string;
  isMain: boolean;
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
    images: CartItemImage[];
  }[];
  total: number;
}
// -------------------------

const CartPage: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  // Fetch authentication token
  useEffect(() => {
    const authToken = localStorage.getItem('accessToken');
    setToken(authToken);
    if (!authToken) {
      setError('يرجى تسجيل الدخول لعرض السلة');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!token) {
      setError('يرجى تسجيل الدخول لعرض السلة');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        }
        throw new Error('فشل في جلب بيانات السلة');
      }

      const data: ApiCartResponse = await response.json();
      const normalizedItems: CartItem[] = data.items.map(item => ({
        id: item.id,
        product: {
          id: item.productId,
          name: item.productName,
          price: item.price,
        },
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        images: item.images.map(img => {
          let fullPath = img.imagePath;
          // Check if the path is relative (starts with / or doesn't have http/https)
          if (!fullPath.startsWith('http://') && !fullPath.startsWith('https://')) {
            // Ensure path starts with /
            fullPath = fullPath.startsWith('/') ? fullPath : `/${fullPath}`;
            // Prepend API URL
            fullPath = `${apiUrl}${fullPath}`;
          }
          return {
            ...img,
            imagePath: fullPath,
          };
        }),
      }));

      setCartItems(normalizedItems || []);
      dispatch({ type: 'SET_CART', payload: normalizedItems || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير معروف');
    } finally {
      setLoading(false);
    }
  }, [dispatch, token, apiUrl]);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch cart on mount
  useEffect(() => {
    if (token) {
      fetchCart();
    }
  }, [fetchCart, token]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتعديل السلة');
      navigate('/login');
      return;
    }

    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    // Optimistic update
    const previousItems = [...cartItems];
    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    dispatch({ type: 'SET_CART', payload: updatedItems });

    try {
      const response = await fetch(`${apiUrl}/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newQuantity),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (response.status === 400) {
          throw new Error('كمية غير صالحة');
        } else if (response.status === 404) {
          throw new Error('العنصر غير موجود في السلة');
        } else if (response.status === 409) {
          throw new Error('تم تعديل العنصر من قبل مستخدم آخر، يرجى إعادة المحاولة');
        }
        throw new Error(errorText || 'فشل في تحديث الكمية');
      }

      await fetchCart();
    } catch (err) {
      setCartItems(previousItems);
      dispatch({ type: 'SET_CART', payload: previousItems });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحديث الكمية');
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتعديل السلة');
      navigate('/login');
      return;
    }

    const previousItems = [...cartItems];
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    dispatch({ type: 'SET_CART', payload: updatedItems });

    try {
      const response = await fetch(`${apiUrl}/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (response.status === 404) {
          throw new Error('العنصر غير موجود في السلة');
        } else if (errorText.includes('REFERENCE constraint') || errorText.includes('Orders')) {
          throw new Error('لا يمكن حذف هذا العنصر لأنه مرتبط بطلب حالي');
        }
        throw new Error(errorText || 'فشل في إزالة العنصر');
      }
    } catch (err) {
      setCartItems(previousItems);
      dispatch({ type: 'SET_CART', payload: previousItems });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إزالة العنصر');
    }
  };

  const handleClearCart = async () => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتعديل السلة');
      navigate('/login');
      return;
    }

    if (!window.confirm('هل أنت متأكد من إفراغ السلة؟')) {
      return;
    }

    setIsClearingCart(true);
    const previousItems = [...cartItems];
    setCartItems([]);
    dispatch({ type: 'SET_CART', payload: [] });

    try {
      const response = await fetch(`${apiUrl}/api/cart`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (errorText.includes('REFERENCE constraint') || errorText.includes('Orders')) {
          throw new Error('لا يمكن إفراغ السلة لأنها تحتوي على عناصر مرتبطة بطلبات حالية');
        }
        throw new Error(errorText || 'فشل في إفراغ السلة');
      }
    } catch (err) {
      setCartItems(previousItems);
      dispatch({ type: 'SET_CART', payload: previousItems });
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء إفراغ السلة');
    } finally {
      setIsClearingCart(false);
    }
  };

  const handleApplyDiscountCode = async () => {
    if (!token) {
      alert('يرجى تسجيل الدخول لتطبيق كود الخصم');
      navigate('/login');
      return;
    }

    if (!discountCode.trim()) {
      alert('يرجى إدخال كود خصم صالح');
      return;
    }

    setIsApplyingDiscount(true);
    try {
      const response = await fetch(`${apiUrl}/api/cart/discount`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: discountCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
          throw new Error('جلسة منتهية، يرجى تسجيل الدخول مرة أخرى');
        } else if (response.status === 400 || errorText.includes('invalid')) {
          throw new Error('كود الخصم غير صحيح أو منتهي الصلاحية');
        }
        throw new Error(errorText || 'فشل في تطبيق كود الخصم');
      }

      const data = await response.json();
      const discount = data.discountPercentage || 0;
      setAppliedDiscount(discount);
      if (discount <= 0) {
        alert('كود الخصم غير صحيح أو منتهي الصلاحية');
      } else {
        alert(`تم تطبيق خصم ${discount}% بنجاح`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تطبيق كود الخصم');
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const subtotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const discountAmount = (subtotal * appliedDiscount) / 100;
  const total = subtotal - discountAmount;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-600" size={40} />
        <span className="mr-3 text-gray-600 text-sm sm:text-base">جاري تحميل السلة...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2">حدث خطأ</h2>
          <p className="text-sm sm:text-base text-gray-600">{error}</p>
          <button
            onClick={fetchCart}
            className="mt-4 bg-red-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-red-700 font-semibold text-sm sm:text-base"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <div className="text-4xl sm:text-6xl mb-4">🛒</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">السلة فارغة</h2>
          <button
            onClick={() => navigate('/')}
            className="bg-pink-600 text-white px-6 py-2 sm:px-8 sm:py-3 rounded-lg hover:bg-pink-700 font-semibold text-sm sm:text-base"
          >
            تصفح المنتجات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-700 hover:text-red-900"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                سلة التسوق ({cartItems.length})
              </h2>
              <button
                onClick={handleClearCart}
                disabled={isClearingCart}
                className="flex items-center text-red-500 hover:text-red-700 font-semibold text-sm sm:text-base disabled:opacity-50"
              >
                {isClearingCart ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <Trash2 className="mr-2" size={18} />
                )}
                إفراغ السلة
              </button>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {cartItems.map((item) => {
                const mainImage = item.images?.find(img => img.isMain) || item.images?.[0];
                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-reverse space-x-2 sm:space-x-4 p-3 sm:p-4 border-b"
                  >
                    <img
                      src={mainImage?.imagePath || 'https://via.placeholder.com/150'}
                      alt={item.product.name}
                      loading="lazy"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
                        {item.product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {`المقاس: ${item.size || 'غير محدد'} • اللون: ${item.color || 'غير محدد'}`}
                      </p>
                      <p className="text-pink-600 font-bold text-sm sm:text-base">
                        {item.product.price.toFixed(2)} جنيه
                      </p>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        aria-label="تقليل الكمية"
                        disabled={isClearingCart}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 sm:w-10 text-center font-semibold text-sm sm:text-base">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center hover:bg-gray-100"
                        aria-label="زيادة الكمية"
                        disabled={isClearingCart}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-2"
                      aria-label="إزالة العنصر"
                      disabled={isClearingCart}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 sticky top-4 sm:top-8">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">
                ملخص الطلب
              </h3>
              <div className="flex space-x-reverse space-x-2 mb-4 sm:mb-6">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="أدخل كود الخصم"
                  className="flex-1 px-3 py-2 sm:py-3 border rounded-lg text-sm sm:text-base text-right"
                  dir="rtl"
                  disabled={isClearingCart}
                />
                <button
                  onClick={handleApplyDiscountCode}
                  disabled={isApplyingDiscount || isClearingCart}
                  className="bg-gray-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-700 w-20 sm:w-24 flex justify-center text-sm sm:text-base disabled:opacity-50"
                >
                  {isApplyingDiscount ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    'تطبيق'
                  )}
                </button>
              </div>
              <div className="space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">المجموع الفرعي</span>
                  <span className="font-semibold">{subtotal.toFixed(2)} جنيه</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span>الخصم ({appliedDiscount}%)</span>
                    <span>-{discountAmount.toFixed(2)} جنيه</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between text-base sm:text-lg font-bold">
                  <span>المجموع</span>
                  <span className="text-pink-600">{total.toFixed(2)} جنيه</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-pink-600 text-white py-2 sm:py-3 rounded-lg hover:bg-pink-700 font-semibold text-sm sm:text-base disabled:opacity-50"
                disabled={isClearingCart}
              >
                إتمام الطلب
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;