// # Рефакторим Dashboard для использования GameContext и упрощения логики
// components/Dashboard.js
"use client";

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGame, GAME_STATES } from '../context/GameContext'; // Импортируем контекст и состояния
import { calculateXpForLevel } from '../utils/gameLogic';

import TrainingMode from './TrainingMode';
import ImageUploader from './ImageUploader';
import EnduranceGate from './EnduranceGate';
import QuizComponent from './QuizComponent'; // Импортируем новый компонент

const Dashboard = () => {
  // # Получаем данные из AuthContext
  const { profile, user, logout } = useAuth();
  // # Получаем состояние и функции управления из GameContext
  const { gameState, startReading, handleQuizReady, handleCycleComplete } = useGame();
  
  // # Локальное состояние для модального окна остается здесь
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);

  if (!profile || !user) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Загрузка профиля...</div>;
  }

  // # Вспомогательная функция для рендеринга динамической части
  const renderGameComponent = () => {
    switch (gameState) {
      case GAME_STATES.UPLOADING:
        // # Передаем функцию из контекста в пропс
        return <ImageUploader onQuizReady={handleQuizReady} />;
      case GAME_STATES.QUIZ:
        // # QuizComponent теперь не требует пропсов, он самодостаточен
        return <QuizComponent />;
      case GAME_STATES.EXERCISE:
        // # Передаем функцию из контекста в пропс
        return <EnduranceGate onCycleComplete={handleCycleComplete} />;
      case GAME_STATES.PROFILE:
      default:
        // # В состоянии PROFILE ничего не рендерим в этой области
        return null;
    }
  };

  const xpToNextLevel = calculateXpForLevel(profile.level);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 gap-8">
      {/* --- Статичная часть: Профиль --- */}
      <div className="p-6 max-w-4xl w-full mx-auto bg-gray-800/50 backdrop-blur-sm text-white rounded-2xl shadow-2xl border border-gray-700">
        {/* Шапка */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h1 className="text-3xl font-bold">Профиль: {user.name}</h1>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsTrainingModalOpen(true)} className="py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-sm transition-colors">Тренировка</button>
            <button onClick={logout} className="py-2 px-4 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm transition-colors">Выход</button>
          </div>
        </div>

        {/* Основной Цикл - теперь это просто кнопка */}
        {gameState === GAME_STATES.PROFILE && (
          <div className="text-center bg-gray-900/70 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Основной Цикл</h2>
            {/* # Кнопка вызывает функцию из контекста */}
            <button onClick={startReading} disabled={!profile.isReadingUnlocked} className="px-8 py-3 text-lg font-bold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-transform hover:scale-105 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100">Начать чтение</button>
            {!profile.isReadingUnlocked && <p className="text-xs text-yellow-400 mt-2">Чтобы продолжить, завершите физическое упражнение.</p>}
          </div>
        )}

        {/* Характеристики и Прогресс */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard name="Сила (STR)" value={profile.statStr} color="text-red-400" />
            <StatCard name="Выносливость (END)" value={profile.statEnd} color="text-green-400" />
            <StatCard name="Интеллект (INT)" value={profile.statInt} color="text-blue-400" />
            <StatCard name="Мудрость (WIS)" value={profile.statWis} color="text-purple-400" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-300 mb-1">Опыт (XP): {profile.currentXp} / {xpToNextLevel}</p>
              <progress className="w-full [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-gray-700 [&::-webkit-progress-value]:bg-violet-500 [&::-moz-progress-bar]:bg-violet-500" value={profile.currentXp} max={xpToNextLevel}></progress>
            </div>
            <div className="bg-gray-900/70 p-3 rounded-lg">
              <h3 className="font-bold mb-2 text-gray-300">Мышечное Напряжение</h3>
              {user.muscleTension && Object.keys(user.muscleTension).length > 0 ? (
                <ul className="text-sm space-y-1">
                  {Object.entries(user.muscleTension).map(([group, value]) => (
                    <li key={group}><span className="capitalize font-semibold">{group}:</span> {Math.floor(value)}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-400">Все мышечные группы восстановлены.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* --- Динамическая часть: Игровой компонент --- */}
      {renderGameComponent()}

      {/* Модальное окно тренировки остается без изменений */}
      {isTrainingModalOpen && <TrainingMode onClose={() => setIsTrainingModalOpen(false)} />}
    </div>
  );
};

// Вспомогательный компонент для карточки стата (без изменений)
const StatCard = ({ name, value, color }) => (
  <div className="p-4 bg-gray-900/70 rounded-lg text-center">
    <p className={`font-bold ${color}`}>{name}</p>
    <p className="text-3xl font-light">{value}</p>
  </div>
);

export default Dashboard;