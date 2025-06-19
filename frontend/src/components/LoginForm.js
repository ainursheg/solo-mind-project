// components/LoginForm.js
"use client";

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation'; // Используем новый роутер из Next.js 13+

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // v7.0 ИСПРАВЛЕНИЕ: Делегируем всю логику входа нашему хуку
      await auth.login(email, password);
      
      // Если логин прошел успешно (ошибки не было), перенаправляем на дашборд
      router.push('/dashboard');

    } catch (err) {
      // Если хук auth.login выбросил ошибку, мы ее здесь ловим
      setError(err.response?.data?.message || 'Произошла ошибка при входе');
      console.error(err); // Логируем ошибку для отладки
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-white">Вход в Solo Mind</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label /* ... */ >Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="..."
            required
          />
        </div>
        <div>
          <label /* ... */ >Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="..."
            required
          />
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div>
          <button type="submit" className="...">
            Войти
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;