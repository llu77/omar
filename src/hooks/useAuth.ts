import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import authService, { UserData, UserRole, AuthResponse } from '../services/authService';

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isTherapist: boolean;
  isAdmin: boolean;
  isPatient: boolean;
}

interface AuthActions {
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

export const useAuth = (): AuthState & AuthActions => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userData: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isTherapist: false,
    isAdmin: false,
    isPatient: false
  });

  // تحديث حالة المصادقة
  const updateAuthState = useCallback((
    user: User | null, 
    userData: UserData | null, 
    error: string | null = null
  ) => {
    setAuthState({
      user,
      userData,
      loading: false,
      error,
      isAuthenticated: !!user,
      isTherapist: userData?.role === 'therapist',
      isAdmin: userData?.role === 'admin',
      isPatient: userData?.role === 'patient'
    });
  }, []);

  // تحديث بيانات المستخدم
  const refreshUserData = useCallback(async () => {
    if (authState.user) {
      try {
        const userData = await authService.getCurrentUserData();
        updateAuthState(authState.user, userData);
      } catch (error) {
        console.error('Error refreshing user data:', error);
      }
    }
  }, [authState.user, updateAuthState]);

  // مراقبة حالة المصادقة
  useEffect(() => {
    let mounted = true;

    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (!mounted) return;

      if (user) {
        try {
          const userData = await authService.getCurrentUserData();
          if (mounted) {
            updateAuthState(user, userData);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          if (mounted) {
            updateAuthState(user, null, 'فشل في تحميل بيانات المستخدم');
          }
        }
      } else {
        if (mounted) {
          updateAuthState(null, null);
        }
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [updateAuthState]);

  // تسجيل الدخول
  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const response = await authService.loginUser(email, password);
    
    if (response.success && response.user && response.userData) {
      updateAuthState(response.user, response.userData);
    } else {
      setAuthState(prev => ({ ...prev, loading: false, error: response.error }));
    }
    
    return response;
  }, [updateAuthState]);

  // تسجيل مستخدم جديد
  const register = useCallback(async (
    email: string, 
    password: string, 
    displayName: string, 
    role: UserRole,
    additionalData?: Partial<UserData>
  ): Promise<AuthResponse> => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const response = await authService.registerUser(email, password, displayName, role, additionalData);
    
    if (response.success && response.user && response.userData) {
      updateAuthState(response.user, response.userData);
    } else {
      setAuthState(prev => ({ ...prev, loading: false, error: response.error }));
    }
    
    return response;
  }, [updateAuthState]);

  // تسجيل الخروج
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      await authService.logout();
      updateAuthState(null, null);
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: 'فشل تسجيل الخروج' }));
    }
  }, [updateAuthState]);

  // إعادة تعيين كلمة المرور
  const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
    return await authService.resetPassword(email);
  }, []);

  // تحديث كلمة المرور
  const updatePassword = useCallback(async (
    currentPassword: string, 
    newPassword: string
  ): Promise<AuthResponse> => {
    return await authService.updateUserPassword(currentPassword, newPassword);
  }, []);

  // تحديث الملف الشخصي
  const updateProfile = useCallback(async (updates: Partial<UserData>): Promise<AuthResponse> => {
    const response = await authService.updateUserProfile(updates);
    
    if (response.success && response.userData) {
      updateAuthState(authState.user, response.userData);
    }
    
    return response;
  }, [authState.user, updateAuthState]);

  return {
    ...authState,
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshUserData
  };
};

// Custom hook for role-based access
export const useRole = () => {
  const { userData, isAuthenticated } = useAuth();
  
  return {
    role: userData?.role || null,
    isAuthenticated,
    hasRole: (role: UserRole) => userData?.role === role,
    hasAnyRole: (roles: UserRole[]) => roles.includes(userData?.role as UserRole),
    canAccess: (allowedRoles: UserRole[]) => {
      if (!isAuthenticated || !userData) return false;
      return allowedRoles.includes(userData.role);
    }
  };
};

// Custom hook for checking permissions
export const usePermissions = () => {
  const { userData } = useAuth();
  
  const permissions = {
    // User management
    canManageUsers: userData?.role === 'admin',
    canViewAllUsers: userData?.role === 'admin' || userData?.role === 'therapist',
    
    // Patient management
    canCreatePatient: userData?.role === 'therapist' || userData?.role === 'admin',
    canEditPatient: userData?.role === 'therapist' || userData?.role === 'admin',
    canDeletePatient: userData?.role === 'admin',
    canViewAllPatients: userData?.role === 'therapist' || userData?.role === 'admin',
    
    // Assessment management
    canCreateAssessment: userData?.role === 'therapist' || userData?.role === 'admin',
    canEditAssessment: userData?.role === 'therapist' || userData?.role === 'admin',
    canDeleteAssessment: userData?.role === 'admin',
    
    // Session management
    canCreateSession: userData?.role === 'therapist' || userData?.role === 'admin',
    canEditSession: userData?.role === 'therapist' || userData?.role === 'admin',
    canDeleteSession: userData?.role === 'admin',
    
    // Exercise management
    canManageExercises: userData?.role === 'therapist' || userData?.role === 'admin',
    
    // Report management
    canGenerateReports: userData?.role === 'therapist' || userData?.role === 'admin',
    canViewAllReports: userData?.role === 'admin',
    
    // System settings
    canManageSettings: userData?.role === 'admin'
  };
  
  return permissions;
};