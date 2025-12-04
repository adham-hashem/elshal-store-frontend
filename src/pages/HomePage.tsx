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
      // Assuming 'jwt_token' is required for product fetching
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
      // Fetch only 3 women's products and 6 children's products for a cleaner look on the homepage
      const womenData = await fetchProducts('women', 3); 
      const childrenData = await fetchProducts('children', 6);
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
    // Logic for products requiring size/color selection before adding to cart
    if ((product.sizes && product.sizes.length > 0) || (product.colors && product.colors.length > 0)) {
      navigate(`/product/${product.id}`, { state: { product } });
    } else {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product,
          quantity: 1,
          selectedSize: product.sizes ? product.sizes[0] : '', // Default to first available or empty
          selectedColor: product.colors ? product.colors[0] : '', // Default to first available or empty
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* 2. FEATURED PRODUCTS SECTION */}
      <div className="container mx-auto px-6 pt-16 pb-20 md:pb-24">
        {/* Adjusted to be inline-block for better centering control */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight drop-shadow-sm border-b-4 border-pink-500/50 inline-block pb-2">
            منتجاتنا المميزة ✨
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">جار التحميل...</h2>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-red-50 rounded-xl p-8 shadow-inner">
            <h2 className="text-2xl font-bold text-red-700 mb-4">⚠️ {error}</h2>
            <p className="text-gray-600 mb-6">حدث خطأ أثناء جلب المنتجات. يرجى التأكد من اتصالك أو معاودة المحاولة.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold shadow-md"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {/* Women's Products */}
            {womenProducts.length > 0 && (
              <div className="mb-20">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 text-right p-4 border-r-8 border-pink-500 bg-pink-50 rounded-lg shadow-md">
                  🛍️ ملابس الحريمي
                </h3>
                {/* Product Grid: 2 columns on mobile (default), 3 columns on large screens for this section */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                  {womenProducts.map(product => (
                    <div
                      key={product.id}
                      className="relative transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl rounded-xl overflow-hidden shadow-lg bg-white"
                    >
                      <ProductCard
                        product={product}
                        onViewProduct={handleViewProduct}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-12">
                  <button
                    onClick={() => navigate('/women')}
                    className="bg-pink-500 text-white px-12 py-4 rounded-full hover:bg-pink-600 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
                  >
                    عرض كل منتجات الحريمي
                  </button>
                </div>
              </div>
            )}
            
            {/* Children's Products */}
            {childrenProducts.length > 0 && (
              <div className="mb-20 bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl shadow-inner">
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10 text-right p-4 border-r-8 border-purple-500 bg-white rounded-lg shadow-md">
                  👶 ملابس الأطفال
                </h3>
                {/* Product Grid: 2 columns on mobile (default), 3 columns on large screens */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                  {childrenProducts.map(product => (
                    <div
                      key={product.id}
                      className="relative transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl rounded-xl overflow-hidden shadow-lg bg-white"
                    >
                      <ProductCard
                        product={product}
                        onViewProduct={handleViewProduct}
                        onAddToCart={handleAddToCart}
                      />
                    </div>
                  ))}
                </div>
                <div className="text-center mt-12">
                  <button
                    onClick={() => navigate('/children')}
                    className="bg-purple-600 text-white px-12 py-4 rounded-full hover:bg-purple-700 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
                  >
                    عرض كل منتجات الأطفال
                  </button>
                </div>
              </div>
            )}

            {/* No Products Found */}
            {(womenProducts.length === 0 && childrenProducts.length === 0) && (
              <div className="text-center py-20 bg-gray-50 rounded-xl shadow-lg">
                <div className="text-7xl mb-6">📦</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">لا توجد منتجات للعرض حالياً</h2>
                <p className="text-gray-600 mb-8 text-lg">نحن نعمل على إضافة مجموعة جديدة ومميزة قريباً!</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 3. WHY CHOOSE US / FEATURES SECTION */}
      <section className="bg-gray-900 py-12 md:py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-16 border-b-4 border-pink-500/50 inline-block pb-2">
            لماذا نحن اختيارك الأفضل؟ 🌟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-right">
            
            {/* Feature 1: Quality */}
            <div className="p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl transition-transform duration-500 hover:scale-[1.03] border border-pink-500/50">
              <div className="text-6xl mb-4 text-pink-400">💎</div>
              <h3 className="text-2xl font-bold text-white mb-3">الجودة أولاً</h3>
              <p className="text-gray-300">نضمن لك أجود أنواع الأقمشة وأعلى مستويات التصنيع لتدوم منتجاتنا طويلاً.</p>
            </div>
            
            {/* Feature 2: Fast Shipping */}
            <div className="p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl transition-transform duration-500 hover:scale-[1.03] border border-purple-500/50">
              <div className="text-6xl mb-4 text-purple-400">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-3">توصيل سريع وموثوق</h3>
              <p className="text-gray-300">استمتع بخدمة توصيل سريعة لجميع أنحاء البلاد، وتتبع شحنتك خطوة بخطوة.</p>
            </div>
            
            {/* Feature 3: Customer Support */}
            <div className="p-8 bg-white/10 backdrop-blur-sm rounded-xl shadow-2xl transition-transform duration-500 hover:scale-[1.03] border border-blue-500/50">
              <div className="text-6xl mb-4 text-blue-400">📞</div>
              <h3 className="text-2xl font-bold text-white mb-3">دعم عملاء مميز</h3>
              <p className="text-gray-300">فريقنا جاهز لمساعدتك والرد على استفساراتك على مدار الساعة.</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* 4. FINAL CTA BUTTONS */}
      <div className="container mx-auto px-6 text-center mt-16 mb-20 space-x-4 space-y-4 md:space-y-0">
        <button
          onClick={() => navigate('/women')}
          className="bg-pink-500 text-white px-10 py-3 rounded-xl hover:bg-pink-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
        >
          تصفح قسم الحريمي
        </button>
        <button
          onClick={() => navigate('/children')}
          className="bg-purple-600 text-white px-10 py-3 rounded-xl hover:bg-purple-700 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-lg"
        >
          تصفح قسم الأطفال
        </button>
      </div>
    </div>
  );
};

export default HomePage;