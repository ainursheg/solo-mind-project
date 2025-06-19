// components/EnduranceGate.js
"use client";

import { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getRecommendedReps } from '../utils/gameLogic';
import axios from 'axios';

const exercisesDB = [
  { id: 1, name: 'Отжимания', group: 'push' },
  { id: 2, name: 'Подтягивания', group: 'pull' },
  { id: 3, name: 'Приседания', group: 'legs' },
];
const API_URL = 'http://localhost:3001';

// Принимаем в props функцию onCycleComplete от Dashboard
const EnduranceGate = ({ onCycleComplete }) => {
  const { profile, token, updateUserAndProfile } = useAuth();

  const [exerciseId, setExerciseId] = useState(exercisesDB[0].id);
  const [reps, setReps] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const recommendedReps = useMemo(() => {
    if (!profile) return 0;
    return getRecommendedReps(profile.level, profile.statEnd);
  }, [profile]);

  const minReps = Math.floor(recommendedReps * 0.3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reps || reps <= 0) {
      setError('Введите корректное количество повторений.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/activity/exercise`,
        {
          exerciseId: parseInt(exerciseId),
          reps: parseInt(reps),
          isTrainingMode: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updateUserAndProfile(response.data);
      alert('Отличная работа! Прогресс сохранен.');

      // ГЛАВНОЕ ИЗМЕНЕНИЕ:
      // Вместо редиректа, сообщаем дашборду, что цикл завершен
      onCycleComplete();

    } catch (err) {
      setError(err.response?.data?.message || 'Произошла неизвестная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return <div>Загрузка...</div>;

  return (
    <div className="w-full max-w-lg p-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-white">
      <h1 className="text-2xl font-bold text-center">Шаг 3: Закрепление Знаний</h1>
      <p className="text-center text-gray-400">
        Вы прошли тест. Теперь выполните упражнение, чтобы получить опыт и разблокировать следующее чтение.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ... JSX для формы остается таким же, как в предыдущей версии ... */}
        <div>
          <label htmlFor="exercise" className="block text-sm font-medium text-gray-300">Выберите упражнение</label>
          <select id="exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
            {exercisesDB.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="reps" className="block text-sm font-medium text-gray-300">Количество повторений</label>
          <p className="text-xs text-gray-400">Рекомендовано: {recommendedReps}. (Минимум для зачета: {minReps})</p>
          <input id="reps" type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Введите количество" className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" required />
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div>
          <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500">
            {isLoading ? 'Сохранение...' : 'Завершить и получить XP'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnduranceGate;