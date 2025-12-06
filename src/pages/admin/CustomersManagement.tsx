import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, X, ChevronRight, ChevronLeft } from 'lucide-react';

// Updated Customer interface to match API response
interface Customer {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  governorate?: string;
  isEmailVerified: boolean;
  orderCount: number;
  isProfileComplete: boolean;
}

interface PaginatedCustomersResponse {
  items: Customer[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const apiUrl = import.meta.env.VITE_API_BASE_URL;

const CustomersManagement: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        if (!apiUrl) {
          throw new Error('API base URL is not configured.');
        }

        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found. Please log in again.');
        }

        const response = await fetch(`${apiUrl}/api/users/customers?pageNumber=${pageNumber}&pageSize=${pageSize}`, {
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
          throw new Error(`Failed to fetch customers: ${response.status} ${errorText}`);
        }

        const data: PaginatedCustomersResponse = await response.json();

        if (!Array.isArray(data.items)) {
          // console.error('Expected an array for data.items, received:', data.items);
          setCustomers([]);
          throw new Error('Invalid response format: Expected an array of customers.');
        }

        setCustomers(data.items);
        setTotalPages(data.totalPages);
      } catch (err: any) {
        // console.error('Error fetching customers:', err);
        setError(err.message || 'An error occurred while fetching customers.');
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCustomers();
    } else {
      setError('You must be logged in to view customers.');
      setLoading(false);
      setCustomers([]);
    }
  }, [isAuthenticated, pageNumber]);

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseDetails = () => {
    setSelectedCustomer(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPageNumber(newPage);
      setLoading(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <span className="mr-3 text-gray-600">جاري تحميل بيانات العملاء...</span>
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">إدارة العملاء</h2>

      {selectedCustomer ? (
        <div className="mb-6 p-4 sm:p-6 bg-white rounded-xl shadow-md border border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">تفاصيل العميل</h3>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">الاسم:</span>
              <span className="text-gray-900">{selectedCustomer.fullName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">البريد الإلكتروني:</span>
              <span className="text-gray-900">{selectedCustomer.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">رقم الهاتف:</span>
              <span className="text-gray-900">{selectedCustomer.phoneNumber || 'غير متوفر'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">إجمالي الطلبات:</span>
              <span className="text-gray-900">{selectedCustomer.orderCount}</span>
            </div>
            {selectedCustomer.address && (
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="text-gray-500 font-medium">العنوان:</span>
                <span className="text-gray-900">{selectedCustomer.address}</span>
              </div>
            )}
            {selectedCustomer.governorate && (
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <span className="text-gray-500 font-medium">المحافظة:</span>
                <span className="text-gray-900">{selectedCustomer.governorate}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">البريد مؤكد:</span>
              <span className="text-gray-900">{selectedCustomer.isEmailVerified ? 'نعم' : 'لا'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between">
              <span className="text-gray-500 font-medium">الملف مكتمل:</span>
              <span className="text-gray-900">{selectedCustomer.isProfileComplete ? 'نعم' : 'لا'}</span>
            </div>
          </div>
          <button
            onClick={handleCloseDetails}
            className="mt-4 bg-gray-300 text-gray-700 px-4 sm:px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors flex items-center text-sm sm:text-base"
          >
            <X className="h-4 w-4 ml-2" />
            إغلاق
          </button>
        </div>
      ) : customers.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden sm:block bg-white rounded-xl shadow-md border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهاتف</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجمالي الطلبات</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.fullName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phoneNumber || 'غير متوفر'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.orderCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleViewCustomer(customer)}
                          className="flex items-center text-pink-600 hover:text-pink-800"
                        >
                          <Eye className="h-4 w-4 ml-1" />
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
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-4 transition-all duration-200 hover:shadow-lg"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{customer.fullName}</p>
                    <p className="text-xs text-gray-500">{customer.email}</p>
                  </div>
                  <button
                    onClick={() => handleViewCustomer(customer)}
                    className="flex items-center text-xs text-pink-600 bg-pink-50 px-2 py-1 rounded hover:bg-pink-100"
                  >
                    <Eye className="h-3 w-3 ml-1" />
                    التفاصيل
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">رقم الهاتف:</span>
                    <span className="text-xs text-gray-900">{customer.phoneNumber || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">إجمالي الطلبات:</span>
                    <span className="text-xs text-gray-900">{customer.orderCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="mt-6 flex justify-center items-center space-x-4 space-x-reverse">
            <button
              onClick={() => handlePageChange(pageNumber - 1)}
              disabled={pageNumber === 1}
              className={`px-4 py-2 rounded-lg flex items-center ${
                pageNumber === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-700'
              }`}
            >
              <ChevronRight className="h-4 w-4 ml-2" />
              السابق
            </button>
            <span className="text-gray-600">
              الصفحة {pageNumber} من {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pageNumber + 1)}
              disabled={pageNumber === totalPages}
              className={`px-4 py-2 rounded-lg flex items-center ${
                pageNumber === totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-pink-600 text-white hover:bg-pink-700'
              }`}
            >
              التالي
              <ChevronLeft className="h-4 w-4 mr-2" />
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-600">لا توجد بيانات عملاء متاحة حالياً</p>
        </div>
      )}
    </div>
  );
};

export default CustomersManagement;