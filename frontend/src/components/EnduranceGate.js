// components/EnduranceGate.js
"use client";

import { useState, useMemo, useEffect  } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '@/context/GameContext';
import { getRecommendedReps } from '../utils/gameLogic';
import { api } from '@/services/api';


const EnduranceGate = () => {
  const { profile, updateUserAndProfile } = useAuth();
  const { handleCycleComplete } = useGame();
  
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');

  const [reps, setReps] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Загружаем упражнения при монтировании компонента
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await api.getExercises();
        setExercises(response.data);
        // Устанавливаем начальное значение для select, если данные пришли
        if (response.data.length > 0) {
          setExerciseId(response.data[0].id);
        }
      } catch (error) {
        console.error("Ошибка загрузки упражнений:", error);
        setError("Не удалось загрузить список упражнений.");
      }
    };
    fetchExercises();
  }, []); // Пустой массив зависимостей для выполнения один раз

  const recommendedReps = useMemo(() => (profile ? getRecommendedReps(profile.level, profile.statEnd) : 0), [profile]);
  const minReps = Math.floor(recommendedReps * 0.3);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reps || reps <= 0) return;
    setIsLoading(true);
    try {
      const response = await api.submitExercise({
        exerciseId: parseInt(exerciseId),
        reps: parseInt(reps),
        isTrainingMode: false
      });
      updateUserAndProfile(response.data);
      handleCycleComplete();
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла неизвестная ошибка.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return <div>Загрузка...</div>;

  return (
    <div className="w-full p-8 space-y-6 bg-background-secondary/70 backdrop-blur-md rounded-lg shadow-xl border border-accent-primary/20 text-text-primary">
      <h1 className="text-2xl font-display font-bold text-center">Шаг 3: Закрепление Знаний</h1>
      <p className="text-center text-text-secondary">Выполните упражнение, чтобы получить опыт и разблокировать следующее чтение.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="exercise" className="block text-sm font-medium text-text-secondary">Выберите упражнение</label>
          {/* --- ИЗМЕНЕННЫЕ СТИЛИ ДЛЯ SELECT --- */}
          <select id="exercise" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:ring-accent-primary focus:border-accent-primary transition">
            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="reps" className="block text-sm font-medium text-text-secondary">Количество повторений</label>
          {/* --- ИЗМЕНЕННЫЕ СТИЛИ ДЛЯ ИНФО-ТЕКСТА --- */}
          <p className="text-xs text-text-secondary">
            Рекомендовано: <span className="font-bold text-accent-gold">{recommendedReps}</span>. 
            (Минимум для зачета: <span className="font-bold text-accent-gold">{minReps}</span>)
          </p>
          {/* --- ИЗМЕНЕННЫЕ СТИЛИ ДЛЯ INPUT --- */}
          <input id="reps" type="number" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="Введите количество" className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:ring-accent-primary focus:border-accent-primary transition" required />
        </div>
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <div>
          {/* --- ИЗМЕНЕННЫЕ СТИЛИ ДЛЯ КНОПКИ --- */}
          <button 
            type="submit" 
            disabled={isLoading} 
            className="
              w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-accent-primary shadow-lg 
              transition-all duration-300 ease-in-out
              hover:shadow-glow-primary hover:-translate-y-0.5
              disabled:bg-background-secondary disabled:text-text-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
            "
          >
            {isLoading ? 'Сохранение...' : 'Завершить и получить XP'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnduranceGate;