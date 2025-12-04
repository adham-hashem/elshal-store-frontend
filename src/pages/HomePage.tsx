import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const HomePage: React.FC = () => {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [womenProducts, setWomenProducts] = useState<Product[]>([]);
  const [childrenProducts, setChildrenProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWelcomeVisible(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchProducts = async (category: 'women' | 'children', pageSize: number = 4) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('jwt_token') || 'jwt_token';
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/products/${category}?pageNumber=1&pageSize=${pageSize}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const contentType = response.headers.get('Content-Type');
      if (!response.ok) {
        const text = await response.text();
        console.error(`HTTP error! Status: ${response.status}, Response: ${text.substring(0, 200)}...`);
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }
      if (!contentType?.includes('application/json')) {
        const text = await response.text();
        console.error(`Expected JSON, received ${contentType}: ${text.substring(0, 200)}...`);
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
      return mappedProducts;
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Error fetching products. Please try again later.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAllProducts = async () => {
      const womenData = await fetchProducts('women', 4);
      const childrenData = await fetchProducts('children', 8);
      setWomenProducts(womenData);
      setChildrenProducts(childrenData);
    };
    fetchAllProducts();
  }, []);

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

return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Featured Products */}
      <div className="container mx-auto px-6 pb-16 md:pb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 mt-6 tracking-tight drop-shadow-sm">
          منتجاتنا المميزة
        </h2>
        {loading ? (
          // ... loading content
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">جار التحميل...</h2>
          </div>
        ) : error ? (
          // ... error content
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
            <button
              onClick={() => navigate('/')}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              العودة للرئيسية
            </button>
          </div>
        ) : (
          <>
            {/* Women's Products */}
            {womenProducts.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-right bg-gradient-to-r from-pink-100 to-transparent p-4 rounded-lg">
                  ملابس الحريمي
                </h3>
                {/* *** CHANGE APPLIED HERE *** */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {womenProducts.map(product => (
                    <div
                      key={product.id}
                      className="relative transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg overflow-hidden"
                    >
                      <ProductCard
                        product={product}
                        onViewProduct={handleViewProduct}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <button
                    onClick={() => navigate('/women')}
                    className="bg-pink-600 text-white px-10 py-3 rounded-full hover:bg-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    عرض المزيد
                  </button>
                </div>
              </div>
            )}
            {/* Children's Products */}
            {childrenProducts.length > 0 && (
              <div className="mb-16 bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-right bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg">
                  ملابس الأطفال
                </h3>
                {/* *** CHANGE APPLIED HERE *** */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  {childrenProducts.map(product => (
                    <div
                      key={product.id}
                      className="relative transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-lg overflow-hidden"
                    >
                      <ProductCard
                        product={product}
                        onViewProduct={handleViewProduct}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <button
                    onClick={() => navigate('/children')}
                    className="bg-purple-600 text-white px-10 py-3 rounded-full hover:bg-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    عرض المزيد
                  </button>
                </div>
              </div>
            )}
            {/* ... no products content ... */}
            {(womenProducts.length === 0 && childrenProducts.length === 0) && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👶</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">لا توجد منتجات حالياً</h2>
                <p className="text-gray-600 mb-6">سيتم إضافة منتجات جديدة قريباً</p>
              </div>
            )}
            {/* ... view all buttons ... */}
            <div className="text-center mt-12 space-x-4 space-y-4 md:space-y-0">
              <button
                onClick={() => navigate('/women')}
                className="bg-pink-600 text-white px-10 py-3 rounded-full hover:bg-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                تصفح قسم الحريمي
              </button>
              <button
                onClick={() => navigate('/children')}
                className="bg-purple-600 text-white px-10 py-3 rounded-full hover:bg-purple-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1"
              >
                تصفح قسم الأطفال
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;