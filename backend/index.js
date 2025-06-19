//index.js

// --- 1. Импорты ---
const express = require('express');
const { PrismaClient } = require('./generated/prisma');  // Импортируем Prisma Client
const bcrypt = require('bcryptjs'); // Импортируем bcrypt для хеширования
require('dotenv').config(); // Загружает переменные из .env файла
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/auth');
const axios = require('axios');
const cors = require('cors'); 
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs'); // Встроенный модуль Node.js для работы с файлами
const {
  calculateXpForLevel,
  calculateUnityXp,
  calculateNewStats,
  getRecommendedReps, // Добавляем импорт этой функции
} = require('./services/gameMechanicsService');

// --- 2. Инициализация ---
const app = express();
const prisma = new PrismaClient(); // Создаем экземпляр Prisma Client
const PORT = 3001;
const upload = multer({ storage: multer.memoryStorage() });

// --- 3. Middleware ---
// Это очень важный middleware. Он говорит Express'у "понимать" JSON.
// Без него мы не сможем прочитать данные, которые приходят от пользователя.
app.use(cors());
app.use(express.json());

// --- 4. Маршруты (API Endpoints) ---

// Наш старый маршрут для проверки, что сервер жив
app.get('/', (req, res) => {
  res.send('Система "Solo Mind" запущена. Добро пожаловать, Пробужденный.');
});

// === НОВЫЙ МАРШРУТ: РЕГИСТРАЦИЯ ПОЛЬЗОВАТЕЛЯ ===
// Мы используем app.post, так как клиент будет ОТПРАВЛЯТЬ (POST) нам данные.
app.post('/auth/signup', async (req, res) => {
  // Используем try...catch для обработки возможных ошибок
  try {
    // 1. Получаем данные из "тела" запроса (req.body)
    const { email, password, name } = req.body;

    // 2. Простая валидация: проверяем, что все поля пришли
    if (!email || !password || !name) {
      // Если чего-то не хватает, отправляем ошибку 400 (Bad Request)
      return res.status(400).json({ message: 'Пожалуйста, заполните все поля' });
    }

    // 3. Проверяем, не занят ли уже этот email
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // 4. Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10); // 10 - это "соль", сложность шифрования

    // 5. Создаем пользователя и его профиль в ОДНОЙ транзакции
    // Это гарантирует, что если что-то пойдет не так, не создастся "одинокий" пользователь без профиля.
    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        // Вложенная запись: одновременно с User создаем связанный с ним Profile
        profile: {
          create: {}, // Создаем профиль со значениями по умолчанию, которые мы задали в schema.prisma
        },
      },
      // Включаем связанный профиль в ответ, чтобы убедиться, что он создался
      include: {
        profile: true,
      },
    });

    // 6. Отправляем успешный ответ
    // Мы не отправляем пароль обратно, даже хешированный!
    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован!',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        profile: newUser.profile,
      },
    });

  } catch (error) {
    // Если произошла любая другая ошибка, отправляем ошибку 500 (Internal Server Error)
    console.error("Ошибка при регистрации:", error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
});

// === НОВЫЙ МАРШРУТ: ЛОГИН ПОЛЬЗОВАТЕЛЯ ===
app.post('/auth/login', async (req, res) => {
    try {
      // 1. Получаем email и пароль из запроса
      const { email, password } = req.body;
  
      if (!email || !password) {
        return res.status(400).json({ message: 'Пожалуйста, введите email и пароль' });
      }
  
      // 2. Ищем пользователя в базе данных
      const user = await prisma.user.findUnique({
        where: { email },
      });
  
      // 3. Если пользователь не найден ИЛИ пароли не совпадают...
      // bcrypt.compare - безопасная функция для сравнения пароля с хешем
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Неверный email или пароль' }); // 401 - Unauthorized
      }
  
      // 4. Если все хорошо, создаем JWT токен ("пропуск")
      const token = jwt.sign(
        { userId: user.id }, // Что мы храним в токене (полезная нагрузка)
        process.env.JWT_SECRET, // Наш секретный ключ из .env
        { expiresIn: '24h' } // Сколько "пропуск" будет действителен
      );
  
      // 5. Отправляем токен пользователю
      res.status(200).json({
        message: 'Вход выполнен успешно!',
        token: token,
        userId: user.id,
        name: user.name,
      });
  
    } catch (error) {
      console.error("Ошибка при входе:", error);
      res.status(500).json({ message: 'Что-то пошло не так на сервере' });
    }
  });


