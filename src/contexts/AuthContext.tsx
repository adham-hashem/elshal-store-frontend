import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
  governorate?: string;
  password?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ redirectTo: string }>;
  googleLogin: (idToken: string) => Promise<{ redirectTo: string }>;
  register: (fullName: string, email: string, phoneNumber: string, address: string, governorate: string, password: string) => Promise<void>;
  logout: () => void;
  updateUserProfile: (data: Partial<User>) => void;
  isAuthenticated: boolean;
  userRole: 'user' | 'admin' | null;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const decodeToken = (token: string | undefined | null) => {
    if (!token || typeof token !== 'string') {
      console.error('Invalid token: token is undefined, null, or not a string');
      return null;
    }
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Token decode error:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const decoded = decodeToken(token);
          if (decoded && decoded.exp * 1000 > Date.now()) {
            const roles = Array.isArray(decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
              ? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
              : [decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'Customer'];
            const isAdmin = roles.some((role: string) => role.toLowerCase() === 'admin');

            const userData: User = {
              id: decoded.sub || '',
              name: decoded.email?.split('@')[0] || 'المستخدم',
              email: decoded.email || '',
              role: isAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
            };
            setUser(userData);
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<{ redirectTo: string }> => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Password: password }),
      });

      if (!response.ok) {
        let errorMessage = 'فشل تسجيل الدخول';
        try {
          const errorData = await response.json();
          errorMessage = errorData.Message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Login response:', data);
      const { accessToken, refreshToken, roles } = data;

      if (!accessToken) {
        throw new Error('accessToken is missing in the response');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');

      const decoded = decodeToken(accessToken);
      if (!decoded) {
        throw new Error('فشل فك تشفير الرمز');
      }

      const isAdmin = Array.isArray(roles) && roles.some((r: string) => r.toLowerCase() === 'admin');
      const userData: User = {
        id: decoded.sub || '',
        name: decoded.email?.split('@')[0] || email.split('@')[0],
        email: decoded.email || email,
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      const redirectTo = isAdmin ? '/admin/dashboard' : '/';
      return { redirectTo };
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken: string): Promise<{ redirectTo: string }> => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      });

      if (!response.ok) {
        let errorMessage = 'فشل تسجيل الدخول باستخدام جوجل';
        try {
          const errorData = await response.json();
          console.log('Backend error response:', errorData);
          errorMessage = errorData.errorMessage || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Google login response:', data);
      const { accessToken, refreshToken, roles } = data;

      if (!accessToken) {
        throw new Error('accessToken is missing in the response');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');

      const decoded = decodeToken(accessToken);
      if (!decoded) {
        throw new Error('فشل فك تشفير الرمز');
      }

      const isAdmin = Array.isArray(roles) && roles.some((r: string) => r.toLowerCase() === 'admin');
      const userData: User = {
        id: decoded.sub || '',
        name: decoded.email?.split('@')[0] || 'المستخدم',
        email: decoded.email || '',
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };

      setUser(userData);
      const redirectTo = isAdmin ? '/admin/dashboard' : '/';
      return { redirectTo };
    } catch (error: any) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (fullName: string, email: string, phoneNumber: string, address: string, governorate: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ FullName: fullName, Email: email, PhoneNumber: phoneNumber, Address: address, Governorate: governorate, Password: password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.Message || 'فشل إنشاء الحساب');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateUserProfile = (data: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.Message || 'فشل إرسال رابط إعادة تعيين كلمة المرور');
      }
    } catch (error: any) {
      console.error('Forgot password failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, token: string, newPassword: string): Promise<void> => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email, Token: token, NewPassword: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.Message || 'فشل إعادة تعيين كلمة المرور');
      }
    } catch (error: any) {
      console.error('Reset password failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerification = async (email: string): Promise<void> => {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiUrl}/api/auth/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Email: email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.Message || 'فشل إرسال رابط التحقق من البريد الإلكتروني');
      }
    } catch (error: any) {
      console.error('Send email verification failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!localStorage.getItem('accessToken');
  const userRole = user?.role === 'admin' ? 'admin' : user ? 'user' : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        googleLogin,
        register,
        logout,
        updateUserProfile,
        isAuthenticated,
        userRole,
        forgotPassword,
        resetPassword,
        sendEmailVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};