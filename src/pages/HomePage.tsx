import React, { useEffect, useState } from 'react';
import { ShoppingBag, Sparkles, Shield, Truck, Heart } from 'lucide-react';

const HomePage: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isWelcomeVisible, setIsWelcomeVisible] = useState(false);
  const [isWhyChooseUsVisible, setIsWhyChooseUsVisible] = useState(false);
  const [isTestimonialsVisible, setIsTestimonialsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer1 = setTimeout(() => setIsWelcomeVisible(true), 300);
    const timer2 = setTimeout(() => setIsWhyChooseUsVisible(true), 600);
    const timer3 = setTimeout(() => setIsTestimonialsVisible(true), 900);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const featuredProducts = [
    {
      id: 1,
      name: 'فستان أنيق للمناسبات',
      price: 299,
      image: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'women'
    },
    {
      id: 2,
      name: 'بلوزة كاجوال عصرية',
      price: 149,
      image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'women'
    },
    {
      id: 3,
      name: 'ملابس أطفال مريحة',
      price: 120,
      image: 'https://images.pexels.com/photos/8976538/pexels-photo-8976538.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'children'
    },
    {
      id: 4,
      name: 'فستان أطفال للحفلات',
      price: 189,
      image: 'https://images.pexels.com/photos/6004828/pexels-photo-6004828.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'children'
    },
    {
      id: 5,
      name: 'عباية فاخرة',
      price: 399,
      image: 'https://images.pexels.com/photos/5710082/pexels-photo-5710082.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'women'
    },
    {
      id: 6,
      name: 'طقم أطفال كاجوال',
      price: 159,
      image: 'https://images.pexels.com/photos/7991186/pexels-photo-7991186.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'children'
    },
    {
      id: 7,
      name: 'ملابس منزلية راقية',
      price: 179,
      image: 'https://images.pexels.com/photos/7679663/pexels-photo-7679663.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'women'
    },
    {
      id: 8,
      name: 'ملابس أطفال رياضية',
      price: 139,
      image: 'https://images.pexels.com/photos/8844886/pexels-photo-8844886.jpeg?auto=compress&cs=tinysrgb&w=800',
      category: 'children'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
      <div className="relative overflow-hidden h-[600px] md:h-[750px] lg:h-[850px]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-rose-100 via-purple-50 to-indigo-100"
          style={{ transform: `translateY(${scrollY * 0.5}px)` }}
        >
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1600')] bg-cover bg-center opacity-20 blur-sm"></div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/70 via-purple-900/60 to-rose-900/70"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-6 z-10 animate-fade-in">
            <div className="mb-6 inline-block">
              <Sparkles className="w-16 h-16 md:w-20 md:h-20 text-rose-300 animate-pulse" />
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold mb-6 tracking-tight" style={{ fontFamily: 'serif', textShadow: '4px 4px 12px rgba(0,0,0,0.4)' }}>
              الشال
            </h1>
            <p className="text-2xl md:text-4xl lg:text-5xl font-light tracking-wider mb-12" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.3)' }}>
              للملابس الراقية
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
              <button className="group relative bg-gradient-to-r from-rose-500 to-pink-600 text-white px-12 py-5 rounded-full text-lg font-semibold shadow-2xl hover:shadow-rose-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  <Heart className="w-6 h-6" />
                  قسم الحريمي
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
              <button className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-12 py-5 rounded-full text-lg font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 overflow-hidden">
                <span className="relative z-10 flex items-center gap-3">
                  <Sparkles className="w-6 h-6" />
                  قسم الأطفال
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent"></div>
      </div>

      <div className="container mx-auto px-6 py-20 md:py-28">
        <div
          className={`relative bg-gradient-to-br from-white via-rose-50 to-purple-50 rounded-3xl p-12 md:p-20 shadow-2xl border-2 border-rose-200/50 overflow-hidden transition-all duration-1000 ${
            isWelcomeVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-rose-200/30 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-200/30 to-transparent rounded-full blur-3xl"></div>

          <div className="relative text-center space-y-10">
            <div className="inline-block mb-6">
              <ShoppingBag className="w-16 h-16 text-rose-600 mx-auto" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
              مرحباً بكم في الشال للملابس الراقية
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-rose-500 to-purple-500 mx-auto rounded-full mb-8"></div>
            <p className="text-xl md:text-2xl text-gray-700 leading-loose text-right max-w-6xl mx-auto font-light">
              في الشال للملابس الراقية، نقدم لكِ تشكيلة مميزة تجمع بين الأناقة والراحة لكِ ولأطفالك. من الملابس النسائية الفاخرة إلى الملابس المنزلية المريحة، والتصاميم الكاجوال العصرية والكلاسيكية الراقية.
            </p>
            <p className="text-xl md:text-2xl text-gray-700 leading-loose text-right max-w-6xl mx-auto font-light">
              كما نقدم ملابس الأطفال المميزة للمنزل والخروج، لضمان إطلالة أنيقة وراحة لا مثيل لها.
            </p>
            <p className="text-xl md:text-2xl text-gray-700 leading-loose text-right max-w-6xl mx-auto font-light">
              مع الشال، كل قطعة مصممة بعناية فائقة وخامات عالية الجودة لتضفي لمسة مميزة على إطلالتكِ وإطلالة صغاركِ كل يوم.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 md:py-28">
        <div
          className={`bg-white rounded-3xl p-12 md:p-20 shadow-2xl border border-gray-100 transition-all duration-1000 ${
            isWhyChooseUsVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-center text-gray-900 mb-16 tracking-tight">
            لماذا تختارين الشال؟
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
            <div className="group text-center transform transition-all duration-500 hover:scale-105">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-rose-100 to-pink-100 rounded-3xl p-6 w-24 h-24 mx-auto flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <Shield className="w-12 h-12 text-rose-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">جودة عالية</h3>
              <p className="text-lg text-gray-600 leading-relaxed">نستخدم أفضل الخامات لضمان الراحة والمتانة في كل قطعة نقدمها.</p>
            </div>

            <div className="group text-center transform transition-all duration-500 hover:scale-105">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl p-6 w-24 h-24 mx-auto flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <Sparkles className="w-12 h-12 text-purple-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">تصاميم عصرية</h3>
              <p className="text-lg text-gray-600 leading-relaxed">تشكيلة متنوعة تناسب جميع الأذواق والمناسبات بلمسات راقية.</p>
            </div>

            <div className="group text-center transform transition-all duration-500 hover:scale-105">
              <div className="relative mb-6 inline-block">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-orange-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-rose-100 to-orange-100 rounded-3xl p-6 w-24 h-24 mx-auto flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
                  <Heart className="w-12 h-12 text-rose-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">راحة الأطفال</h3>
              <p className="text-lg text-gray-600 leading-relaxed">ملابس مريحة وأنيقة لصغارك في كل الأوقات والمناسبات.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-20 md:pb-28">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            منتجاتنا المميزة
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-rose-500 to-purple-500 mx-auto rounded-full"></div>
        </div>

        <div className="text-center mt-16 flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="group relative bg-gradient-to-r from-rose-500 to-pink-600 text-white px-14 py-5 rounded-full text-lg font-semibold shadow-2xl hover:shadow-rose-500/50 transition-all duration-500 transform hover:scale-105 overflow-hidden">
            <span className="relative z-10">تصفح قسم الحريمي</span>
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-rose-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
          <button className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-14 py-5 rounded-full text-lg font-semibold shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-105 overflow-hidden">
            <span className="relative z-10">تصفح قسم الأطفال</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20 md:py-28">
        <div
          className={`relative bg-gradient-to-br from-slate-900 via-purple-900 to-rose-900 rounded-3xl p-12 md:p-20 shadow-2xl overflow-hidden transition-all duration-1000 ${
            isTestimonialsVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-bold text-center text-white mb-16 tracking-tight">
              ماذا يقول عملاؤنا
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'سارة أحمد', text: 'الملابس من الشال رائعة! الجودة ممتازة والتصاميم تناسب ذوقي تماماً. أنصح الجميع بالتسوق من هنا.' },
                { name: 'ليلى محمد', text: 'أحب ملابس الأطفال من الشال، مريحة وأنيقة وتدوم طويلاً. أطفالي يحبون ارتداءها كل يوم.' },
                { name: 'نورا عبدالله', text: 'تجربة تسوق رائعة! المنتجات فاقت توقعاتي والخدمة ممتازة. سأكون عميلة دائمة بإذن الله.' }
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="group bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl hover:bg-white/20 transition-all duration-500 transform hover:scale-105 border border-white/20"
                >
                  <div className="mb-6">
                    <div className="flex gap-1 justify-center mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Sparkles key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-white text-lg text-right mb-6 leading-relaxed italic">"{testimonial.text}"</p>
                  <p className="text-rose-300 font-bold text-right text-xl">{testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div className="text-center">
              <Truck className="w-12 h-12 mx-auto mb-4 text-rose-400" />
              <h3 className="text-xl font-bold mb-2">توصيل سريع</h3>
              <p className="text-gray-300">نوصل لجميع أنحاء المملكة</p>
            </div>
            <div className="text-center">
              <Shield className="w-12 h-12 mx-auto mb-4 text-rose-400" />
              <h3 className="text-xl font-bold mb-2">دفع آمن</h3>
              <p className="text-gray-300">معاملات آمنة ومضمونة</p>
            </div>
            <div className="text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-rose-400" />
              <h3 className="text-xl font-bold mb-2">ضمان الجودة</h3>
              <p className="text-gray-300">منتجات عالية الجودة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
