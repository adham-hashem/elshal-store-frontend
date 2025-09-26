import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* 404 Illustration */}
            <div className="text-8xl mb-6">🔍</div>
            
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              الصفحة غير موجودة
            </h2>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى مكان آخر.
            </p>
            
            <div className="space-y-4">
              <Link
                to="/"
                className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg hover:bg-pink-700 transition-colors font-semibold flex items-center justify-center space-x-reverse space-x-2"
              >
                <Home size={20} />
                <span>العودة للرئيسية</span>
              </Link>
              
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center space-x-reverse space-x-2"
              >
                <ArrowRight size={20} />
                <span>العودة للخلف</span>
              </button>
            </div>
          </div>
          
          {/* Additional Help */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">هل تحتاج مساعدة؟</h3>
            <p className="text-blue-700 text-sm">
              يمكنك تصفح أقسام الموقع من القائمة الرئيسية أو التواصل معنا عبر واتساب
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;