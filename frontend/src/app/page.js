// frontend/src/app/page.js
'use client';

import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import Link from 'next/link'; // 1. Импортируем Link

export default function LoginPage() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Загрузка...</p></div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        {/* Используем цвета и шрифты из нашей темы */}
        <h1 className="text-4xl font-display font-bold text-text-primary">Solo Mind</h1>
        <p className="text-lg text-text-secondary mt-2">Войди, чтобы начать прокачку</p>
      </div>
      <LoginForm />
      
      {/* 2. ДОБАВЛЯЕМ ССЫЛКУ НА РЕГИСТРАЦИЮ */}
      <div className="mt-4">
        <p className="text-sm text-text-secondary">
          Еще нет аккаунта?{' '}
          <Link href="/signup" className="font-medium text-accent-primary hover:text-accent-primary/80 transition-colors">
            Создать
          </Link>
        </p>
      </div>
    </main>
  );
}