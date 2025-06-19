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
    return <div className="flex items-center justify-center h-screen bg-background-primary text-text-primary">Загрузка профиля...</div>;
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 gap-8">
      <div className="p-6 max-w-4xl w-full mx-auto bg-background-secondary/70 backdrop-blur-md text-text-primary rounded-2xl shadow-2xl border border-accent-primary/30">
        <div className="flex justify-between items-center mb-6 border-b border-accent-primary/20 pb-4">
          <h1 className="font-display text-3xl font-bold text-text-primary">Профиль: {user.name}</h1>
          <div className="flex items-center gap-4">
            {/* # ИЗМЕНЕНИЕ: Применяем классы напрямую */}
            <button onClick={() => setIsTrainingModalOpen(true)} className="py-2 px-4 rounded-lg font-semibold text-white bg-success hover:bg-success/80 transition-colors">Тренировка</button>
            <button onClick={logout} className="py-2 px-4 rounded-lg font-semibold text-white bg-danger hover:bg-danger/80 transition-colors">Выход</button>
          </div>
        </div>

        {gameState === GAME_STATES.PROFILE && (
          <div className="text-center bg-background-primary/50 p-6 rounded-lg mb-6">
            <h2 className="font-display text-xl font-semibold mb-4">Основной Цикл</h2>
            {/* # ИЗМЕНЕНИЕ: Применяем классы напрямую */}
            <button 
              onClick={startReading} 
              disabled={!profile.isReadingUnlocked} 
              className="
                py-3 px-8 rounded-lg font-semibold text-white bg-accent-primary shadow-lg 
                transition-all duration-300 ease-in-out
                hover:shadow-glow-primary hover:-translate-y-0.5
                disabled:bg-background-secondary disabled:text-text-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
              "
            >
              Начать чтение
            </button>
            {!profile.isReadingUnlocked && <p className="text-xs text-accent-gold mt-2">Чтобы продолжить, завершите физическое упражнение.</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCard name="Сила (STR)" value={profile.statStr} color="text-danger" />
            <StatCard name="Выносливость (END)" value={profile.statEnd} color="text-success" />
            <StatCard name="Интеллект (INT)" value={profile.statInt} color="text-accent-secondary" />
            <StatCard name="Мудрость (WIS)" value={profile.statWis} color="text-accent-primary" />
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-text-secondary mb-1">Уровень {profile.level} | Опыт (XP): {profile.currentXp} / {xpToNextLevel}</p>
              <progress className="w-full [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg [&::-webkit-progress-bar]:bg-background-primary [&::-webkit-progress-value]:bg-accent-primary [&::-moz-progress-bar]:bg-accent-primary" value={profile.currentXp} max={xpToNextLevel}></progress>
            </div>
            <div className="bg-background-primary/50 p-3 rounded-lg">
              <h3 className="font-display font-bold mb-2 text-text-secondary">Мышечное Напряжение</h3>
              {user.muscleTension && Object.keys(user.muscleTension).length > 0 ? (
                <ul className="text-sm space-y-1">
                  {Object.entries(user.muscleTension).map(([group, value]) => (
                    <li key={group}><span className="capitalize font-semibold">{group}:</span> {Math.floor(value)}</li>
                  ))}
                </ul>
              ) : <p className="text-sm text-text-secondary">Все мышечные группы восстановлены.</p>}
            </div>
          </div>
        </div>
      </div>
      
      {gameState !== GAME_STATES.PROFILE && (
        <div key={gameState} className="w-full max-w-2xl animate-fade-in-up">
           {renderGameComponent()}
        </div>
      )}

      {isTrainingModalOpen && <TrainingMode onClose={() => setIsTrainingModalOpen(false)} />}
    </div>
  );
};

const StatCard = ({ name, value, color }) => (
  <div className="p-4 bg-background-primary/50 rounded-lg text-center border border-white/10">
    <p className={`font-display font-bold ${color}`}>{name}</p>
    <p className="text-4xl font-sans font-light">{value}</p>
  </div>
);

export default Dashboard;