// frontend/src/app/signup/page.js
'use client';

import SignupForm from "@/components/SignupForm";
import { useAuth } from "@/hooks/useAuth";
import Link from 'next/link'; // 1. Импортируем Link

export default function SignupPage() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Загрузка...</p></div>;
  }
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        {/* Используем цвета и шрифты из нашей темы */}
        <h1 className="text-4xl font-display font-bold text-text-primary">Создать Героя</h1>
        <p className="text-lg text-text-secondary mt-2">Пройди регистрацию и начни свой путь</p>
      </div>
      <SignupForm />
      
      {/* 2. ДОБАВЛЯЕМ ССЫЛКУ НА СТРАНИЦУ ВХОДА */}
      <div className="mt-4">
        <p className="text-sm text-text-secondary">
          Уже есть аккаунт?{' '}
          <Link href="/" className="font-medium text-accent-secondary hover:text-accent-secondary/80 transition-colors">
            Войти
          </Link>
        </p>
      </div>
    </main>
  );
}