// === НОВЫЙ МАРШРУТ: КАЛИБРОВКА ПОЛЬЗОВАТЕЛЯ ===
  app.post('/auth/calibrate', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { answers } = req.body;
  
      // Простая логика калибровки
      let baseStats = { str: 5, end: 5, agi: 5, int: 5, wis: 5, foc: 5 };
  
      if (answers.q1 === 'Физическая сила') {
        baseStats.str += 3;
        baseStats.end += 2;
      } else { // Сила разума
        baseStats.int += 3;
        baseStats.wis += 2;
      }
  
      if (answers.q2 === 'Взрывная мощь') {
        baseStats.str += 2;
        baseStats.agi += 1;
      } else { // Несгибаемая выносливость
        baseStats.end += 2;
        baseStats.foc += 1;
      }
  
      // Обновляем профиль пользователя с новыми статами
      await prisma.profile.update({
        where: { userId },
        data: {
          statStr: baseStats.str,
          statEnd: baseStats.end,
          statAgi: baseStats.agi,
          statInt: baseStats.int,
          statWis: baseStats.wis,
          statFoc: baseStats.foc,
        },
      });
  
      res.status(200).json({ message: 'Калибровка успешно завершена!' });
  
    } catch (error) {
      console.error("Ошибка калибровки:", error);
      res.status(500).json({ message: 'Что-то пошло не так на сервере' });
    }
  });

  // === ЗАЩИЩЕННЫЕ МАРШРУТЫ ===

// === ЗАЩИЩЕННЫЕ МАРШРУТЫ ===

// Этот маршрут будет доступен только авторизованным пользователям
// v7.0: РЕФАКТОРИНГ - теперь он включает все поля из User и Profile
app.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Ищем профиль пользователя и включаем ВСЕ данные связанного пользователя
    const userWithProfile = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        profile: true, // Включаем все поля из Profile
      },
    });

    if (!userWithProfile || !userWithProfile.profile) {
      return res.status(404).json({ message: 'Профиль не найден' });
    }

    // v7.0: Формируем более удобный ответ для фронтенда,
    // где профиль и пользователь разделены, как ожидает useAuth.js
    const response = {
      ...userWithProfile.profile, // Все поля профиля (level, xp, stats...)
      user: { // Вложенный объект пользователя
          id: userWithProfile.id,
          name: userWithProfile.name,
          email: userWithProfile.email,
          // Самое главное - включаем все новые поля!
          totalMindEffort: userWithProfile.totalMindEffort,
          totalBodyEffort: userWithProfile.totalBodyEffort,
          quizzesPassed: userWithProfile.quizzesPassed,
          approachesCompleted: userWithProfile.approachesCompleted,
          muscleTension: userWithProfile.muscleTension,
      }
    }

    // Отправляем найденный профиль
    res.status(200).json(response);

  } catch (error) {
    console.error("Ошибка при получении профиля (v7.0):", error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
});


// v7.0: Временная база данных упражнений. В будущем это можно вынести в отдельную таблицу в БД.
const exercisesDB = {
  1: { name: 'Отжимания', multiplier: 1.0, group: 'push' },
  2: { name: 'Подтягивания', multiplier: 1.5, group: 'pull' },
  3: { name: 'Приседания', multiplier: 0.8, group: 'legs' },
  // ... можно добавить другие упражнения
};

