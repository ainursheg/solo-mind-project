'use client'; // Эта директива ОБЯЗАТЕЛЬНА для компонентов с интерактивом (кнопки, поля ввода)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link'

export default function LoginForm() {
  // Создаем "состояния" для хранения того, что вводит пользователь
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Для хранения текста ошибки
  const [loading, setLoading] = useState(false); // Для отслеживания состояния загрузки

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Сбрасываем старые ошибки
    setLoading(true); // Включаем состояние загрузки
  
    try {
      // Отправляем POST-запрос на наш бэкенд
      const response = await axios.post('http://localhost:3001/auth/login', {
        email: email,
        password: password,
      });
  
      // Если запрос успешен, бэкенд вернет токен
      console.log('Успешный вход!', response.data);
      const { token } = response.data;
  
      // Сохраняем токен в localStorage браузера.
      // Это позволит нам "помнить" пользователя между перезагрузками страницы.
      localStorage.setItem('solo-mind-token', token);
  
      router.push('/dashboard'); // <--- ДОБАВЛЯЕМ РЕДИРЕКТ НА ДЭШБОРД
  
    } catch (err) {
      // Если бэкенд вернул ошибку (401, 500 и т.д.)
      console.error('Ошибка входа:', err.response?.data?.message || 'Что-то пошло не так');
      setError(err.response?.data?.message || 'Не удалось подключиться к серверу');
    } finally {
      // Этот блок выполнится в любом случае (успех или ошибка)
      setLoading(false); // Выключаем состояние загрузки
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-sm mx-auto mt-20 p-8 bg-gray-900 rounded-lg shadow-lg">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      <div>

{/* Блок для отображения ошибки */}
{error && (
  <div>
    <p className="text-sm text-red-500 text-center">{error}</p>
  </div>
)}

<div>
  <button
    type="submit"
    disabled={loading} // Блокируем кнопку во время загрузки
    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400 disabled:cursor-not-allowed"
  >
    {loading ? 'Вход...' : 'Войти'} {/* Меняем текст кнопки во время загрузки */}
  </button>
</div>

<div className="text-center mt-4">
  <p className="text-sm text-gray-400">
    Еще не пробудился?{' '}
    <Link href="/signup" className="font-medium text-purple-400 hover:text-purple-300">
      Создать героя
    </Link>
  </p>
</div>
      </div>
    </form>
  );
}