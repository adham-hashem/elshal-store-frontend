import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

interface ApiResponse {
  items: Product[];
  totalItems: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

const ChildrenPage: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    // Scroll to top when the component mounts
    useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchProducts = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('jwt_token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/products/children?pageNumber=${page}&pageSize=10`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('Content-Type');
      if (!response.ok) {
        const text = await response.text();
        // console.error(`HTTP error! Status: ${response.status}, Response: ${text.substring(0, 200)}...`);
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        // console.error(`Expected JSON, received ${contentType}: ${text.substring(0, 200)}...`);
        throw new Error(`Invalid response format: Expected JSON, received ${contentType}`);
      }

      const data: ApiResponse = await response.json();

      if (!data || !Array.isArray(data.items)) {
        throw new Error('Invalid response format: items is not an array');
      }

      const mappedProducts: Product[] = data.items.map(item => ({
        ...item,
        inStock: item.inStock !== undefined ? item.inStock : true,
        isOffer: item.isOffer !== undefined ? item.isOffer : false,
        originalPrice: item.originalPrice !== undefined ? item.originalPrice : undefined,
      }));

      setProducts(mappedProducts);
      setTotalPages(data.totalPages);
      setPageNumber(data.pageNumber);
    } catch (err) {
      // console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== pageNumber) {
      fetchProducts(page);
    }
  };

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      fetchProducts(pageNumber - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages) {
      fetchProducts(pageNumber + 1);
    }
  };

  const handleViewProduct = (product: Product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleAddToCart = (product: Product) => {
    if (!product.inStock) {
      return;
    }
    if (product.sizes.length > 0 || product.colors.length > 0) {
      navigate(`/product/${product.id}`, { state: { product } });
    } else {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product,
          quantity: 1,
          selectedSize: product.sizes[0] || '',
          selectedColor: product.colors[0] || '',
        },
      });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show current page with 2 pages on each side
      let start = Math.max(1, pageNumber - 2);
      let end = Math.min(totalPages, pageNumber + 2);
      
      // Adjust start and end to always show 5 pages when possible
      if (end - start < maxPagesToShow - 1) {
        if (start === 1) {
          end = Math.min(totalPages, start + maxPagesToShow - 1);
        } else {
          start = Math.max(1, end - maxPagesToShow + 1);
        }
      }
      
      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis and last page if needed
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = getPageNumbers();

    return (
      <div className="flex justify-center items-center space-x-2 mt-8 space-x-reverse">
        {/* Previous button */}
        <button
          onClick={handlePrevPage}
          disabled={pageNumber === 1 || loading}
          className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={20} />
          <span className="mr-1">السابق</span>
        </button>

        {/* Page numbers */}
        <div className="flex space-x-1 space-x-reverse">
          {pageNumbers.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <button
                  onClick={() => handlePageChange(page as number)}
                  disabled={loading}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    pageNumber === page
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={handleNextPage}
          disabled={pageNumber === totalPages || loading}
          className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          <span className="ml-1">التالي</span>
          <ChevronLeft size={20} />
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
          <h1 className="text-3xl font-bold text-gray-800 mb-4">قسم الأطفال</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            ملابس أطفال عصرية ومريحة، من الفساتين الجميلة للبنات إلى الملابس الكاجوال للأولاد
          </p>
        </div>

        {loading && products.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">جار التحميل...</h2>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">لا توجد منتجات حالياً</h2>
            <p className="text-gray-600 mb-6">سيتم إضافة منتجات جديدة قريباً</p>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onViewProduct={handleViewProduct}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default ChildrenPage;