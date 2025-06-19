// components/TrainingMode.js
"use client";

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const exercisesDB = [
  { id: 1, name: 'Отжимания', group: 'push' },
  { id: 2, name: 'Подтягивания', group: 'pull' },
  { id: 3, name: 'Приседания', group: 'legs' },
];

const API_URL = 'http://localhost:3001';

// Принимаем пропс onClose, чтобы модальное окно можно было закрыть
const TrainingMode = ({ onClose }) => {
  const { token, updateUserAndProfile } = useAuth();
  const [exerciseId, setExerciseId] = useState(exercisesDB[0].id);
  const [reps, setReps] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/activity/exercise`,
        {
          exerciseId: parseInt(exerciseId),
          reps: parseInt(reps),
          isTrainingMode: true, // В этом компоненте флаг ВСЕГДА true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUserAndProfile(response.data);
      alert('Тренировка засчитана! Статы выросли.');
      onClose(); // Закрываем модальное окно после успеха
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-white relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">×</button>
        <h2 className="text-2xl font-bold text-center">Режим Тренировки</h2>
        <p className="text-center text-sm text-gray-400">Рост статов без получения XP.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... (здесь форма, аналогичная той, что была в EnduranceGate) ... */}
           <div>
              <label htmlFor="exercise-training" className="block text-sm font-medium text-gray-300">Упражнение</label>
              <select id="exercise-training" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md">
                {exercisesDB.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reps-training" className="block text-sm font-medium text-gray-300">Повторения</label>
              <input id="reps-training" type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Количество" className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md" required />
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-500">
              {isLoading ? 'Сохранение...' : 'Завершить подход'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default TrainingMode;