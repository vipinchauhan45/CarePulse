import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, LoginRequest, RegisterRequest, UserRole } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const saveAuthData = (token: string, user: User) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_role', user.role);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_role');
    localStorage.removeItem('last_patient_id');
    localStorage.removeItem('last_machine_key');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (!token) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const response = await authApi.getProfile();
      saveAuthData(token, response.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      // If stored user exists, use it as fallback (token might still be valid)
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          clearAuthData();
        }
      } else {
        clearAuthData();
      }
    }
  }, [clearAuthData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    if (response.token && response.userData) {
      saveAuthData(response.token, response.userData);
    } else {
      throw new Error('Invalid login response');
    }
  };

  const register = async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    if (response.token) {
      // After register, fetch profile to get user data
      try {
        localStorage.setItem('auth_token', response.token);
        const profileResponse = await authApi.getProfile();
        saveAuthData(response.token, profileResponse.user);
      } catch {
        // Create minimal user from registration data
        const user: User = {
          _id: '',
          name: data.name,
          email: data.email,
          role: data.role,
        };
        saveAuthData(response.token, user);
      }
    } else {
      throw new Error('Invalid registration response');
    }
  };

  const logout = () => {
    clearAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to get role from localStorage (for route guards)
export const getStoredRole = (): UserRole | null => {
  const role = localStorage.getItem('auth_role');
  if (role === 'admin' || role === 'doctor' || role === 'nurse') {
    return role;
  }
  return null;
};

// Helper to check if user has specific role
export const hasRole = (allowedRoles: UserRole[]): boolean => {
  const role = getStoredRole();
  return role !== null && allowedRoles.includes(role);
};