// === ЭНДПОИНТ ДЛЯ ВЫПОЛНЕНИЯ УПРАЖНЕНИЯ (v7.0 РЕФАКТОРИНГ) ===
// v7.0: Это центральный эндпоинт для прогрессии. Он отвечает за XP, рост статов и левел-апы.
app.post('/activity/exercise', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    // 1. Получаем новые данные от фронтенда
    const { reps, exerciseId, isTrainingMode } = req.body;

    if (!reps || !exerciseId) {
      return res.status(400).json({ message: 'Необходимо указать упражнение и количество повторений.' });
    }

    const exercise = exercisesDB[exerciseId];
    if (!exercise) {
      return res.status(404).json({ message: 'Упражнение не найдено.' });
    }

    // 2. Получаем актуальные данные пользователя и его профиля
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      return res.status(404).json({ message: 'Профиль не найден.' });
    }

    // 3. Проверяем минимальный порог выполнения (только для основного цикла)
    if (!isTrainingMode) {
      const recommendedReps = getRecommendedReps(user.profile.level, user.profile.statEnd);
      const minReps = Math.floor(recommendedReps * 0.3);
      if (reps < minReps) {
        return res.status(400).json({ 
          message: `Для разблокировки чтения нужно выполнить хотя бы 30% от рекомендации (${minReps} повторений).` 
        });
      }
    }

    // 4. Расчеты на основе выполненной работы
    const evBody = reps * exercise.multiplier;
    
    // Готовим данные для обновления. Начинаем с накопления "усилий".
    const userDataToUpdate = {
      totalBodyEffort: { increment: evBody },
      approachesCompleted: { increment: 1 },
    };
    const profileDataToUpdate = {};

    // 5. Логика для основного цикла (не "Режим Тренировки")
    if (!isTrainingMode) {
      // Рассчитываем и добавляем Unity XP
      const unityXpGained = calculateUnityXp(evBody, user.profile);
      profileDataToUpdate.currentXp = user.profile.currentXp + unityXpGained;
      
      // Разблокируем чтение
      profileDataToUpdate.isReadingUnlocked = true;

      // Проверяем левел-ап (цикл while на случай нескольких уровней за раз)
      let currentLevel = user.profile.level;
      let currentXp = profileDataToUpdate.currentXp;
      let xpForNextLevel = calculateXpForLevel(currentLevel);

      while (currentXp >= xpForNextLevel) {
        currentLevel++;
        currentXp -= xpForNextLevel;
        xpForNextLevel = calculateXpForLevel(currentLevel);
      }
      profileDataToUpdate.level = currentLevel;
      profileDataToUpdate.currentXp = currentXp;
    }

    // 6. Обновляем "Напряжение Мышц"
    const muscleTension = user.muscleTension || {};
    const trainedGroup = exercise.group;
    // TODO: В будущем здесь можно добавить логику штрафа к XP, если muscleTension[trainedGroup] > порога
    muscleTension[trainedGroup] = (muscleTension[trainedGroup] || 0) + evBody;
    userDataToUpdate.muscleTension = muscleTension;

    // 7. Рассчитываем и обновляем все статы
    // Создаем временный объект с уже обновленными "усилиями" для корректного расчета
    const tempUpdatedUser = {
      ...user,
      totalBodyEffort: user.totalBodyEffort + evBody,
      approachesCompleted: user.approachesCompleted + 1,
    };
    const newStats = calculateNewStats(tempUpdatedUser);
    Object.assign(profileDataToUpdate, newStats);

    // 8. Сохраняем все изменения в базу данных в одной транзакции
    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: userDataToUpdate }),
      prisma.profile.update({ where: { userId }, data: profileDataToUpdate }),
    ]);

    // 9. v7.0 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Отправляем "очищенный" результат на фронтенд
    res.status(200).json({
      message: 'Упражнение выполнено, прогресс сохранен!',
      updatedProfile: updatedProfile, // Профиль безопасен для отправки
      updatedUser: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        totalMindEffort: updatedUser.totalMindEffort,
        totalBodyEffort: updatedUser.totalBodyEffort,
        quizzesPassed: updatedUser.quizzesPassed,
        approachesCompleted: updatedUser.approachesCompleted,
        muscleTension: updatedUser.muscleTension,
      },
    });

  } catch (error) {
    console.error("Ошибка в /activity/exercise (v7.0):", error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
});
  // === ЭНДПОИНТ ДЛЯ ГЕНЕРАЦИИ ТЕСТА С ПОМОЩЬЮ AI ===
