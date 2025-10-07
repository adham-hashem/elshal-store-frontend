import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);

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

  const handleViewProduct = (product: Product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  const handleAddToCart = (product: Product) => {
    if (product.sizes.length > 0 || product.colors.length > 0) {
      navigate(`/product/${product.id}`, { state: { product } });
    } else {
      dispatch({
        type: 'ADD_TO_CART',
        payload: {
          product,
          quantity: 1,
          selectedSize: product.sizes[0] || '',
          selectedColor: product.colors[0] || ''
        }
      });
    }
  };

  const featuredProducts = state.products.slice(0, 8);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section with Parallax Effect */}
      <div className="relative overflow-hidden h-[450px] md:h-[700px]">
        <img
          src="/الصورة الرئسية.jpg"
          alt="الشال للملابس الراقية"
          className="w-full h-full object-cover transform transition-transform duration-1000 ease-out hover:scale-110"
          style={{ transform: 'translateY(calc(var(--scroll-y) * -0.2))' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent flex items-center justify-center">
          <div className="text-center text-white px-6 animate-fade-in-down">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight drop-shadow-lg" style={{ fontFamily: 'serif' }}>
              الشال
            </h1>
            <p className="text-xl md:text-3xl font-light tracking-wide drop-shadow-md">
              للملابس الراقية
            </p>
            {/* <button
              onClick={() => navigate('/shop')}
              className="mt-6 bg-pink-500 text-white px-8 py-3 rounded-full hover:bg-pink-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
            >
              تسوق الآن
            </button> */}
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div
          className={`bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-10 md:p-14 shadow-2xl border border-pink-100 transform transition-all duration-1000 ease-in-out ${
            isWelcomeVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'
          }`}
        >
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              مرحباً بكم في الشال للملابس الراقية
            </h2>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-right max-w-4xl mx-auto font-light">
              في الشال للملابس الراقية، نقدم لكِ تشكيلة مميزة تجمع بين الأناقة والراحة لكِ ولأطفالك. من الملابس النسائية الفاخرة إلى الملابس المنزلية المريحة، والتصاميم الكاجوال العصرية والكلاسيكية الراقية.
              <br /><br />
              كما نقدم ملابس الأطفال المميزة للمنزل والخروج، لضمان إطلالة أنيقة وراحة لا مثيل لها.
              <br /><br />
              مع الشال، كل قطعة مصممة بعناية فائقة وخامات عالية الجودة لتضفي لمسة مميزة على إطلالتكِ وإطلالة صغاركِ كل يوم.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto px-6 pb-16 md:pb-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12 tracking-tight drop-shadow-sm">
          منتجاتنا المميزة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {featuredProducts.map(product => (
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
      </div>
    </div>
  );
};

export default HomePage;