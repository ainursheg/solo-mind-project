'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ImageUploader({ onProfileUpdate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState(null); // Здесь будем хранить полученный квиз
  const [error, setError] = useState('');
  const [quizResult, setQuizResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Создаем превью изображения
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuizSubmit = async (selectedOption) => {
    console.log('Начинаю отправку ответа:', selectedOption);
    setLoading(true);
    setError('');
    setQuizResult(null);
  
    try {
      const token = localStorage.getItem('solo-mind-token');
      const response = await axios.post(
        'http://localhost:3001/activity/submit-quiz',
        {
          userAnswer: selectedOption,
          correctAnswer: quiz.correctAnswer,
        },
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      
      setQuizResult(response.data.message); // Показываем сообщение "Верно!" или "Неверно!"
      
      if (response.data.success) {
        // Передаем полный объект профиля из ответа
        await onProfileUpdate(response.data.profile); 
      
        // Если ответ верный, мы могли бы обновить профиль на дэшборде,
        // но для простоты пока просто покажем сообщение.
        // В идеале, дэшборд должен сам обновить данные.
        console.log('Профиль обновлен:', response.data.profile);
      }
      
      setQuiz(null); // Прячем квиз после ответа
      setSelectedFile(null); // Сбрасываем выбранный файл
      setPreview(null); // Убираем превью
  
    } catch (err) {
      console.error('Ошибка отправки ответа на квиз:', err);
      setError(err.response?.data?.message || 'Произошла ошибка');
    } finally {
      console.log('Блок finally сработал, выключаю загрузку.'); // <--- ДОБАВЛЯЕМ ЭТОТ ЛОГ
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Пожалуйста, выберите файл');
      return;
    }
    setError('');
    setQuiz(null);
    setQuizResult(null);
    setLoading(true);

  
    // Создаем объект FormData для отправки файла
    const formData = new FormData();
    formData.append('image', selectedFile); // 'image' - это имя поля, которое ожидает multer
  
    try {
      const token = localStorage.getItem('solo-mind-token');
      const response = await axios.post(
        'http://localhost:3001/ocr/upload-and-process',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Важный заголовок для отправки файлов
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      // Сохраняем полученный квиз в состояние
      setQuiz(response.data);
      console.log('Получен квиз:', response.data);
  
    } catch (err) {
      console.error('Ошибка загрузки и обработки:', err);
      setError(err.response?.data?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl p-6 bg-gray-800 rounded-lg mt-8">
      <h2 className="text-xl font-semibold text-center mb-4">Начать Сессию Чтения</h2>
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Выбрать изображение
        </label>
        {preview && (
          <div className="mt-4">
            <p className="text-sm mb-2">Предпросмотр:</p>
            <img src={preview} alt="Превью" className="max-w-full h-auto mx-auto rounded-md" />
          </div>
        )}
      </div>
      <div className="mt-6">
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || loading}
          className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded disabled:bg-gray-500"
        >
          {loading ? 'Обработка...' : 'Проверить знания'}
        </button>
      </div>
      {/* Блок для сообщения о результате квиза */}
{quizResult && <p className="text-yellow-400 text-center mt-4 font-bold">{quizResult}</p>}

{/* === ИЗМЕНЯЕМ БЛОК ОТОБРАЖЕНИЯ КВИЗА === */}
{quiz && !loading && (
  <div className="mt-6 p-4 bg-gray-700 rounded-lg">
    <h3 className="font-bold mb-4 text-lg">{quiz.question}</h3>
    <ul className="space-y-2">
      {quiz.options.map((option, index) => (
        <li key={index}>
          <button
            onClick={() => handleQuizSubmit(option)}
            className="w-full p-3 bg-gray-600 hover:bg-purple-700 rounded text-left transition-colors"
          >
            {option}
          </button>
        </li>
      ))}
    </ul>
  </div>
)}
    </div>
  );
}