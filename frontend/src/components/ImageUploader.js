// components/ImageUploader.js
"use client";

import { useState } from 'react';
import { useGame } from '../context/GameContext'; // Импортируем, чтобы получить onQuizReady
import { api } from '@/services/api';



const ImageUploader = () => {
  const { handleQuizReady } = useGame(); // Получаем функцию из контекста
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
      const response = await api.uploadImage(formData);
      handleQuizReady(response.data); // Используем функцию из контекста
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при обработке изображения.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full p-8 space-y-6 bg-background-secondary/70 backdrop-blur-md rounded-lg shadow-xl border border-accent-primary/20 text-text-primary">
      <h1 className="text-2xl font-display font-bold text-center">Шаг 1: Загрузка Знаний</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="image-upload" className="block text-sm font-medium text-text-secondary">
            Выберите скриншот страницы
          </label>
          <input
            id="image-upload" type="file" accept="image/*" onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-primary/20 file:text-accent-primary hover:file:bg-accent-primary/30"
          />
        </div>
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <div>
          <button
            type="submit" disabled={isLoading || !file}
            className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-accent-primary shadow-lg transition-all duration-300 ease-in-out hover:shadow-glow-primary hover:-translate-y-0.5 disabled:bg-background-secondary disabled:text-text-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {isLoading ? 'Анализ текста...' : 'Сгенерировать квиз'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ImageUploader;