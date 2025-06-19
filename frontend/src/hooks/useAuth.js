// hooks/useAuth.js
"use client";

import { useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // Начинаем с true

  // v7.0 ИСПРАВЛЕНИЕ: Используем async/await внутри useEffect
  useEffect(() => {
    const loadUserFromStorage = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          // Пытаемся получить данные пользователя
          const res = await axios.get(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          setProfile(res.data);
          setUser(res.data.user);
        } catch (error) {
          console.error("Не удалось получить данные по токену, выходим.", error);
          localStorage.removeItem('token'); // Удаляем невалидный токен
        }
      }
      // Убираем загрузку ТОЛЬКО ПОСЛЕ того, как все проверки завершены
      setLoading(false);
    };

    loadUserFromStorage();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token } = res.data;
      localStorage.setItem('token', token);
      setToken(token);
      
      // Сразу после логина получаем все данные профиля
      const profileRes = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileRes.data);
      setUser(profileRes.data.user);

    } catch (error) {
      console.error("Ошибка входа:", error);
      throw error; // Пробрасываем ошибку, чтобы компонент мог ее поймать
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
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