app.post('/ai/generate-quiz', authMiddleware, async (req, res) => {
    try {
      const { text } = req.body; // Получаем текст от пользователя
  
      if (!text || text.trim().length < 50) { // Проверяем, что текст не слишком короткий
        return res.status(400).json({ message: 'Текст для анализа должен содержать минимум 50 символов.' });
      }
  
      // --- Формируем промпт для DeepSeek ---
      const prompt = `
        Проанализируй следующий текст. На его основе сгенерируй 1 вопрос для теста с 4 вариантами ответа. 
        Один из вариантов должен быть правильным.
        Верни результат СТРОГО в формате JSON, без каких-либо других слов или объяснений.
        Пример формата: {"question": "Текст вопроса?", "options": ["Вариант А", "Вариант Б", "Вариант В", "Правильный ответ Г"], "correctAnswer": "Правильный ответ Г"}
  
        Текст для анализа:
        ---
        ${text}
        ---
      `;
  
      // --- Отправляем запрос к API DeepSeek ---
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions', // URL эндпоинта DeepSeek
        {
          model: 'llama3-8b-8192', // или 'deepseek-coder'
          messages: [
            { role: 'system', content: 'ы — полезный ассистент, который создает тесты СТРОГО в формате JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2, // Низкая температура для более предсказуемого результата
          max_tokens: 500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}` // Используем наш ключ
          }
        }
      );
  
      // --- Обрабатываем ответ от AI ---
      // Ответ от AI обычно находится в response.data.choices[0].message.content
      const aiResponseContent = response.data.choices[0].message.content;
      
      // Пытаемся распарсить JSON из ответа AI
      const quizJson = JSON.parse(aiResponseContent);
  
      // Отправляем готовый JSON на фронтенд
      res.status(200).json(quizJson);
  
    } catch (error) {
      // Умная обработка ошибок
      if (error.response) {
        // Ошибка пришла от сервера DeepSeek (неправильный ключ, кончились кредиты и т.д.)
        console.error("Ошибка от API DeepSeek:", error.response.data);
        res.status(500).json({ message: 'Ошибка при обращении к AI сервису.', details: error.response.data });
      } else if (error instanceof SyntaxError) {
        // Ошибка, если AI вернул невалидный JSON
        console.error("AI вернул невалидный JSON:", error);
        res.status(500).json({ message: 'AI сервис вернул ответ в неправильном формате.' });
      } else {
        // Любая другая ошибка
        console.error("Общая ошибка в /ai/generate-quiz:", error);
        res.status(500).json({ message: 'Что-то пошло не так на сервере.' });
      }
    }
  });
  
// === ЭНДПОИНТ ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЯ И OCR (v7.0 РЕФАКТОРИНГ) ===
app.post('/ocr/upload-and-process', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'Файл не был загружен.' });
    }

    // 1. OCR.space
    const formData = new FormData();
    formData.append('language', 'rus');
    formData.append('apikey', process.env.OCR_SPACE_API_KEY);
    formData.append('file', req.file.buffer, { filename: req.file.originalname });

    const ocrResponse = await axios.post('https://api.ocr.space/parse/image', formData, { headers: formData.getHeaders() });

    if (ocrResponse.data.IsErroredOnProcessing || !ocrResponse.data.ParsedResults?.[0]?.ParsedText) {
      return res.status(500).json({ message: 'Ошибка при распознавании текста или текст пуст.', details: ocrResponse.data.ErrorMessage });
    }
    const recognizedText = ocrResponse.data.ParsedResults[0].ParsedText;

    // 2. Обновление "Усилия Разума"
    const mindEffortGained = recognizedText.length / 10;
    await prisma.user.update({
      where: { id: userId },
      data: { totalMindEffort: { increment: mindEffortGained } },
    });

    // 3. Groq (Llama 3)
    const prompt = `
      Проанализируй следующий текст. На его основе сгенерируй 1 вопрос для теста с 4 вариантами ответа. 
      Один из вариантов должен быть правильным.
      Верни результат СТРОГО в формате JSON, без каких-либо других слов или объяснений.
      Пример формата: {"question": "Текст вопроса?", "options": ["Вариант А", "Вариант Б", "Вариант В", "Правильный ответ Г"], "correctAnswer": "Правильный ответ Г"}
      Текст для анализа:
      ---
      ${recognizedText}
      ---
    `;

    const groqResponse = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        // v7.0 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Убираем response_format, так как он может вызывать ошибку.
      },
      { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    // 4. v7.0 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: "Умный" парсинг JSON
    let aiResponseContent = groqResponse.data.choices[0].message.content;
    
    // Ищем начало и конец JSON в ответе AI
    const firstBracket = aiResponseContent.indexOf('{');
    const lastBracket = aiResponseContent.lastIndexOf('}');

    if (firstBracket === -1 || lastBracket === -1) {
        throw new Error("AI не вернул валидный JSON объект.");
    }

    const jsonString = aiResponseContent.substring(firstBracket, lastBracket + 1);
    const quizJson = JSON.parse(jsonString);

    // 5. Отправляем готовый квиз на фронтенд
    res.status(200).json(quizJson);

  } catch (error) {
    console.error("Полная ошибка в /ocr/upload-and-process:", error);
    if (error.response) {
        console.error("Данные ошибки от внешнего API:", error.response.data);
    }
    res.status(500).json({ message: 'Что-то пошло не так на сервере при обработке файла.' });
  }
});

// === ЭНДПОИНТ ДЛЯ ПРОВЕРКИ ОТВЕТА НА КВИЗ (v7.0 РЕФАКТОРИНГ) ===
// v7.0: Этот эндпоинт больше не начисляет XP. Он только проверяет ответ,
// увеличивает счетчик квизов для роста Мудрости (WIS) и блокирует чтение до выполнения упражнения.
// === ЭНДПОИНТ ДЛЯ ПРОВЕРКИ ОТВЕТА НА КВИЗ (v7.0 ФИНАЛЬНЫЙ РЕФАКТОРИНГ) ===
app.post('/activity/submit-quiz', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { userAnswer, correctAnswer } = req.body;

    if (userAnswer !== correctAnswer) {
      return res.status(200).json({ success: false, message: 'Ответ неверный. Попробуйте в следующий раз.' });
    }

    const [updatedUser, updatedProfile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { quizzesPassed: { increment: 1 } },
      }),
      prisma.profile.update({
        where: { userId },
        data: { isReadingUnlocked: false },
      }),
    ]);

    // v7.0 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ: Отправляем "очищенный" объект пользователя, без пароля и лишних полей.
    // Это безопасно и предотвращает ошибки сериализации.
    res.status(200).json({
      success: true,
      message: 'Верно! Знания усвоены. Теперь выполните физическое упражнение.',
      updatedProfile: updatedProfile, // Профиль не содержит секретных данных, его можно отправлять целиком.
      updatedUser: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        totalMindEffort: updatedUser.totalMindEffort,
        totalBodyEffort: updatedUser.totalBodyEffort,
        quizzesPassed: updatedUser.quizzesPassed,
        approachesCompleted: updatedUser.approachesCompleted,
        muscleTension: updatedUser.muscleTension,
      },
    });

  } catch (error) {
    console.error("Ошибка в /activity/submit-quiz (v7.0):", error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
});
  


// --- 5. Запуск сервера ---
app.listen(PORT, () => {
  console.log(`Бэкенд-сервер успешно запущен на порту ${PORT}`);
});