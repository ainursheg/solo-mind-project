// backend/index.js

// --- 1. Импорты ---
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Импортируем наши новые роутеры
const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

const errorHandler = require('./middleware/errorHandler');

// --- 2. Инициализация ---
const app = express();
const PORT = 3001;

// --- 3. Middleware ---
app.use(cors());
app.use(express.json());

// --- 4. Подключение роутеров ---
// Все маршруты, начинающиеся с /auth, будут обрабатываться в auth.routes.js
app.use('/auth', authRoutes);

// Все маршруты, начинающиеся с /api, будут обрабатываться в api.routes.js
app.use('/api', apiRoutes);

// --- 5. Базовый маршрут для проверки ---
app.get('/', (req, res) => {
  res.send('Система "Solo Mind" запущена. Добро пожаловать, Пробужденный.');
});

// --- 6. Централизованный обработчик ошибок ---
// ВАЖНО: Этот middleware должен быть последним в цепочке app.use()
app.use(errorHandler);

// --- 7. Запуск сервера ---
app.listen(PORT, () => {
  console.log(`Бэкенд-сервер успешно запущен на порту ${PORT}`);
});