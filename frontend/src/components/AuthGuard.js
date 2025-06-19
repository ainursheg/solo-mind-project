// components/AuthGuard.js
"use client";

import { useAuth } from '../hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const PROTECTED_ROUTES = ['/dashboard'];
const PUBLIC_ONLY_ROUTES = ['/login', '/signup', '/'];

const AuthGuard = ({ children }) => {
  const { token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ИСПРАВЛЕНИЕ: Объявляем переменные здесь, чтобы они были видны всему компоненту.
  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);
  const isPublicOnlyRoute = PUBLIC_ONLY_ROUTES.includes(pathname);

  useEffect(() => {
    if (loading) {
      return;
    }

    // Теперь просто используем переменные, которые уже объявлены выше.
    if (!token && isProtectedRoute) {
      router.push('/');
    }

    if (token && isPublicOnlyRoute) {
      router.push('/dashboard');
    }
    // Добавляем переменные в массив зависимостей для корректной работы
  }, [token, loading, pathname, router, isProtectedRoute, isPublicOnlyRoute]);

  // Теперь эта строка будет работать, так как она "видит" isProtectedRoute и isPublicOnlyRoute
  if (loading || (!token && isProtectedRoute) || (token && isPublicOnlyRoute)) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Проверка доступа...</div>;
  }

  return children;
};

export default AuthGuard;