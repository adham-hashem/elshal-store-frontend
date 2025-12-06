import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Interface for ShippingFee based on backend DTOs
interface ShippingFee {
  id: string;
  governorate: string;
  fee: number;
  deliveryTime: string;
  status: 0 | 1; // Updated to number
  createdAt: string;
}

interface PaginatedShippingFeesResponse {
  items: ShippingFee[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const ShippingManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [shippingFees, setShippingFees] = useState<ShippingFee[]>([]);
  const [newShippingFee, setNewShippingFee] = useState({
    governorate: '',
    fee: '',
    deliveryTime: '',
    status: 0 as 0 | 1, // Default to Active
  });
  const [editingShippingFee, setEditingShippingFee] = useState<ShippingFee | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 10;

  const apiUrl = import.meta.env.VITE_API_BASE_URL;

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

    fetchShippingFees(currentPage);
  }, [isAuthenticated, userRole, navigate, currentPage]);

  // Fetch shipping fees from backend
  const fetchShippingFees = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      // console.log('Retrieved token:', token ? 'Token found' : 'No token found');
      if (!token) {
        navigate('/login');
        throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      }

      // console.log('Fetching shipping fees from:', `${apiUrl}/api/shipping-fees?pageNumber=${page}&pageSize=${pageSize}`);
      const response = await fetch(
        `${apiUrl}/api/shipping-fees?pageNumber=${page}&pageSize=${pageSize}`,
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
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        }
        throw new Error(`فشل في جلب رسوم الشحن: ${response.status} ${responseText}`);
      }

      const data: PaginatedShippingFeesResponse = JSON.parse(responseText);
      // console.log('Parsed data:', data);
      setShippingFees(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.pageNumber);
    } catch (err) {
      // console.error('Error fetching shipping fees:', err);
      setError(err instanceof Error ? err.message : 'فشل في جلب رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate shipping fee inputs
  const validateShippingFee = () => {
    if (!newShippingFee.governorate) return 'اسم المحافظة مطلوب';
    if (!newShippingFee.fee) return 'رسوم التوصيل مطلوبة';
    if (isNaN(parseFloat(newShippingFee.fee)) || parseFloat(newShippingFee.fee) < 0) {
      return 'رسوم التوصيل يجب أن تكون رقمًا صحيحًا وغير سالب';
    }
    if (!newShippingFee.deliveryTime) return 'مدة التوصيل مطلوبة';
    return null;
  };

  // Add shipping fee
  const handleAddShippingFee = async () => {
    if (isLoading) return;

    const validationError = validateShippingFee();
    if (validationError) {
      alert(validationError);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      alert('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        governorate: newShippingFee.governorate,
        fee: parseFloat(newShippingFee.fee),
        deliveryTime: newShippingFee.deliveryTime,
        status: newShippingFee.status, // Send as number (0 or 1)
      };

      // console.log('Creating shipping fee:', request);
      const response = await fetch(`${apiUrl}/api/shipping-fees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        // console.log('Error response:', errorText);
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        } else if (response.status === 400 && errorText.includes('already exists')) {
          throw new Error('المحافظة موجودة بالفعل. يرجى استخدام اسم محافظة مختلف.');
        }
        throw new Error(`فشل في إضافة رسوم الشحن: ${response.status} ${errorText}`);
      }

      await fetchShippingFees(currentPage);
      setNewShippingFee({
        governorate: '',
        fee: '',
        deliveryTime: '',
        status: 0, // Reset to Active
      });
      alert('تم إضافة رسوم الشحن بنجاح!');
    } catch (error) {
      // console.error('Error adding shipping fee:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  // Update shipping fee
  const handleUpdateShippingFee = async () => {
    if (isLoading || !editingShippingFee) return;

    const validationError = validateShippingFee();
    if (validationError) {
      alert(validationError);
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      alert('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        governorate: newShippingFee.governorate,
        fee: parseFloat(newShippingFee.fee),
        deliveryTime: newShippingFee.deliveryTime,
        status: newShippingFee.status, // Send as number (0 or 1)
      };

      // console.log('Updating shipping fee:', { id: editingShippingFee.id, ...request });
      const response = await fetch(`${apiUrl}/api/shipping-fees/${editingShippingFee.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      // console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        // console.log('Error response:', errorText);
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        } else if (response.status === 404) {
          throw new Error('رسوم الشحن غير موجودة.');
        } else if (response.status === 400 && errorText.includes('already exists')) {
          throw new Error('المحافظة موجودة بالفعل. يرجى استخدام اسم محافظة مختلف.');
        }
        throw new Error(`فشل في تحديث رسوم الشحن: ${response.status} ${errorText}`);
      }

      await fetchShippingFees(currentPage);
      setEditingShippingFee(null);
      setNewShippingFee({
        governorate: '',
        fee: '',
        deliveryTime: '',
        status: 0, // Reset to Active
      });
      alert('تم تحديث رسوم الشحن بنجاح!');
    } catch (error) {
      // console.error('Error updating shipping fee:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete shipping fee
  const handleDeleteShippingFee = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف رسوم الشحن لهذه المحافظة؟')) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      alert('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      return;
    }

    setIsLoading(true);
    try {
      // console.log('Deleting shipping fee:', id);
      const response = await fetch(`${apiUrl}/api/shipping-fees/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        // console.log('Error response:', errorText);
        if (response.status === 401) {
          localStorage.removeItem('accessToken');
          navigate('/login');
          throw new Error('غير مصرح: يرجى تسجيل الدخول مرة أخرى.');
        } else if (response.status === 403) {
          navigate('/');
          throw new Error('ممنوع: يتطلب صلاحيات إدارية.');
        } else if (response.status === 404) {
          throw new Error('رسوم الشحن غير موجودة.');
        }
        throw new Error(`فشل في حذف رسوم الشحن: ${response.status} ${errorText}`);
      }

      await fetchShippingFees(currentPage);
      alert('تم حذف رسوم الشحن بنجاح!');
    } catch (error) {
      // console.error('Error deleting shipping fee:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف رسوم الشحن');
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">إدارة رسوم الشحن</h2>
        <div className="text-sm text-gray-600">
          إجمالي المحافظات: {totalItems}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => fetchShippingFees(currentPage)}
            className="mr-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm text-red-800 flex items-center"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Add/Edit Shipping Fee Form */}
      <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {editingShippingFee ? 'تعديل رسوم الشحن' : 'إضافة رسوم شحن جديدة'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المحافظة <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newShippingFee.governorate}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, governorate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: القاهرة"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              رسوم التوصيل (جنيه) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={newShippingFee.fee}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, fee: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              مدة التوصيل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newShippingFee.deliveryTime}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, deliveryTime: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 1-2 أيام"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
            <select
              value={newShippingFee.status}
              onChange={(e) => setNewShippingFee((prev) => ({ ...prev, status: parseInt(e.target.value) as 0 | 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
            >
              <option value={0}>مفعّل</option>
              <option value={1}>غير مفعّل</option>
            </select>
          </div>
        </div>
        <div className="flex space-x-reverse space-x-4 mt-6">
          <button
            onClick={editingShippingFee ? handleUpdateShippingFee : handleAddShippingFee}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="animate-spin h-4 w-4 ml-2" />
                جاري المعالجة...
              </div>
            ) : editingShippingFee ? (
              'تحديث رسوم الشحن'
            ) : (
              <div className="flex items-center">
                <Plus className="h-4 w-4 ml-2" />
                إضافة رسوم الشحن
              </div>
            )}
          </button>
          {(editingShippingFee || newShippingFee.governorate || newShippingFee.fee || newShippingFee.deliveryTime) && (
            <button
              onClick={() => {
                setEditingShippingFee(null);
                setNewShippingFee({
                  governorate: '',
                  fee: '',
                  deliveryTime: '',
                  status: 0, // Reset to Active
                });
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              إلغاء
            </button>
          )}
        </div>
      </div>

      {/* Shipping Fees List */}
      {isLoading && shippingFees.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <span className="mr-3 text-gray-600">جاري تحميل رسوم الشحن...</span>
        </div>
      ) : shippingFees.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600">لا توجد رسوم شحن متاحة</p>
          <button
            onClick={() => fetchShippingFees(currentPage)}
            className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center mx-auto"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة التحميل
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">رسوم الشحن المتاحة</h4>
          <div className="space-y-4">
            {shippingFees.map((shippingFee) => (
              <div
                key={shippingFee.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-800">{shippingFee.governorate}</p>
                  <p className="text-sm text-gray-600">
                    رسوم التوصيل: {shippingFee.fee.toFixed(2)} جنيه | مدة التوصيل: {shippingFee.deliveryTime}
                  </p>
                  <p className="text-sm text-gray-600">
                    الحالة: <span className={shippingFee.status === 0 ? 'text-green-600' : 'text-red-600'}>
                      {shippingFee.status === 0 ? 'مفعّل' : 'غير مفعّل'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">تاريخ الإنشاء: {formatDate(shippingFee.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-reverse space-x-2">
                  <button
                    onClick={() => {
                      setEditingShippingFee(shippingFee);
                      setNewShippingFee({
                        governorate: shippingFee.governorate,
                        fee: shippingFee.fee.toString(),
                        deliveryTime: shippingFee.deliveryTime,
                        status: shippingFee.status, // Use number (0 or 1)
                      });
                    }}
                    className="text-blue-600 hover:text-blue-700 p-2 disabled:opacity-50 hover:bg-blue-50 rounded transition-colors"
                    title="تعديل رسوم الشحن"
                    disabled={isLoading}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteShippingFee(shippingFee.id)}
                    className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50 hover:bg-red-50 rounded transition-colors"
                    title="حذف رسوم الشحن"
                    disabled={isLoading}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8 space-x-reverse space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <div className="flex items-center space-x-reverse space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        currentPage === pageNum
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } disabled:opacity-50`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
          <div className="text-center text-sm text-gray-500 mt-4">
            عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من {totalItems} محافظة
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManagement;