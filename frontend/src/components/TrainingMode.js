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
        { exerciseId: parseInt(exerciseId), reps: parseInt(reps), isTrainingMode: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUserAndProfile(response.data);
      alert('Тренировка засчитана! Статы выросли.');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in-up">
      <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary rounded-2xl shadow-xl text-text-primary border border-success/30 relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-text-secondary hover:text-white text-2xl font-bold">×</button>
        <h2 className="text-2xl font-display font-bold text-center">Режим Тренировки</h2>
        <p className="text-center text-sm text-text-secondary">Рост статов без получения XP.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
              <label htmlFor="exercise-training" className="block text-sm font-medium text-text-secondary">Упражнение</label>
              <select id="exercise-training" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:ring-success focus:border-success transition">
                {exercisesDB.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="reps-training" className="block text-sm font-medium text-text-secondary">Повторения</label>
              <input id="reps-training" type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Количество" className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:ring-success focus:border-success transition" required />
            </div>
            {error && <p className="text-sm text-danger text-center">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-success shadow-lg transition-all duration-300 ease-in-out hover:shadow-glow-primary hover:-translate-y-0.5 disabled:bg-background-secondary disabled:text-text-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none">
              {isLoading ? 'Сохранение...' : 'Завершить подход'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default TrainingMode;