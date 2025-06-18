'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname(); // Получаем текущий URL
  const [isAuth, setIsAuth] = useState(false); // Состояние, чтобы знать, авторизован ли пользователь
  const [loading, setLoading] = useState(true); // Состояние загрузки, пока мы проверяем токен

  // Добавляем функцию выхода
  const logout = () => {
    localStorage.removeItem('solo-mind-token');
    router.push('/');
  };

  useEffect(() => {
    const token = localStorage.getItem('solo-mind-token');

    if (token) {
      // Если токен есть, считаем пользователя авторизованным
      setIsAuth(true);
      // Если он на странице входа или регистрации, перенаправляем на дэшборд
      if (pathname === '/' || pathname === '/signup') {
        router.replace('/dashboard');
      }
    } else {
      // Если токена нет, пользователь не авторизован
      setIsAuth(false);
      // Если он пытается зайти на защищенную страницу (дэшборд), перенаправляем на страницу входа
      if (pathname === '/dashboard') {
        router.replace('/');
      }
    }
    // В любом случае, проверка завершена
    setLoading(false);
  }, [pathname, router]);

  return { isAuth, loading, logout };
}