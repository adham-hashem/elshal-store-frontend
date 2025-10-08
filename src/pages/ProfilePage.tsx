import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';

const ProfilePage = () => {
  const { user, isAuthenticated } = useAuth();
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
        const response = await fetch(`${apiUrl}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to fetch profile');
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
        console.error('Profile fetch error:', err);
        setError('حدث خطأ أثناء جلب بيانات الملف الشخصي. حاول مرة أخرى لاحقاً.');
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
        alert('يرجى تسجيل الدخول أولاً');
        navigate('/login');
        return;
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
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setSuccess(data.message || 'تم تحديث الملف الشخصي بنجاح');
      
      setProfile(prev => ({
        ...prev,
        IsProfileComplete: true
      }));
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err.message || 'حدث خطأ أثناء تحديث الملف الشخصي. حاول مرة أخرى لاحقاً.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuantityDecrease = () => {
    // Not needed for profile page, but keeping pattern consistent
  };

  const handleQuantityIncrease = () => {
    // Not needed for profile page, but keeping pattern consistent
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center" dir="rtl">
        <div className="flex items-center gap-3">
          <Loader className="animate-spin text-pink-600" size={40} />
          <span className="text-gray-600 text-lg">جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16" dir="rtl">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-12 tracking-tight">
          الملف الشخصي
        </h1>

        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-pink-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
              <p className="text-red-600 text-center font-medium">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-green-600 text-center font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 mb-8">
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
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
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
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
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
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
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
                  className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
                  placeholder="أدخل رقم الهاتف"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2">
                  حالة التحقق من البريد
                </label>
                <p className="text-right text-gray-600">
                  {profile.IsEmailVerified ? '✓ تم التحقق' : '✗ لم يتم التحقق'}
                </p>
              </div>
              <div>
                <label className="block text-right text-gray-700 font-semibold mb-2">
                  حالة الملف الشخصي
                </label>
                <p className="text-right text-gray-600">
                  {profile.IsProfileComplete ? '✓ مكتمل' : '✗ غير مكتمل'}
                </p>
              </div>
              {profile.Roles.length > 0 && (
                <div>
                  <label className="block text-right text-gray-700 font-semibold mb-2">
                    الأدوار
                  </label>
                  <p className="text-right text-gray-600">{profile.Roles.join(' • ')}</p>
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                type="submit"
                className="bg-pink-600 text-white px-8 py-3 rounded-full hover:bg-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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