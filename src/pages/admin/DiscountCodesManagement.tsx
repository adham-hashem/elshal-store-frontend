import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Interface for DiscountCode based on backend DTOs
interface DiscountCode {
  id: string;
  code: string;
  type: 'Percentage' | 'Fixed';
  percentageValue: number | null;
  fixedValue: number | null;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface PaginatedDiscountCodesResponse {
  items: DiscountCode[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const DiscountCodesManagement: React.FC = () => {
  const { isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate();
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [newDiscountCode, setNewDiscountCode] = useState({
    code: '',
    type: 'Percentage' as 'Percentage' | 'Fixed',
    percentageValue: '',
    fixedValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [editingDiscountCode, setEditingDiscountCode] = useState<DiscountCode | null>(null);
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

    fetchDiscountCodes(currentPage);
  }, [isAuthenticated, userRole, navigate, currentPage]);

  // Fetch discount codes from backend
  const fetchDiscountCodes = async (page: number = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      // console.log('Retrieved token:', token ? 'Token found' : 'No token found');
      if (!token) {
        navigate('/login');
        throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
      }

      // console.log('Fetching discount codes from:', `${apiUrl}/api/discount-codes?pageNumber=${page}&pageSize=${pageSize}`);
      const response = await fetch(
        `${apiUrl}/api/discount-codes?pageNumber=${page}&pageSize=${pageSize}`,
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
        throw new Error(`فشل في جلب أكواد الخصم: ${response.status} ${responseText}`);
      }

      const data: PaginatedDiscountCodesResponse = JSON.parse(responseText);
      // console.log('Parsed data:', data);
      setDiscountCodes(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
      setCurrentPage(data.pageNumber);
    } catch (err) {
      // console.error('Error fetching discount codes:', err);
      setError(err instanceof Error ? err.message : 'فشل في جلب أكواد الخصم');
    } finally {
      setIsLoading(false);
    }
  };

  // Validate discount code inputs
  const validateDiscountCode = () => {
    if (!newDiscountCode.code) return 'كود الخصم مطلوب';
    if (!newDiscountCode.startDate) return 'تاريخ البدء مطلوب';
    if (!newDiscountCode.endDate) return 'تاريخ الانتهاء مطلوب';
    if (newDiscountCode.type === 'Percentage' && !newDiscountCode.percentageValue) {
      return 'نسبة الخصم مطلوبة لنوع الخصم المئوي';
    }
    if (newDiscountCode.type === 'Fixed' && !newDiscountCode.fixedValue) {
      return 'القيمة الثابتة مطلوبة لنوع الخصم الثابت';
    }
    if (newDiscountCode.percentageValue && isNaN(parseFloat(newDiscountCode.percentageValue))) {
      return 'نسبة الخصم يجب أن تكون رقمًا صحيحًا';
    }
    if (newDiscountCode.fixedValue && isNaN(parseFloat(newDiscountCode.fixedValue))) {
      return 'القيمة الثابتة يجب أن تكون رقمًا صحيحًا';
    }
    if (newDiscountCode.minOrderAmount && isNaN(parseFloat(newDiscountCode.minOrderAmount))) {
      return 'الحد الأدنى للطلب يجب أن يكون رقمًا صحيحًا';
    }
    if (newDiscountCode.maxDiscountAmount && isNaN(parseFloat(newDiscountCode.maxDiscountAmount))) {
      return 'الحد الأقصى للخصم يجب أن تكون رقمًا صحيحًا';
    }
    if (newDiscountCode.usageLimit && isNaN(parseInt(newDiscountCode.usageLimit))) {
      return 'حد الاستخدام يجب أن يكون رقمًا صحيحًا';
    }
    const startDate = new Date(newDiscountCode.startDate);
    const endDate = new Date(newDiscountCode.endDate);
    if (startDate >= endDate) {
      return 'تاريخ البدء يجب أن يكون قبل تاريخ الانتهاء';
    }
    return null;
  };

  // Add discount code
  const handleAddDiscountCode = async () => {
    if (isLoading) return;

    const validationError = validateDiscountCode();
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
        code: newDiscountCode.code,
        type: newDiscountCode.type,
        percentageValue: newDiscountCode.percentageValue ? parseFloat(newDiscountCode.percentageValue) : null,
        fixedValue: newDiscountCode.fixedValue ? parseFloat(newDiscountCode.fixedValue) : null,
        minOrderAmount: newDiscountCode.minOrderAmount ? parseFloat(newDiscountCode.minOrderAmount) : null,
        maxDiscountAmount: newDiscountCode.maxDiscountAmount ? parseFloat(newDiscountCode.maxDiscountAmount) : null,
        usageLimit: newDiscountCode.usageLimit ? parseInt(newDiscountCode.usageLimit) : null,
        startDate: new Date(newDiscountCode.startDate).toISOString(),
        endDate: new Date(newDiscountCode.endDate).toISOString(),
        isActive: newDiscountCode.isActive,
      };

      // console.log('Creating discount code:', request);
      const response = await fetch(`${apiUrl}/api/discount-codes`, {
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
          throw new Error('كود الخصم مستخدم بالفعل. يرجى استخدام كود مختلف.');
        }
        throw new Error(`فشل في إضافة كود الخصم: ${response.status} ${errorText}`);
      }

      await fetchDiscountCodes(currentPage);
      setNewDiscountCode({
        code: '',
        type: 'Percentage',
        percentageValue: '',
        fixedValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
      alert('تم إضافة كود الخصم بنجاح!');
    } catch (error) {
      // console.error('Error adding discount code:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء إضافة كود الخصم');
    } finally {
      setIsLoading(false);
    }
  };

  // Update discount code
  const handleUpdateDiscountCode = async () => {
    if (isLoading || !editingDiscountCode) return;

    const validationError = validateDiscountCode();
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
        code: newDiscountCode.code,
        type: newDiscountCode.type,
        percentageValue: newDiscountCode.percentageValue ? parseFloat(newDiscountCode.percentageValue) : null,
        fixedValue: newDiscountCode.fixedValue ? parseFloat(newDiscountCode.fixedValue) : null,
        minOrderAmount: newDiscountCode.minOrderAmount ? parseFloat(newDiscountCode.minOrderAmount) : null,
        maxDiscountAmount: newDiscountCode.maxDiscountAmount ? parseFloat(newDiscountCode.maxDiscountAmount) : null,
        usageLimit: newDiscountCode.usageLimit ? parseInt(newDiscountCode.usageLimit) : null,
        startDate: new Date(newDiscountCode.startDate).toISOString(),
        endDate: new Date(newDiscountCode.endDate).toISOString(),
        isActive: newDiscountCode.isActive,
      };

      // console.log('Updating discount code:', { id: editingDiscountCode.id, ...request });
      const response = await fetch(`${apiUrl}/api/discount-codes/${editingDiscountCode.id}`, {
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
          throw new Error('كود الخصم غير موجود.');
        } else if (response.status === 400 && errorText.includes('already exists')) {
          throw new Error('كود الخصم مستخدم بالفعل. يرجى استخدام كود مختلف.');
        }
        throw new Error(`فشل في تحديث كود الخصم: ${response.status} ${errorText}`);
      }

      await fetchDiscountCodes(currentPage);
      setEditingDiscountCode(null);
      setNewDiscountCode({
        code: '',
        type: 'Percentage',
        percentageValue: '',
        fixedValue: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        startDate: '',
        endDate: '',
        isActive: true,
      });
      alert('تم تحديث كود الخصم بنجاح!');
    } catch (error) {
      // console.error('Error updating discount code:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء تحديث كود الخصم');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete discount code
  const handleDeleteDiscountCode = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف كود الخصم هذا؟')) {
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
      // console.log('Deleting discount code:', id);
      const response = await fetch(`${apiUrl}/api/discount-codes/${id}`, {
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
          throw new Error('كود الخصم غير موجود.');
        }
        throw new Error(`فشل في حذف كود الخصم: ${response.status} ${errorText}`);
      }

      await fetchDiscountCodes(currentPage);
      alert('تم حذف كود الخصم بنجاح!');
    } catch (error) {
      // console.error('Error deleting discount code:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ أثناء حذف كود الخصم');
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
        <h2 className="text-2xl font-bold text-gray-800">إدارة أكواد الخصم</h2>
        <div className="text-sm text-gray-600">
          إجمالي أكواد الخصم: {totalItems}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
          <span className="text-red-800">{error}</span>
          <button
            onClick={() => fetchDiscountCodes(currentPage)}
            className="mr-auto bg-red-100 hover:bg-red-200 px-3 py-1 rounded text-sm text-red-800 flex items-center"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-1" />
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Add/Edit Discount Code Form */}
      <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {editingDiscountCode ? 'تعديل كود الخصم' : 'إضافة كود خصم جديد'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">كود الخصم <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newDiscountCode.code}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, code: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: SUMMER25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع الخصم <span className="text-red-500">*</span></label>
            <select
              value={newDiscountCode.type}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, type: e.target.value as 'Percentage' | 'Fixed' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
            >
              <option value="Percentage">مئوي</option>
              <option value="Fixed">ثابت</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {newDiscountCode.type === 'Percentage' ? 'نسبة الخصم (%) *' : 'القيمة الثابتة (جنيه) *'}
            </label>
            <input
              type="number"
              value={newDiscountCode.type === 'Percentage' ? newDiscountCode.percentageValue : newDiscountCode.fixedValue}
              onChange={(e) =>
                setNewDiscountCode((prev) => ({
                  ...prev,
                  [newDiscountCode.type === 'Percentage' ? 'percentageValue' : 'fixedValue']: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder={newDiscountCode.type === 'Percentage' ? 'مثال: 25' : 'مثال: 50'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأدنى للطلب (جنيه)</label>
            <input
              type="number"
              value={newDiscountCode.minOrderAmount}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, minOrderAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحد الأقصى للخصم (جنيه)</label>
            <input
              type="number"
              value={newDiscountCode.maxDiscountAmount}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">حد الاستخدام</label>
            <input
              type="number"
              value={newDiscountCode.usageLimit}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, usageLimit: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right"
              dir="rtl"
              disabled={isLoading}
              placeholder="مثال: 100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ البدء <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={newDiscountCode.startDate}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">تاريخ الانتهاء <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={newDiscountCode.endDate}
              onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-reverse space-x-2">
              <input
                type="checkbox"
                checked={newDiscountCode.isActive}
                onChange={(e) => setNewDiscountCode((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="text-pink-600 rounded focus:ring-pink-500"
                disabled={isLoading}
              />
              <span className="text-sm font-medium text-gray-700">مفعّل</span>
            </label>
          </div>
        </div>
        <div className="flex space-x-reverse space-x-4 mt-6">
          <button
            onClick={editingDiscountCode ? handleUpdateDiscountCode : handleAddDiscountCode}
            className="bg-pink-600 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="animate-spin h-4 w-4 ml-2" />
                جاري المعالجة...
              </div>
            ) : editingDiscountCode ? (
              'تحديث كود الخصم'
            ) : (
              <div className="flex items-center">
                <Plus className="h-4 w-4 ml-2" />
                إضافة كود الخصم
              </div>
            )}
          </button>
          {(editingDiscountCode || newDiscountCode.code || newDiscountCode.percentageValue || newDiscountCode.fixedValue || newDiscountCode.startDate || newDiscountCode.endDate) && (
            <button
              onClick={() => {
                setEditingDiscountCode(null);
                setNewDiscountCode({
                  code: '',
                  type: 'Percentage',
                  percentageValue: '',
                  fixedValue: '',
                  minOrderAmount: '',
                  maxDiscountAmount: '',
                  usageLimit: '',
                  startDate: '',
                  endDate: '',
                  isActive: true,
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

      {/* Discount Codes List */}
      {isLoading && discountCodes.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <span className="mr-3 text-gray-600">جاري تحميل أكواد الخصم...</span>
        </div>
      ) : discountCodes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-gray-600">لا توجد أكواد خصم متاحة</p>
          <button
            onClick={() => fetchDiscountCodes(currentPage)}
            className="mt-4 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors flex items-center mx-auto"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            إعادة التحميل
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">أكواد الخصم المتاحة</h4>
          <div className="space-y-4">
            {discountCodes.map((discountCode) => (
              <div
                key={discountCode.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-800">{discountCode.code}</p>
                  <p className="text-sm text-gray-600">
                    النوع: {discountCode.type === 'Percentage' ? 'مئوي' : 'ثابت'} |{' '}
                    {discountCode.type === 'Percentage'
                      ? `نسبة الخصم: ${discountCode.percentageValue}%`
                      : `القيمة: ${discountCode.fixedValue} جنيه`}
                  </p>
                  <p className="text-sm text-gray-600">
                    الحد الأدنى للطلب: {discountCode.minOrderAmount ? `${discountCode.minOrderAmount} جنيه` : 'غير محدد'} |{' '}
                    الحد الأقصى للخصم: {discountCode.maxDiscountAmount ? `${discountCode.maxDiscountAmount} جنيه` : 'غير محدد'}
                  </p>
                  <p className="text-sm text-gray-600">
                    حد الاستخدام: {discountCode.usageLimit ? discountCode.usageLimit : 'غير محدود'} | الاستخدامات: {discountCode.usageCount}
                  </p>
                  <p className="text-sm text-gray-600">
                    من: {formatDate(discountCode.startDate)} إلى: {formatDate(discountCode.endDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    الحالة: <span className={discountCode.isActive ? 'text-green-600' : 'text-red-600'}>{discountCode.isActive ? 'مفعّل' : 'غير مفعّل'}</span>
                  </p>
                  <p className="text-sm text-gray-600">تاريخ الإنشاء: {formatDate(discountCode.createdAt)}</p>
                </div>
                <div className="flex items-center space-x-reverse space-x-2">
                  <button
                    onClick={() => {
                      setEditingDiscountCode(discountCode);
                      setNewDiscountCode({
                        code: discountCode.code,
                        type: discountCode.type,
                        percentageValue: discountCode.percentageValue?.toString() || '',
                        fixedValue: discountCode.fixedValue?.toString() || '',
                        minOrderAmount: discountCode.minOrderAmount?.toString() || '',
                        maxDiscountAmount: discountCode.maxDiscountAmount?.toString() || '',
                        usageLimit: discountCode.usageLimit?.toString() || '',
                        startDate: discountCode.startDate.split('T')[0],
                        endDate: discountCode.endDate.split('T')[0],
                        isActive: discountCode.isActive,
                      });
                    }}
                    className="text-blue-600 hover:text-blue-700 p-2 disabled:opacity-50 hover:bg-blue-50 rounded transition-colors"
                    title="تعديل كود الخصم"
                    disabled={isLoading}
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteDiscountCode(discountCode.id)}
                    className="text-red-600 hover:text-red-700 p-2 disabled:opacity-50 hover:bg-red-50 rounded transition-colors"
                    title="حذف كود الخصم"
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
            عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalItems)} من {totalItems} كود خصم
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountCodesManagement;