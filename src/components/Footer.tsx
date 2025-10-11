import React from 'react';
import { MessageCircle, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  const openWhatsApp = (number: string, message: string = '') => {
    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Branches */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-pink-400">فروعنا</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-reverse space-x-3">
                <MapPin className="text-pink-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold">فرع 1</p>
                  <p className="text-gray-300">محافظة الدقهلية – مدينة ميت سلسيل الطريق العام كوبري الجوابر مقابل حلواني إسراء</p>
                </div>
              </div>
              <div className="flex items-start space-x-reverse space-x-3">
                <MapPin className="text-pink-400 mt-1 flex-shrink-0" size={20} />
                <div>
                  <p className="font-semibold">فرع 2</p>
                  <p className="text-gray-300">محافظة الدقهلية - مدينة الجمالية شارع البوسطه مقابل الداده دودي</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-pink-400">تواصل معنا</h3>
            <div className="space-y-3">
              <button
                onClick={() => openWhatsApp('201000070653', 'مرحباً، أريد الاستفسار عن منتجاتكم')}
                className="flex items-center space-x-reverse space-x-3 hover:text-pink-400 transition-colors"
              >
                <MessageCircle size={20} />
                <span>01000070653</span>
              </button>
              <p className="text-gray-300 text-sm">
                إدارة أستاذ محمد الشال – التوصيل لجميع محافظات الجمهورية
              </p>
              <p className="text-gray-300 text-sm">
                متاح الشحن لجميع المحافظات
              </p>
            </div>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-pink-400">فريق التطوير</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">م/  أدهم  البشبيشي</span>
                <button
                  onClick={() => openWhatsApp('201028110927', 'مرحباً، أريد الاستفسار عن الموقع')}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">م/  إسراء عديسة</span>
                <button
                  onClick={() => openWhatsApp('201027548602', 'مرحباً، أريد الاستفسار عن الموقع')}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 الشال للملابس الراقية. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;