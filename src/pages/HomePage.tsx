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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative">
        <img
          src="/الصورة الرئسية.jpg"
          alt="الشال للملابس الراقية"
          className="w-full h-96 md:h-[500px] object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'serif' }}>
              الشال
            </h1>
            <p className="text-xl md:text-2xl">للملابس الراقية</p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="container mx-auto px-4 py-12">
        <div
          className={`bg-gradient-to-l from-pink-50 to-purple-50 rounded-2xl p-8 shadow-lg border border-pink-200 transform transition-all duration-1000 ${
            isWelcomeVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        >
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 leading-relaxed">
              مرحباً بكم في الشال للملابس الراقية
            </h2>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-right">
              في الشال للملابس الراقية هتلاقي كل اللي يهمك إنتي وولادك.. من اللبس الحريمي الراقي لحد البيتي المريح، وكمان الكاجوال العصري والليدي الكلاسيك.
              <br /><br />
              مش بس كده، عندنا لبس أطفال بيتي وخروج يخليهم دايمًا شيك ومرتاحين.
              <br /><br />
              مع الشال، كل قطعة معمولة بذوق وخامة حلوة علشان كل يوم يبقى استايل جديد ليكي وللصغيرين.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto px-4 pb-12">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">منتجاتنا المميزة</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onViewProduct={handleViewProduct}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
        
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/women')}
            className="bg-pink-600 text-white px-8 py-3 rounded-lg hover:bg-pink-700 transition-colors font-semibold mx-2"
          >
            تصفح قسم الحريمي
          </button>
          <button
            onClick={() => navigate('/children')}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold mx-2"
          >
            تصفح قسم الأطفال
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;