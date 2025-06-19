// # Создаем самодостаточный компонент для отображения и обработки квиза
// src/components/QuizComponent.js
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/context/GameContext'; // Импортируем useGame
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const QuizComponent = () => {
  // Получаем все необходимое из контекстов
  const { token, updateUserAndProfile } = useAuth();
  const { quizData, handleQuizSuccess } = useGame();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);

  const handleSubmit = async () => {
    if (selectedAnswer === null) {
      setError('Пожалуйста, выберите ответ.');
      return;
    }

    setIsLoading(true);
    setError('');

    const isAnswerCorrect = selectedAnswer === quizData.correctAnswer;
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      try {
        const response = await axios.post(
          `${API_URL}/activity/submit-quiz`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updateUserAndProfile(response.data);
        setTimeout(() => {
          handleQuizSuccess(); // Вызываем функцию из GameContext
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || 'Ошибка при отправке результата квиза.');
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
    <div className="w-full max-w-2xl p-8 space-y-6 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-md text-white border border-gray-700">
      <h1 className="text-2xl font-bold text-center">Шаг 2: Проверка Знаний</h1>
      <div className="p-4 bg-gray-900/70 rounded-lg">
        <p className="text-lg font-semibold">{quizData.question}</p>
      </div>
      <div className="space-y-3">
        {quizData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => setSelectedAnswer(option)}
            className={`w-full p-3 text-left rounded-lg transition-colors ${
              selectedAnswer === option ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      {isCorrect !== null && (
        <p className={`text-center font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
          {isCorrect ? 'Верно! Переходим к следующему шагу...' : 'Неверно. Попробуйте еще раз.'}
        </p>
      )}
      <div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || selectedAnswer === null}
          className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500"
        >
          {isLoading ? 'Проверка...' : 'Ответить'}
        </button>
      </div>
    </div>
  );
};

export default QuizComponent;