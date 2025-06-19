// components/ImageUploader.js
"use client";

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

// Принимаем в props функцию onQuizReady, которую нам передал Dashboard
const ImageUploader = ({ onQuizReady }) => {
  const { token } = useAuth();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Пожалуйста, выберите файл для загрузки.');
      return;
    }

    setError('');
    setIsLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Отправляем файл на бэкенд, который сам сделает OCR и сгенерирует квиз
      const response = await axios.post(
        `${API_URL}/ocr/upload-and-process`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // ГЛАВНОЕ ИЗМЕНЕНИЕ:
      // Вместо того чтобы обрабатывать квиз здесь, мы передаем его наверх в Dashboard
      onQuizReady(response.data);

    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при обработке изображения.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-white">
      <h1 className="text-2xl font-bold text-center">Шаг 1: Загрузка Знаний</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300">
            Выберите скриншот страницы
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        <div>
          <button
            type="submit"
            disabled={isLoading || !file}
            className="w-full flex justify-center py-2 px-4 border rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500"
          >
            {isLoading ? 'Анализ текста...' : 'Сгенерировать квиз'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImageUploader;