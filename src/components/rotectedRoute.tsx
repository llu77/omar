import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { UserRole } from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
  requireEmailVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  redirectTo = '/login',
  requireEmailVerification = false
}) => {
  const { isAuthenticated, userData, loading, user } = useAuthContext();
  const location = useLocation();

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Email verification required
  if (requireEmailVerification && !user.emailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // User data not loaded yet
  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات المستخدم...</p>
        </div>
      </div>
    );
  }

  // Check if user account is active
  if (!userData.isActive) {
    return <Navigate to="/account-disabled" replace />;
  }

  // Role-based access control
  if (allowedRoles.length > 0 && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Public route - redirects to dashboard if already authenticated
export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userData, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && userData) {
    // Redirect based on user role
    switch (userData.role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'therapist':
        return <Navigate to="/therapist/dashboard" replace />;
      case 'patient':
        return <Navigate to="/patient/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Role-specific route components
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']} redirectTo="/unauthorized">
    {children}
  </ProtectedRoute>
);

export const TherapistRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['therapist']} redirectTo="/unauthorized">
    {children}
  </ProtectedRoute>
);

export const PatientRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['patient']} redirectTo="/unauthorized">
    {children}
  </ProtectedRoute>
);

export const TherapistOrAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['therapist', 'admin']} redirectTo="/unauthorized">
    {children}
  </ProtectedRoute>
);

// Unauthorized page component
export const UnauthorizedPage: React.FC = () => {
  const { userData } = useAuthContext();
  
  const getDashboardLink = () => {
    if (!userData) return '/';
    
    switch (userData.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'therapist':
        return '/therapist/dashboard';
      case 'patient':
        return '/patient/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="mb-6">
          <svg className="mx-auto h-24 w-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح</h2>
        <p className="text-gray-600 mb-8">
          عذراً، ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة.
        </p>
        <div className="space-y-3">
          <a 
            href={getDashboardLink()} 
            className="block w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition"
          >
            العودة إلى لوحة التحكم
          </a>
          <a 
            href="/" 
            className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
          >
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
};

// Account disabled page component
export const AccountDisabledPage: React.FC = () => {
  const { logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="mb-6">
          <svg className="mx-auto h-24 w-24 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">الحساب معطل</h2>
        <p className="text-gray-600 mb-8">
          تم تعطيل حسابك. يرجى التواصل مع الإدارة للحصول على مزيد من المعلومات.
        </p>
        <div className="space-y-3">
          <button 
            onClick={handleLogout}
            className="block w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition"
          >
            تسجيل الخروج
          </button>
          <a 
            href="mailto:support@wassel-telerehab.com" 
            className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
          >
            التواصل مع الدعم
          </a>
        </div>
      </div>
    </div>
  );
};

// Email verification page component
export const EmailVerificationPage: React.FC = () => {
  const { user, logout } = useAuthContext();
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  const handleResendEmail = async () => {
    if (!user) return;
    
    setSending(true);
    try {
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(user);
      setSent(true);
    } catch (error) {
      console.error('Error sending verification email:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="mb-6">
          <svg className="mx-auto h-24 w-24 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">تأكيد البريد الإلكتروني</h2>
        <p className="text-gray-600 mb-2">
          يرجى تأكيد بريدك الإلكتروني للمتابعة.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          {user?.email}
        </p>
        
        {sent && (
          <div className="mb-6 p-3 bg-green-100 text-green-700 rounded-md">
            تم إرسال رسالة التأكيد بنجاح
          </div>
        )}
        
        <div className="space-y-3">
          <button 
            onClick={handleResendEmail}
            disabled={sending || sent}
            className="block w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'جاري الإرسال...' : 'إعادة إرسال رسالة التأكيد'}
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
          >
            تحديث الصفحة
          </button>
          <button 
            onClick={logout}
            className="block w-full text-red-600 py-2 px-4 hover:text-red-700 transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};