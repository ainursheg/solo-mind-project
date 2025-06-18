'use client'; // <--- ДОБАВИТЬ ЭТУ СТРОКУ

import LoginForm from "@/components/LoginForm"; // '@/' - это удобный псевдоним для папки 'src'
import { useAuth } from "@/hooks/useAuth"; // Импортируем наш хук

export default function LoginPage() {
  const { loading } = useAuth();

  // Пока идет проверка токена, показываем заглушку
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Загрузка...</p></div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">Solo Mind</h1>
        <p className="text-lg text-gray-400 mt-2">Войди, чтобы начать прокачку</p>
      </div>
      <LoginForm />
    </main>
  );
}