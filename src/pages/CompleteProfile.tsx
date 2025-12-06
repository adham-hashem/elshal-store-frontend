import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader } from 'lucide-react';

const CompleteProfile = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    governorate: '',
    phoneNumber: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkProfileStatus = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';
        const response = await fetch(`${apiUrl}/api/users/profile-status`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!response.ok) {
          throw new Error('فشل في التحقق من حالة الملف الشخصي');
        }
        const data = await response.json();
        if (data.isProfileComplete) {
          navigate('/');
        }
      } catch (err) {
        // console.error('Error checking profile status:', err);
        setError('حدث خطأ أثناء التحقق من حالة الملف الشخصي');
      }
    };
    checkProfileStatus();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.governorate === "0") {
      setError('يرجى اختيار محافظة صالحة');
      setLoading(false);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://elshal.runasp.net';
      const response = await fetch(`${apiUrl}/api/users/complete-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل في إكمال الملف الشخصي');
      }

      updateUserProfile({
        name: formData.fullName,
        address: formData.address,
        governorate: formData.governorate,
        phoneNumber: formData.phoneNumber,
      });

      setSuccess('تم إكمال الملف الشخصي بنجاح');
      setTimeout(() => navigate('/'), 2000); // Redirect after showing success message
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إكمال الملف الشخصي. حاول مرة أخرى لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16" dir="rtl">
      <div className="container mx-auto px-6">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-12 tracking-tight">
          إكمال الملف الشخصي
        </h1>

        <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-right text-gray-700 font-semibold mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
                placeholder="أدخل الاسم الكامل"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="address" className="block text-right text-gray-700 font-semibold mb-2">
                العنوان
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
                placeholder="أدخل العنوان"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="governorate" className="block text-right text-gray-700 font-semibold mb-2">
                المحافظة
              </label>
              <select
                id="governorate"
                name="governorate"
                value={formData.governorate}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
                disabled={loading}
              >
                <option value="0">اختر...</option>
                <option value="7">الدقهلية</option>
                <option value="1">القاهرة</option>
                <option value="2">الأسكندرية</option>
                <option value="3">بورسعيد</option>
                <option value="4">السويس</option>
                <option value="5">الإسماعيلية</option>
                <option value="6">دمياط</option>
                <option value="8">الشرقية</option>
                <option value="9">القليوبية</option>
                <option value="10">كفر الشيخ</option>
                <option value="11">الغربية</option>
                <option value="12">المنوفية</option>
                <option value="13">البحيرة</option>
                <option value="14">الجيزة</option>
                <option value="15">بنى سويف</option>
                <option value="16">الفيوم</option>
                <option value="17">المنيا</option>
                <option value="18">أسيوط</option>
                <option value="19">سوهاج</option>
                <option value="20">قنا</option>
                <option value="21">أسوان</option>
                <option value="22">مطروح</option>
                <option value="23">الوادى الجديد</option>
                <option value="24">البحر الاحمر</option>
                <option value="25">شمال سيناء</option>
                <option value="26">جنوب سيناء</option>
                <option value="27">الأقصر</option>
              </select>
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-right text-gray-700 font-semibold mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-full bg-gray-100 text-right border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all duration-300"
                placeholder="أدخل رقم الهاتف"
                disabled={loading}
              />
            </div>
            <div className="text-center">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-pink-600 text-white py-3 px-8 rounded-full hover:bg-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader className="animate-spin mr-2" size={20} />
                    جارٍ الإرسال...
                  </span>
                ) : (
                  'إكمال الملف الشخصي'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;