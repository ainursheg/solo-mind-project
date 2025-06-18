'use client';

import { useState } from 'react';
import axios from 'axios';

// Принимаем функцию для обновления профиля
export default function EnduranceGate({ onProfileUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCompleteExercise = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('solo-mind-token');
      // Отправляем запрос на уже готовый эндпоинт
      const response = await axios.post(
        'http://localhost:3001/activity/exercise',
        { exerciseName: 'Ежедневное задание' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // После успешного выполнения вызываем обновление профиля
      await onProfileUpdate(response.data.profile);
    } catch (err) {
      console.error('Ошибка выполнения упражнения:', err);
      setError('Не удалось записать активность.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl p-6 bg-gray-800 rounded-lg mt-8 text-center">
      <h2 className="text-xl font-semibold mb-4 text-yellow-400">Врата Выносливости</h2>
      <p className="text-gray-300 mb-6">
        Твой разум стал острее. Теперь укрепи тело, чтобы вместить новую силу.
        Выполни ежедневное задание, чтобы продолжить путь знаний.
      </p>
      <button
        onClick={handleCompleteExercise}
        disabled={loading}
        className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg disabled:bg-gray-500"
      >
        {loading ? 'Укрепление...' : 'Задание Выполнено (+25 XP, +1 СИЛА)'}
      </button>
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
    </div>
  );
}