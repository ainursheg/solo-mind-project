// src/context/GameContext.js
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

// Определяем возможные состояния игрового цикла для ясности и надежности
export const GAME_STATES = {
  PROFILE: 'PROFILE',   // Отображается профиль и кнопка "Начать чтение"
  UPLOADING: 'UPLOADING', // Отображается ImageUploader
  QUIZ: 'QUIZ',         // Отображается QuizComponent
  EXERCISE: 'EXERCISE',   // Отображается EnduranceGate
};

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const { profile } = useAuth();
  const [gameState, setGameState] = useState(GAME_STATES.PROFILE);
  const [quizData, setQuizData] = useState(null);

  // Синхронизируем состояние игры с профилем пользователя
  useEffect(() => {
    if (profile) {
      // Если чтение не разблокировано, значит, нужно делать упражнение
      if (!profile.isReadingUnlocked) {
        setGameState(GAME_STATES.EXERCISE);
      } else {
        // Иначе, возвращаемся в состояние профиля
        setGameState(GAME_STATES.PROFILE);
      }
    }
  }, [profile]); // Зависимость от profile

  // Действия для управления циклом
  const startReading = useCallback(() => {
    if (profile?.isReadingUnlocked) {
      setGameState(GAME_STATES.UPLOADING);
    }
  }, [profile]);

  const handleQuizReady = useCallback((data) => {
    setQuizData(data);
    setGameState(GAME_STATES.QUIZ);
  }, []);

  const handleQuizSuccess = useCallback(() => {
    setQuizData(null);
    setGameState(GAME_STATES.EXERCISE);
  }, []);

  const handleCycleComplete = useCallback(() => {
    setGameState(GAME_STATES.PROFILE);
  }, []);

  const value = {
    gameState,
    quizData,
    startReading,
    handleQuizReady,
    handleQuizSuccess,
    handleCycleComplete,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  return useContext(GameContext);
};