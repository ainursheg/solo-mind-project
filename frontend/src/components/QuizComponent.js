// src/components/QuizComponent.js
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/context/GameContext';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const QuizComponent = () => {
  const { token, updateUserAndProfile } = useAuth();
  const { quizData, handleQuizSuccess } = useGame();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);

  const getButtonClass = (option) => {
    // После проверки ответа, подсвечиваем правильный и неправильный
    if (isCorrect !== null) {
      if (option === quizData.correctAnswer) return 'bg-success scale-105'; // Правильный ответ всегда выделяется
      if (option === selectedAnswer) return 'bg-danger'; // Неправильно выбранный
      return 'bg-background-primary opacity-50'; // Остальные приглушаются
    }
    // В процессе выбора
    if (selectedAnswer === option) {
      return 'bg-accent-primary transform-none'; // Выбранный ответ "утоплен"
    }
    // Стандартное состояние с ховером
    return 'bg-background-primary hover:bg-background-primary/70 hover:-translate-y-0.5';
  };

  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    setIsLoading(true);
    setError('');

    const isAnswerCorrect = selectedAnswer === quizData.correctAnswer;
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      try {
        const response = await axios.post(`${API_URL}/activity/submit-quiz`, {}, { headers: { Authorization: `Bearer ${token}` } });
        updateUserAndProfile(response.data);
        setTimeout(() => handleQuizSuccess(), 2000);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка');
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setIsCorrect(null);
        setSelectedAnswer(null);
        setIsLoading(false);
      }, 2000);
    }
  };

  if (!quizData) return <p>Загрузка данных квиза...</p>;

  return (
    <div className="w-full p-8 space-y-6 bg-background-secondary/70 backdrop-blur-md rounded-lg shadow-xl border border-accent-primary/20 text-text-primary">
      <h1 className="text-2xl font-display font-bold text-center">Шаг 2: Проверка Знаний</h1>
      <div className="p-4 bg-background-primary rounded-lg">
        <p className="text-lg font-semibold">{quizData.question}</p>
      </div>
      <div className="space-y-4"> {/* Увеличили отступ для красоты */}
        {quizData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => !isLoading && isCorrect === null && setSelectedAnswer(option)}
            disabled={isLoading || isCorrect !== null}
            className={`w-full p-4 text-left rounded-lg transition-all duration-200 shadow-md disabled:opacity-100 ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      {isCorrect !== null && <p className={`text-center font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>{isCorrect ? 'Верно! Переходим к следующему шагу...' : 'Неверно. Попробуйте еще раз.'}</p>}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={isLoading || selectedAnswer === null || isCorrect !== null}
          className="
            w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-accent-primary shadow-lg 
            transition-all duration-300 ease-in-out
            hover:shadow-glow-primary hover:-translate-y-0.5
            disabled:bg-background-secondary disabled:text-text-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
          "
        >
          {isLoading ? 'Проверка...' : 'Ответить'}
        </button>
      </div>
    </div>
  );
};

export default QuizComponent;