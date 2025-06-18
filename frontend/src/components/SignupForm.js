'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function SignupForm() {
    const router = useRouter(); 
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // Для сообщения об успехе
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post('http://localhost:3001/auth/signup', {
        name,
        email,
        password,
      });
      
      alert('Регистрация прошла успешно! Перенаправляем на страницу входа...'); // Временно для наглядности
      router.push('/'); // <--- ДОБАВЛЯЕМ РЕДИРЕКТ НА ГЛАВНУЮ (СТРАНИЦУ ВХОДА)

    } catch (err) {
      console.error('Ошибка регистрации:', err.response?.data?.message || 'Что-то пошло не так');
      setError(err.response?.data?.message || 'Не удалось подключиться к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto p-8 bg-gray-900 rounded-lg shadow-lg">
      {/* Поле для Имени */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Имя Героя
        </label>
        <div className="mt-1">
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Поле для Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">
          Email
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Поле для Пароля */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">
          Пароль
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength="6" // Добавим минимальную длину для безопасности
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Блоки для сообщений */}
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      {success && <p className="text-sm text-green-500 text-center">{success}</p>}

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Создание...' : 'Создать'}
        </button>
      </div>
    </form>
  );
}