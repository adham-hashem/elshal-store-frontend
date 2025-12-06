import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';

const ProfilePage = () => {
  const { user, isAuthenticated, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    FullName: '',
    Email: '',
    Address: '',
    Governorate: '',
    PhoneNumber: '',
    IsEmailVerified: false,
    IsProfileComplete: false,
    Roles: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('accessToken');
        if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
          throw new Error('يرجى تسجيل الدخول أولاً');
        }

        const response = await fetch(`${apiUrl}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'فشل في جلب بيانات الملف الشخصي');
        }

        const data = await response.json();
        setProfile({
          FullName: data.fullName || '',
          Email: data.email || '',
          Address: data.address || '',
          Governorate: data.governorate || '',
          PhoneNumber: data.phoneNumber || '',
          IsEmailVerified: data.isEmailVerified || false,
          IsProfileComplete: data.isProfileComplete || false,
          Roles: Array.isArray(data.roles) ? data.roles : [],
        });
      } catch (err) {
        // console.error('Profile fetch error:', err);
        setError(err.message || 'حدث خطأ أثناء جلب بيانات الملف الشخصي. حاول مرة أخرى لاحقاً.');
        if (err.message === 'يرجى تسجيل الدخول أولاً') {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (success) setSuccess(null);
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
        throw new Error('يرجى تسجيل الدخول أولاً');
      }

      const response = await fetch(`${apiUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          FullName: profile.FullName,
          Address: profile.Address,
          Governorate: profile.Governorate,
          PhoneNumber: profile.PhoneNumber,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشل في تحديث الملف الشخصي');
      }

      const data = await response.json();
      setSuccess(data.message || 'تم تحديث الملف الشخصي بنجاح');
      
      // Update local user profile in context
      updateUserProfile({
        name: profile.FullName,
        address: profile.Address,
        governorate: profile.Governorate,
        phoneNumber: profile.PhoneNumber,
      });

      setProfile((prev) => ({
        ...prev,
        IsProfileComplete: !!(profile.FullName && profile.Address && profile.Governorate && profile.PhoneNumber),
      }));
    } catch (err) {
      // console.error('Profile update error:', err);
      setError(err.message || 'حدث خطأ أثناء تحديث الملف الشخصي. حاول مرة أخرى لاحقاً.');
      if (err.message === 'يرجى تسجيل الدخول أولاً') {
        navigate('/login');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-4">
          <Loader className="animate-spin text-pink-600" size={40} />
          <span className="text-gray-600 text-lg font-medium">جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16" dir="rtl">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 text-center mb-12 tracking-tight drop-shadow-sm">
          الملف الشخصي
        </h1>

        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-pink-100 transform transition-all duration-300 hover:shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100 animate-fade-in">
              <p className="text-red-600 text-center font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100 animate-fade-in">
              <p className="text-green-600 text-center font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2" htmlFor="FullName">
                  الاسم الكامل
                </label>
                <input
                  id="FullName"
                  type="text"
                  name="FullName"
                  value={profile.FullName}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300 hover:shadow-sm"
                  placeholder="أدخل الاسم الكامل"
                  disabled={submitting}
                  required
                />
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2" htmlFor="Email">
                  البريد الإلكتروني
                </label>
                <input
                  id="Email"
                  type="email"
                  value={profile.Email}
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 text-gray-500 cursor-not-allowed"
                  disabled
                  readOnly
                />
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2" htmlFor="Address">
                  العنوان
                </label>
                <input
                  id="Address"
                  type="text"
                  name="Address"
                  value={profile.Address}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300 hover:shadow-sm"
                  placeholder="أدخل العنوان"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2" htmlFor="Governorate">
                  المحافظة
                </label>
                <input
                  id="Governorate"
                  type="text"
                  name="Governorate"
                  value={profile.Governorate}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300 hover:shadow-sm"
                  placeholder="أدخل المحافظة"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2" htmlFor="PhoneNumber">
                  رقم الهاتف
                </label>
                <input
                  id="PhoneNumber"
                  type="tel"
                  name="PhoneNumber"
                  value={profile.PhoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300 hover:shadow-sm"
                  placeholder="أدخل رقم الهاتف"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2">
                  حالة التحقق من البريد
                </label>
                <p className="text-right text-gray-600 font-medium">
                  {profile.IsEmailVerified ? (
                    <span className="flex items-center gap-2 text-green-600">
                      ✓ تم التحقق
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600">
                      ✗ لم يتم التحقق
                    </span>
                  )}
                </p>
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2">
                  حالة الملف الشخصي
                </label>
                <p className="text-right text-gray-600 font-medium">
                  {profile.IsProfileComplete ? (
                    <span className="flex items-center gap-2 text-green-600">
                      ✓ مكتمل
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600">
                      ✗ غير مكتمل
                    </span>
                  )}
                </p>
              </div>
              {profile.Roles.length > 0 && (
                <div>
                  <label className="block text-right text-gray-700 font-semibold mb-2">
                    الأدوار
                  </label>
                  <p className="text-right text-gray-600 font-medium">{profile.Roles.join(' • ')}</p>
                </div>
              )}
            </div>

            <div className="text-center mt-8">
              <button
                type="submit"
                className="bg-pink-600 text-white px-10 py-3 rounded-full hover:bg-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="animate-spin" size={20} />
                    جارٍ التحديث...
                  </span>
                ) : (
                  'تحديث الملف الشخصي'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;