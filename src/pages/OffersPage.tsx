import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Tag, Loader2, Copy, AlertCircle } from 'lucide-react';

// Define interfaces
interface OfferItem {
  id: string;
  title: string;
  description: string;
  imagePath: string;
  category: number;
  discountPercentage: number;
  originalPrice: number;
  salePrice: number;
  startDate: string;
  endDate: string;
  isFeatured: boolean;
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

interface ApiResponse<T> {
  items: T[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 10;

const OffersPage: React.FC = () => {
  const navigate = useNavigate();

  // State for offers
  const [offerItems, setOfferItems] = useState<OfferItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [errorOffers, setErrorOffers] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // State for discount codes
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loadingDiscountCodes, setLoadingDiscountCodes] = useState(true);
  const [errorDiscountCodes, setErrorDiscountCodes] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Helper function to check if token is valid
  const isTokenValid = (): boolean => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return false;
    
    try {
      // Parse JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  };

  // Helper function to handle authentication errors
  const handleAuthError = () => {
    setAuthError(true);
    localStorage.removeItem('jwt_token');
    // Optionally redirect to login page
    // navigate('/login');
  };

  // Public API request (no authentication required)
  const makePublicRequest = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    return response;
  };

  // Enhanced fetch function with better error handling
  const makeAuthenticatedRequest = async (url: string, requireAuth: boolean = true) => {
    const token = localStorage.getItem('jwt_token');
    
    if (requireAuth && !token) {
      throw new Error('لا يوجد رمز مصادقة. يرجى تسجيل الدخول مرة أخرى.');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header only if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.status === 401) {
      handleAuthError();
      throw new Error('انتهت صلاحية جلسة التصفح. يرجى تسجيل الدخول مرة أخرى.');
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    return response;
  };

  // Fetch offers (public endpoint - no authentication required)
  const fetchOffers = useCallback(async (pageNumber: number) => {
    setLoadingOffers(true);
    setErrorOffers(null);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      
      // Try public access first
      const response = await makePublicRequest(
        `${apiUrl}/api/offers?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`
      );
      
      const data: ApiResponse<OfferItem> = await response.json();
      setOfferItems(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalItems || 0);
      setCurrentPage(data.pageNumber || pageNumber);
    } catch (err) {
      // If public access fails, try with authentication as fallback
      try {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          console.log('Public access failed, trying authenticated request...');
          const authResponse = await makeAuthenticatedRequest(
            `${apiUrl}/api/offers?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`,
            false
          );
          const data: ApiResponse<OfferItem> = await authResponse.json();
          setOfferItems(data.items || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalItems || 0);
          setCurrentPage(data.pageNumber || pageNumber);
        } else {
          throw err;
        }
      } catch (authErr) {
        setErrorOffers(err instanceof Error ? err.message : 'Failed to fetch offers');
        console.error('Error fetching offers:', err);
      }
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  // Fetch discount codes with fallback for unauthenticated users
  const fetchDiscountCodes = useCallback(async () => {
    setLoadingDiscountCodes(true);
    setErrorDiscountCodes(null);
    
    // Skip fetching discount codes if no valid token
    if (!isTokenValid()) {
      setLoadingDiscountCodes(false);
      setErrorDiscountCodes('يرجى تسجيل الدخول لعرض أكواد الخصم');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await makeAuthenticatedRequest(
        `${apiUrl}/api/discount-codes?pageNumber=1&pageSize=${PAGE_SIZE}`,
        true // Require authentication for discount codes
      );

      const data: ApiResponse<DiscountCode> = await response.json();
      setDiscountCodes(data.items || []);
    } catch (err) {
      setErrorDiscountCodes(err instanceof Error ? err.message : 'Failed to fetch discount codes');
      console.error('Error fetching discount codes:', err);
    } finally {
      setLoadingDiscountCodes(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchOffers(1);
    fetchDiscountCodes();
  }, [fetchOffers, fetchDiscountCodes]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      fetchOffers(pageNumber);
      window.scrollTo(0, 0);
    }
  };

  const handleExploreOffer = (offerId: string) => {
    navigate(`/offers/${offerId}`);
  };

  // Copy discount code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`تم نسخ الكود: ${code}`);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-reverse space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg ${
            currentPage === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          السابق
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-lg ${
              page === currentPage
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg ${
            currentPage === totalPages
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
          }`}
        >
          التالي
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <Link
          to="/"
          className="flex items-center space-x-reverse space-x-2 text-gray-600 hover:text-pink-600 mb-6 transition-colors"
        >
          <ArrowRight size={20} />
          <span>العودة للرئيسية</span>
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-reverse space-x-3 mb-4">
            <Tag className="text-red-500" size={32} />
            <h1 className="text-3xl font-bold text-gray-800">العروض الخاصة</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            اكتشفي أفضل العروض والخصومات على مجموعة مختارة من منتجاتنا المميزة
          </p>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              عدد العروض: {totalCount} عرض
            </p>
          )}
        </div>

        {/* Authentication Error Alert */}
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="text-red-500 ml-3" size={20} />
              <div>
                <h3 className="text-red-800 font-medium">انتهت صلاحية جلسة التصفح</h3>
                <p className="text-red-600 text-sm mt-1">
                  يرجى تسجيل الدخول مرة أخرى للوصول إلى جميع الميزات
                </p>
              </div>
            </div>
            <button
              onClick={handleLogin}
              className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              تسجيل الدخول
            </button>
          </div>
        )}

        {/* Discount Codes Section */}
        <div className="bg-gradient-to-l from-red-50 to-pink-50 rounded-2xl p-6 mb-8 border border-red-200">
          <h2 className="text-xl font-bold text-red-800 mb-4 text-center">أكواد الخصم المتاحة</h2>
          {loadingDiscountCodes ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="animate-spin text-red-600" size={24} />
              <span className="mr-2 text-gray-600">جاري تحميل أكواد الخصم...</span>
            </div>
          ) : errorDiscountCodes ? (
            <div className="text-center py-4">
              <p className="text-red-600 mb-2">{errorDiscountCodes}</p>
              {!authError && (
                <button
                  onClick={() => fetchDiscountCodes()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  إعادة المحاولة
                </button>
              )}
              {authError && (
                <button
                  onClick={handleLogin}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>
          ) : discountCodes.length === 0 ? (
            <p className="text-center text-gray-600">لا توجد أكواد خصم متاحة حالياً</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {discountCodes.map((code) => (
                <div
                  key={code.id}
                  className="bg-white p-4 rounded-lg border border-red-200 text-center relative group"
                >
                  <div className="text-lg font-bold text-red-600 mb-2">{code.code}</div>
                  <div className="text-sm text-gray-600">
                    {code.percentageValue
                      ? `خصم ${code.percentageValue}% (الحد الأقصى: ${code.maxDiscountAmount || 'غير محدد'} ج.م)`
                      : `خصم ثابت ${code.fixedValue} ج.م`}
                    {code.minOrderAmount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        الحد الأدنى للطلب: {code.minOrderAmount} ج.م
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      ساري حتى: {new Date(code.endDate).toLocaleDateString('ar-EG')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyCode(code.code)}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 p-2 rounded-full hover:bg-gray-200"
                    title="نسخ الكود"
                  >
                    <Copy size={16} className="text-gray-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Offers Section */}
        {loadingOffers && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin text-red-600" size={48} />
            <span className="mr-3 text-gray-600">جاري تحميل العروض...</span>
          </div>
        )}

        {errorOffers && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">حدث خطأ في تحميل العروض</h2>
            <p className="text-gray-600 mb-6">{errorOffers}</p>
            <button
              onClick={() => fetchOffers(currentPage)}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loadingOffers && !errorOffers && offerItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏷️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">لا توجد عروض حالياً</h2>
            <p className="text-gray-600 mb-6">تابعونا للحصول على أحدث العروض والخصومات</p>
            <button
              onClick={() => navigate('/')}
              className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        )}

        {!loadingOffers && !errorOffers && offerItems.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {offerItems.map(offer => (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={offer.imagePath}
                      alt={offer.title}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.jpg';
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{offer.discountPercentage}%
                    </div>
                    {offer.isFeatured && (
                      <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        مميز
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                      {offer.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {offer.description}
                    </p>

                    <div className="mt-auto">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-reverse space-x-2">
                          <span className="text-xl font-bold text-red-600">
                            {offer.salePrice.toFixed(2)} ج.م
                          </span>
                          {offer.originalPrice > offer.salePrice && (
                            <span className="text-sm text-gray-400 line-through">
                              {offer.originalPrice.toFixed(2)} ج.م
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        <div>يبدأ: {new Date(offer.startDate).toLocaleDateString('ar-EG')}</div>
                        <div>ينتهي: {new Date(offer.endDate).toLocaleDateString('ar-EG')}</div>
                      </div>

                      <button
                        className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white py-2 px-4 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold"
                        onClick={() => handleExploreOffer(offer.id)}
                      >
                        استكشف العرض
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default OffersPage;