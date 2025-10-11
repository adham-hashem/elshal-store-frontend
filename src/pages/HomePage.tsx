import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import ProductCard from '../components/ProductCard';
import { Product } from '../types';

const HomePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isWhyChooseUsVisible, setIsWhyChooseUsVisible] = useState(false);
  const [isTestimonialsVisible, setIsTestimonialsVisible] = useState(false);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Animation triggers for sections
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsWelcomeVisible(true);
    }, 500);
    const timer2 = setTimeout(() => {
      setIsWhyChooseUsVisible(true);
    }, 700);
    const timer3 = setTimeout(() => {
      setIsTestimonialsVisible(true);
    }, 900);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-50">
      {/* Hero Section with Enhanced Parallax and Overlay */}
      <div className="relative overflow-hidden h-[500px] md:h-[750px] lg:h-[800px]">
        <img
          src="/الصورة الرئسية.jpg"
          alt="الشال للملابس الراقية"
          className="w-full h-full object-cover transform transition-transform duration-1000 ease-out hover:scale-105"
          style={{ transform: 'translateY(calc(var(--scroll-y) * -0.3))' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent flex items-center justify-center">
          <div className="text-center text-white px-6 animate-fade-in-down">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-4 tracking-tight drop-shadow-2xl" style={{ fontFamily: 'serif' }}>
              الشال
            </h1>
            <p className="text-xl md:text-3xl lg:text-4xl font-light tracking-wide drop-shadow-xl">
              للملابس الراقية
            </p>
            <div className="mt-8 space-x-4 space-y-4 md:space-y-0">
              <button
                onClick={() => navigate('/women')}
                className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-10 py-4 rounded-full hover:from-pink-700 hover:to-pink-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
              >
                قسم الحريمي
              </button>
              <button
                onClick={() => navigate('/children')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-10 py-4 rounded-full hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-2xl transform hover:-translate-y-1"
              >
                قسم الأطفال
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Message with Enhanced Styling */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div
          className={`bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-10 md:p-16 shadow-2xl border border-pink-200 transform transition-all duration-1000 ease-in-out ${
            isWelcomeVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          }`}
        >
          <div className="text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              مرحباً بكم في الشال للملابس الراقية
            </h2>
            <p className="text-lg md:text-2xl text-gray-700 leading-relaxed text-right max-w-5xl mx-auto font-light">
              في الشال للملابس الراقية، نقدم لكِ تشكيلة مميزة تجمع بين الأناقة والراحة لكِ ولأطفالك. من الملابس النسائية الفاخرة إلى الملابس المنزلية المريحة، والتصاميم الكاجوال العصرية والكلاسيكية الراقية.
              <br /><br />
              كما نقدم ملابس الأطفال المميزة للمنزل والخروج، لضمان إطلالة أنيقة وراحة لا مثيل لها.
              <br /><br />
              مع الشال، كل قطعة مصممة بعناية فائقة وخامات عالية الجودة لتضفي لمسة مميزة على إطلالتكِ وإطلالة صغاركِ كل يوم.
            </p>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div
          className={`bg-white rounded-3xl p-10 md:p-16 shadow-xl border border-gray-100 transform transition-all duration-1000 ease-in-out ${
            isWhyChooseUsVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          }`}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-12 tracking-tight">
            لماذا تختارين الشال؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-pink-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">جودة عالية</h3>
              <p className="text-gray-600">نستخدم أفضل الخامات لضمان الراحة والمتانة.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">تصاميم عصرية</h3>
              <p className="text-gray-600">تشكيلة متنوعة تناسب جميع الأذواق والمناسبات.</p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">راحة الأطفال</h3>
              <p className="text-gray-600">ملابس مريحة وأنيقة لصغارك في كل الأوقات.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products with Enhanced Grid */}
      <div className="container mx-auto px-6 pb-16 md:pb-24">
        <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-12 tracking-tight drop-shadow-md">
          منتجاتنا المميزة
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
          {featuredProducts.map(product => (
            <div
              key={product.id}
              className="relative transform transition-all duration-500 hover:scale-105 hover:shadow-2xl rounded-xl overflow-hidden"
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
            className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-12 py-4 rounded-full hover:from-pink-700 hover:to-pink-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            تصفح قسم الحريمي
          </button>
          <button
            onClick={() => navigate('/children')}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-12 py-4 rounded-full hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            تصفح قسم الأطفال
          </button>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div
          className={`bg-gradient-to-r from-gray-50 to-gray-100 rounded-3xl p-10 md:p-16 shadow-xl border border-gray-200 transform transition-all duration-1000 ease-in-out ${
            isTestimonialsVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
          }`}
        >
          <h2 className="text-3xl md:text-5xl font-bold text-center text-gray-900 mb-12 tracking-tight">
            ماذا يقول عملاؤنا
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <p className="text-gray-600 text-right mb-4">"الملابس من الشال رائعة! الجودة ممتازة والتصاميم تناسب ذوقي تماماً."</p>
              <p className="text-gray-800 font-semibold text-right">سارة أحمد</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <p className="text-gray-600 text-right mb-4">"أحب ملابس الأطفال من الشال، مريحة وأنيقة وتدوم طويلاً."</p>
              <p className="text-gray-800 font-semibold text-right">ليلى محمد</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <p className="text-gray-600 text-right mb-4">"تجربة تسوق رائعة، المنتجات فاقت توقعاتي!"</p>
              <p className="text-gray-800 font-semibold text-right">نورا عبدالله</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;