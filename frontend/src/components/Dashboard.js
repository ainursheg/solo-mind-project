'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import ImageUploader from './ImageUploader';
import EnduranceGate from './EnduranceGate';

export default function Dashboard() {
  const { logout } = useAuth(); // Получаем функцию logout из хука
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    console.log('ЗАПУЩЕНА ФУНКЦИЯ fetchProfile'); // Новый лог
    setLoading(true); // Включаем загрузку на время запроса
    const token = localStorage.getItem('solo-mind-token');
    if (!token) { setLoading(false); return; }
    try {
      const response = await axios.get('http://localhost:3001/profile', { headers: { Authorization: `Bearer ${token}` } });
      console.log('ПОЛУЧЕНЫ СВЕЖИЕ ДАННЫЕ С СЕРВЕРА:', response.data); // Новый лог
      setProfile(response.data);
    } catch (err) {
      setError('Не удалось загрузить данные профиля.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Наша функция для прямого обновления
  const updateProfileState = (newProfile) => {
    if (newProfile) { // Добавим проверку на всякий случай
      console.log('DASHBOARD ОБНОВЛЯЕТСЯ НАПРЯМУЮ С:', newProfile);
      setProfile(newProfile);
    }
  };
  
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // --- Логика отображения ---

  // Если профиль уже загружен, выводим его состояние перед отрисовкой
if (profile) {
  console.log('DASHBOARD РЕРЕНДЕР С isReadingUnlocked:', profile.isReadingUnlocked); // <-- НАШ ШПИОН №3
}

  if (loading) {
    return <p className="text-center text-lg">Загрузка Панели Управления...</p>;
  }

  if (error) {
    return <p className="text-center text-lg text-red-500">{error}</p>;
  }

  if (!profile) {
    return null; // Если профиля нет, ничего не показываем
  }

  // Если все хорошо, показываем данные
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-gray-900 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">
  {/* Если profile.user существует, показываем имя. Если нет - ничего */}
  Пробужденный: <span className="text-purple-400">{profile.user?.name}</span>
</h1>
        <div className="text-xl font-bold">
          Уровень: <span className="text-purple-400">{profile.level}</span>
        </div>
      </div>

      <button
        onClick={logout}
        className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
      >
        Выйти
      </button>

      {/* Полоска опыта */}
      <div className="mb-8">
        <div className="flex justify-between mb-1 text-sm">
          <span>Опыт</span>
          <span>{profile.currentXp} / {profile.xpToNextLevel}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div
            className="bg-purple-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${(profile.currentXp / profile.xpToNextLevel) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Сетка характеристик */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">СИЛА</p>
          <p className="text-2xl font-bold">{profile.statStr}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">ВЫНОСЛИВОСТЬ</p>
          <p className="text-2xl font-bold">{profile.statEnd}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">ЛОВКОСТЬ</p>
          <p className="text-2xl font-bold">{profile.statAgi}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">ИНТЕЛЛЕКТ</p>
          <p className="text-2xl font-bold">{profile.statInt}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">МУДРОСТЬ</p>
          <p className="text-2xl font-bold">{profile.statWis}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">ФОКУС</p>
          <p className="text-2xl font-bold">{profile.statFoc}</p>
        </div>
      </div>
      {/* === ИЗМЕНЯЕМ ЭТОТ БЛОК НА УСЛОВНЫЙ РЕНДЕРИНГ === */}
<div className="mt-10 flex justify-center">
  {profile.isReadingUnlocked ? (
    // Если чтение разблокировано, показываем загрузчик изображений
    <ImageUploader onProfileUpdate={fetchProfile} />
  ) : (
    // Если заблокировано, показываем "Врата Выносливости"
    <EnduranceGate onProfileUpdate={updateProfileState} />
  )}
</div>
{/* === КОНЕЦ ИЗМЕНЕНИЙ === */}
    </div>

    
  );
}