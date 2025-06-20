// hooks/useAuth.js
"use client";

import { useState, useEffect, useContext, createContext } from 'react';
import { api } from '@/services/api';
import { AUTH_TOKEN_KEY } from '@/utils/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Начинаем с true

  // v7.0 ИСПРАВЛЕНИЕ: Используем async/await внутри useEffect
  useEffect(() => {
    const loadUserFromStorage = async () => {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        try {
          // Пытаемся получить данные пользователя
          const res = await api.getProfile();
          setProfile(res.data);
          setUser(res.data.user);
        } catch (error) {
          console.error("Не удалось получить данные по токену, выходим.", error);
          localStorage.removeItem(AUTH_TOKEN_KEY); // Удаляем невалидный токен
        }
      }
      // Убираем загрузку ТОЛЬКО ПОСЛЕ того, как все проверки завершены
      setLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      const { token } = res.data;
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      setToken(token);
      
      // Сразу после логина получаем все данные профиля
      const profileRes = await api.getProfile();
      setProfile(profileRes.data);
      setUser(profileRes.data.user);

    } catch (error) {
      console.error("Ошибка входа:", error);
      throw error; // Пробрасываем ошибку, чтобы компонент мог ее поймать
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const updateUserAndProfile = (updatedData) => {
    if (updatedData.updatedProfile) {
      setProfile(prevProfile => ({ ...prevProfile, ...updatedData.updatedProfile }));
    }
    if (updatedData.updatedUser) {
      setUser(prevUser => ({ ...prevUser, ...updatedData.updatedUser }));
    }
  };

  const value = {
    token,
    user,
    profile,
    loading,
    login,
    logout,
    updateUserAndProfile,
  };

  // v7.0 ИСПРАВЛЕНИЕ: Не рендерим детей, пока идет первоначальная загрузка
  return (
    <AuthContext.Provider value={value}>
      {loading ? <div>Загрузка приложения...</div> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};