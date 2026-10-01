import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  fullName: string;
  studioName: string;
  phone?: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    studioName: string;
    phone?: string;
  }) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('frameflow_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('frameflow_token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Authenticated fetch helper
  const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, {
      ...init,
      headers
    });
  };

  // Verify stored session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem('frameflow_user', JSON.stringify(data.user));
        } else {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('frameflow_token');
          localStorage.removeItem('frameflow_user');
        }
      } catch (err) {
        console.error('Session verification failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to sign in. Please check your credentials.');
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('frameflow_token', data.token);
    localStorage.setItem('frameflow_user', JSON.stringify(data.user));
  };

  const register = async (formData: {
    email: string;
    password: string;
    fullName: string;
    studioName: string;
    phone?: string;
  }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to create studio account.');
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('frameflow_token', data.token);
    localStorage.setItem('frameflow_user', JSON.stringify(data.user));
  };

  const loginAsDemo = async () => {
    const res = await fetch('/api/auth/demo', {
      method: 'POST'
    });

    if (!res.ok) {
      throw new Error('Failed to sign in with demo studio.');
    }

    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('frameflow_token', data.token);
    localStorage.setItem('frameflow_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('frameflow_token');
    localStorage.removeItem('frameflow_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginAsDemo,
        logout,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
