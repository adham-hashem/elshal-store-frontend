import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll to top and initialize Google Sign-In
  useEffect(() => {
    window.scrollTo(0, 0);

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
            callback: handleGoogleSignIn,
            context: 'signin',
            ux_mode: 'popup',
            prompt: 'select_account', // Force account selection prompt
            locale: 'ar'
          });
          const buttonElement = document.getElementById('googleSignInButton');
          if (buttonElement) {
            window.google.accounts.id.renderButton(buttonElement, {
              theme: 'filled_blue',
              size: 'large',
              text: 'signin_with',
              width: '400',
              locale: 'ar'
            });
          } else {
            console.error('Google Sign-In button element not found');
          }
        } catch (error) {
          console.error('Google Sign-In initialization failed:', error);
        }
      } else {
        console.error('Google Sign-In SDK not available');
      }
    };
    script.onerror = () => {
      console.error('Failed to load Google Sign-In script');
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleGoogleSignIn = async (response) => {
    try {
      console.log('Google ID Token:', response.credential);
      const idToken = response.credential;
      if (!idToken) {
        throw new Error('لم يتم استلام رمز جوجل');
      }
      const { redirectTo } = await googleLogin(idToken);
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Google Sign-In error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-lg">
        <Link
          to="/"
          className="flex items-center space-x-reverse space-x-2 text-gray-600 hover:text-pink-600 mb-8 transition-colors"
        >
          <ArrowRight size={24} />
          <span className="text-lg">العودة للرئيسية</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Logo */}
          <div className="bg-gradient-to-l from-pink-600 to-purple-600 p-8 text-center">
            <img 
              src="/اللجو.jpg" 
              alt="الشال" 
              className="h-20 w-20 mx-auto mb-4 object-contain"
            />
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'serif' }}>
              الشال
            </h1>
            <p className="text-pink-100 text-lg">تسجيل الدخول</p>
          </div>

          <div className="p-8">
            <div className="text-center">
              <div 
                id="googleSignInButton" 
                className="flex justify-center"
                style={{ transform: 'scale(1.2)', margin: '2rem 0' }}
              ></div>
            </div>

            {/* <div className="mt-8 text-center">
              <p className="text-gray-600 text-lg">
                ليس لديك حساب؟{' '}
                <Link to="/register" className="text-pink-600 hover:text-pink-700 font-semibold">
                  إنشاء حساب جديد
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;