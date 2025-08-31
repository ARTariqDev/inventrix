"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth(redirectTo = '/stats') {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/verify');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(data.user));
            return true;
          }
        }
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user');
        return false;
      } catch (error) {
        console.log('Authentication check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('user');
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    router.push(redirectTo);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.log('Logout API call failed:', error);
    }
    
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    router.push('/');
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
