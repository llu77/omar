import React, { createContext, useContext, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from '../hooks/useAuth';
import { UserData, UserRole, AuthResponse } from '../services/authService';

interface AuthContextType {
  // State
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isTherapist: boolean;
  isAdmin: boolean;
  isPatient: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRole,
    additionalData?: Partial<UserData>
  ) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResponse>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<AuthResponse>;
  updateProfile: (updates: Partial<UserData>) => Promise<AuthResponse>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

// Higher-order component for authentication
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuthContext();
    
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      if (options?.fallback) {
        return <>{options.fallback}</>;
      }
      
      if (options?.redirectTo) {
        window.location.href = options.redirectTo;
        return null;
      }
      
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
            <p className="text-gray-600">يجب عليك تسجيل الدخول للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// Higher-order component for role-based access
export const withRole = <P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  options?: {
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) => {
  return (props: P) => {
    const { isAuthenticated, userData, loading } = useAuthContext();
    
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!isAuthenticated || !userData) {
      if (options?.redirectTo) {
        window.location.href = options.redirectTo;
        return null;
      }
      
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
            <p className="text-gray-600">يجب عليك تسجيل الدخول للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      );
    }
    
    if (!allowedRoles.includes(userData.role)) {
      if (options?.fallback) {
        return <>{options.fallback}</>;
      }
      
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">غير مصرح</h2>
            <p className="text-gray-600">ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};