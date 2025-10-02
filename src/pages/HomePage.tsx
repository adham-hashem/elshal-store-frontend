import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { theme: 'outline', size: 'large', text: 'signin_with', width: '400' }
      );
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const { redirectTo } = await login(formData.email, formData.password);
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrors({ login: error.message || 'بيانات تسجيل الدخول غير صحيحة' });
    }
  };

  const handleGoogleSignIn = async (response: any) => {
    try {
      const idToken = response.credential;
      const { redirectTo } = await googleLogin(idToken);
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    } catch (error: any) {
      setErrors({ login: error.message || 'فشل تسجيل الدخول باستخدام جوجل' });
    }
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

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Logo */}
            <div className="bg-gradient-to-l from-pink-600 to-purple-600 p-6 text-center">
              <img 
                src="/اللجو.jpg" 
                alt="الشال" 
                className="h-16 w-16 mx-auto mb-3 object-contain"
              />
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'serif' }}>
                الشال
              </h1>
              <p className="text-pink-100">تسجيل الدخول</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="example@alshal.com"
                      className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="rtl"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full pr-10 pl-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-right ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      dir="rtl"
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {errors.login && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm text-center">{errors.login}</p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition-colors font-semibold"
                >
                  تسجيل دخول
                </button>
              </form>

              <div className="mt-4 text-center">
                <div id="googleSignInButton" className="flex justify-center"></div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  ليس لديك حساب؟{' '}
                  <Link to="/register" className="text-pink-600 hover:text-pink-700 font-semibold">
                    إنشاء حساب جديد
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;