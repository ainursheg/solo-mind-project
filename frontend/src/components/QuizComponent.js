// src/components/QuizComponent.js
"use client";

import { useReducer, useEffect } from 'react'; 
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/context/GameContext';
import { api } from '@/services/api';

// Шаг 1: Определяем четкие состояния UI
const UI_STATES = {
  ANSWERING: 'ANSWERING',      // Пользователь выбирает ответ
  SUBMITTING: 'SUBMITTING',    // Идет отправка на сервер
  SHOWING_RESULT: 'SHOWING_RESULT', // Результат (верно/неверно) показывается
};

// Шаг 2: Создаем reducer для управления состоянием
const initialState = {
  uiState: UI_STATES.ANSWERING,
  selectedAnswer: null,
  isCorrect: null,
  error: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'SELECT_ANSWER':
      // Пока мы в состоянии выбора, можно менять ответ
      if (state.uiState === UI_STATES.ANSWERING) {
        return { ...state, selectedAnswer: action.payload };
      }
      return state; // Игнорируем выбор в других состояниях
    
    case 'SUBMIT':
      return { ...state, uiState: UI_STATES.SUBMITTING, error: '' };
      
    case 'SUBMIT_SUCCESS':
      return { ...state, uiState: UI_STATES.SHOWING_RESULT, isCorrect: true };
      
    case 'SUBMIT_FAILURE':
      return { ...state, uiState: UI_STATES.SHOWING_RESULT, isCorrect: false };
      
    case 'SET_ERROR':
      return { ...state, uiState: UI_STATES.ANSWERING, error: action.payload };
      
    case 'RESET':
      // Сбрасываем все, кроме uiState, чтобы избежать моргания
      return { ...initialState, uiState: UI_STATES.ANSWERING };
      
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

const QuizComponent = () => {
  const { updateUserAndProfile } = useAuth();
  const { quizData, handleQuizSuccess } = useGame();

  // Шаг 3: Интегрируем useReducer
  const [state, dispatch] = useReducer(reducer, initialState);
  const { uiState, selectedAnswer, isCorrect, error } = state;

  // Шаг 4: Используем useEffect для управления побочными эффектами (таймеры)
  useEffect(() => {
    // Если мы не в состоянии показа результата, ничего не делаем
    if (uiState !== UI_STATES.SHOWING_RESULT) {
      return;
    }

    // Запускаем таймер, когда переходим в состояние показа результата
    const timer = setTimeout(() => {
      if (isCorrect) {
        handleQuizSuccess(); // Переходим к следующему этапу игры
      } else {
        dispatch({ type: 'RESET' }); // Сбрасываем для повторной попытки
      }
    }, 2000); // 2 секунды на просмотр результата

    // Очистка таймера при размонтировании компонента или смене состояния
    return () => clearTimeout(timer);

  }, [uiState, isCorrect, handleQuizSuccess]);


  // Шаг 5: Рефакторинг handleSubmit
  const handleSubmit = async () => {
    if (selectedAnswer === null) return;
    
    dispatch({ type: 'SUBMIT' });

    const isAnswerCorrect = selectedAnswer === quizData.correctAnswer;

    if (isAnswerCorrect) {
      try {
        const response = await api.submitQuizAnswer();
        updateUserAndProfile(response.data);
        dispatch({ type: 'SUBMIT_SUCCESS' });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.response?.data?.message || 'Ошибка при отправке ответа' });
      }
    } else {
      // Если ответ неверный, просто диспатчим ошибку без запроса к API
      dispatch({ type: 'SUBMIT_FAILURE' });
    }
  };

  // Шаг 6: Упрощаем getButtonClass
  const getButtonClass = (option) => {
    if (uiState === UI_STATES.SHOWING_RESULT) {
      if (option === quizData.correctAnswer) return 'bg-success scale-105';
      if (option === selectedAnswer) return 'bg-danger';
      return 'bg-background-primary opacity-50';
    }
    // В состоянии ANSWERING или SUBMITTING
    if (selectedAnswer === option) {
      return 'bg-accent-primary transform-none';
    }
    return 'bg-background-primary hover:bg-background-primary/70 hover:-translate-y-0.5';
  };

  if (!quizData) return <p>Загрузка данных квиза...</p>;

  // Шаг 7: Обновляем JSX
  return (
    <div className="w-full p-8 space-y-6 bg-background-secondary/70 backdrop-blur-md rounded-lg shadow-xl border border-accent-primary/20 text-text-primary">
      <h1 className="text-2xl font-display font-bold text-center">Шаг 2: Проверка Знаний</h1>
      <div className="p-4 bg-background-primary rounded-lg">
        <p className="text-lg font-semibold">{quizData.question}</p>
      </div>
      <div className="space-y-4">
        {quizData.options.map((option, index) => (
          <button
            key={index}
            onClick={() => dispatch({ type: 'SELECT_ANSWER', payload: option })}
            disabled={uiState !== UI_STATES.ANSWERING}
            className={`w-full p-4 text-left rounded-lg transition-all duration-200 shadow-md disabled:opacity-100 disabled:cursor-not-allowed ${getButtonClass(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-danger text-center">{error}</p>}
      {uiState === UI_STATES.SHOWING_RESULT && (
        <p className={`text-center font-bold ${isCorrect ? 'text-success' : 'text-danger'}`}>
          {isCorrect ? 'Верно! Переходим к следующему шагу...' : 'Неверно. Попробуйте еще раз.'}
        </p>
      )}
      <div className="pt-2">
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null || uiState !== UI_STATES.ANSWERING}
          className="
            w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-accent-primary shadow-lg 
            transition-all duration-300 ease-in-out
            hover:shadow-glow-primary hover:-translate-y-0.5
            disabled:bg-background-secondary disabled:text-text-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
          "
        >
          {uiState === UI_STATES.SUBMITTING ? 'Проверка...' : 'Ответить'}
        </button>
      </div>
    </div>
  );
};

export default QuizComponent;