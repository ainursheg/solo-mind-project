'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function CalibrationForm() {
  const router = useRouter();
  const [answers, setAnswers] = useState({ q1: '', q2: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const questions = [
    { id: 'q1', text: 'Что для тебя важнее в развитии?', options: ['Физическая сила', 'Сила разума'] },
    { id: 'q2', text: 'Какой подход к тренировкам тебе ближе?', options: ['Взрывная мощь', 'Несгибаемая выносливость'] },
  ];

  const handleAnswer = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (!answers.q1 || !answers.q2) {
      setError('Нужно ответить на все вопросы.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('solo-mind-token');
      // Отправляем ответы на новый эндпоинт
      await axios.post(
        'http://localhost:3001/auth/calibrate',
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // После успешной калибровки отправляем на дэшборд
      router.push('/dashboard');

    } catch (err) {
      console.error('Ошибка калибровки:', err);
      setError(err.response?.data?.message || 'Произошла ошибка');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl p-8 bg-gray-900 rounded-lg">
      {questions.map((q, index) => (
        <div key={q.id} className="mb-8">
          <p className="font-semibold mb-4">{index + 1}. {q.text}</p>
          <div className="flex gap-4">
            {q.options.map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(q.id, option)}
                className={`flex-1 p-4 rounded-lg transition-colors ${
                  answers[q.id] === option
                    ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
      
      {error && <p className="text-red-500 text-center my-4">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading || !answers.q1 || !answers.q2}
        className="w-full py-3 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:bg-gray-500"
      >
        {loading ? 'Калибровка...' : 'Завершить Инициацию'}
      </button>
    </div>
  );
}