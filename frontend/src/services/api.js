import axios from 'axios';
import { AUTH_TOKEN_KEY } from '@/utils/constants';

// 1. Создаем экземпляр axios с базовой конфигурацией
const apiClient = axios.create({
  // Используем новый базовый URL с префиксом /api
  // Это означает, что все запросы, кроме auth, будут идти на http://localhost:3001/api/...
  baseURL: 'http://localhost:3001/api',
});

// 2. Добавляем interceptor (перехватчик) для всех запросов
// Он будет автоматически добавлять токен авторизации в заголовки
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Создаем объект с функциями-обертками для каждого эндпоинта
export const api = {
  // --- Auth эндпоинты (используют другой префикс) ---
  login: (email, password) => {
    // Для auth-запросов мы используем относительный путь, чтобы "выйти" из /api
    // 'http://localhost:3001/api' + '../auth/login' -> 'http://localhost:3001/auth/login'
    return apiClient.post('../auth/login', { email, password });
  },
  signup: (name, email, password) => {
    return apiClient.post('../auth/signup', { name, email, password });
  },

  // --- API эндпоинты (используют baseURL /api) ---
  getProfile: () => {
    // URL будет /profile, полный путь: http://localhost:3001/api/profile
    return apiClient.get('/profile');
  },
  getExercises: () => {
    return apiClient.get('/exercises');
  },
  submitExercise: (data) => {
    // data = { exerciseId, reps, isTrainingMode }
    return apiClient.post('/activity/exercise', data);
  },
  submitQuizAnswer: () => {
    // Этот эндпоинт не требует тела запроса
    return apiClient.post('/activity/submit-quiz', {});
  },
  uploadImage: (formData) => {
    // Для загрузки файлов нужны специальные заголовки, которые axios выставит сам,
    // если передать объект FormData. Нам не нужно их указывать здесь.
    return apiClient.post('/ocr/upload-and-process', formData);
  },
};