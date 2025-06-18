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

  // === ЗАЩИЩЕННЫЕ МАРШРУТЫ ===

// Этот маршрут будет доступен только авторизованным пользователям
app.get('/profile', authMiddleware, async (req, res) => {
    try {
      // Благодаря authMiddleware, у нас теперь есть req.user.userId
      const userId = req.user.userId;
  
      // Ищем профиль пользователя в базе данных, включая все его характеристики
      const userProfile = await prisma.profile.findUnique({
        where: {
          userId: userId,
        },
        // Мы также можем включить данные самого пользователя, если они нужны
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
  
      if (!userProfile) {
        return res.status(404).json({ message: 'Профиль не найден' });
      }
  
      // Отправляем найденный профиль
      res.status(200).json(userProfile);
  
    } catch (error) {
      console.error("Ошибка при получении профиля:", error);
      res.status(500).json({ message: 'Что-то пошло не так на сервере' });
    }
  });


// === ЭНДПОИНТ ДЛЯ ИМИТАЦИИ ВЫПОЛНЕНИЯ УПРАЖНЕНИЯ ===
app.post('/activity/exercise', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { exerciseName } = req.body; // Ожидаем, что клиент пришлет название упражнения
  
      if (!exerciseName) {
        return res.status(400).json({ message: 'Необходимо указать название упражнения' });
      }
  
      // --- 1. Рассчитываем награду ---
      // Пока сделаем простую логику. В будущем ее можно усложнить.
      const xpGained = 25; // Даем 25 очков опыта
      const strGained = 1; // Даем +1 к силе
  
      // --- 2. Находим текущий профиль пользователя ---
      const currentProfile = await prisma.profile.findUnique({ where: { userId } });
  
      if (!currentProfile) {
        return res.status(404).json({ message: 'Профиль не найден' });
      }
  
      // --- 3. Обновляем профиль и создаем запись в логе в ОДНОЙ ТРАНЗАКЦИИ ---
      // Это гарантирует, что оба действия либо выполнятся, либо нет.
      const [updatedProfile] = await prisma.$transaction([
        // Действие 1: Обновить профиль
        prisma.profile.update({
          where: { userId },
          data: {
            currentXp: currentProfile.currentXp + xpGained,
            statStr: currentProfile.statStr + strGained,
            isReadingUnlocked: true,
          },
          include: { // <--- ДОБАВЛЯЕМ ЭТОТ БЛОК
            user: {
              select: {
                name: true,
              },
            },
          },
        
        }),
        // Действие 2: Записать в лог
        prisma.activityLog.create({
          data: {
            userId: userId,
            activityType: 'exercise_done',
            description: `Выполнено: ${exerciseName}`,
            xpGained: xpGained,
            statAffected: 'STR',
          },
        }),
      ]);
  
      // --- 4. Проверяем, не достиг ли пользователь нового уровня ---
      // Эту логику пока вынесем сюда. В будущем ее можно будет сделать отдельной функцией.
      let finalProfile = updatedProfile;
      if (updatedProfile.currentXp >= updatedProfile.xpToNextLevel) {
        finalProfile = await prisma.profile.update({
          where: { userId },
          data: {
            level: updatedProfile.level + 1,
            currentXp: updatedProfile.currentXp - updatedProfile.xpToNextLevel, // Переносим излишки
            xpToNextLevel: Math.floor(updatedProfile.xpToNextLevel * 1.5), // Увеличиваем порог
          },
          include: { // <--- ДОБАВЛЯЕМ ЭТОТ БЛОК
            user: {
              select: {
                name: true,
              },
            },
          },
        
        });
      }
  
      // --- 5. Отправляем финальный, обновленный профиль ---
      res.status(200).json({ message: 'Активность записана, статы обновлены!', profile: finalProfile });
  
    } catch (error) {
      console.error("Ошибка при записи активности:", error);
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
  
  // === ЭНДПОИНТ ДЛЯ ЗАГРУЗКИ ИЗОБРАЖЕНИЯ И OCR ===
// Обрати внимание на upload.single('image'), он говорит multer'у ожидать один файл с именем 'image'
app.post('/ocr/upload-and-process', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    // 1. Проверяем, что файл был загружен
    if (!req.file) {
      return res.status(400).json({ message: 'Файл не был загружен.' });
    }

    // 2. Готовим данные для отправки в OCR.space
    const formData = new FormData();
    formData.append('language', 'rus'); // Указываем язык
    formData.append('isOverlayRequired', 'false');
    formData.append('apikey', process.env.OCR_SPACE_API_KEY);
    // Добавляем файл из памяти
    formData.append('file', req.file.buffer, { filename: req.file.originalname });

    // 3. Отправляем запрос в OCR.space
    console.log('Отправка запроса в OCR.space...');
    const ocrResponse = await axios.post(
      'https://api.ocr.space/parse/image',
      formData,
      { headers: formData.getHeaders() }
    );
    console.log('Ответ от OCR.space получен.');
  
    if (ocrResponse.data.IsErroredOnProcessing) {
      return res.status(500).json({ message: 'Ошибка при распознавании текста', details: ocrResponse.data.ErrorMessage });
    }

    const recognizedText = ocrResponse.data.ParsedResults[0].ParsedText;
    console.log('Текст распознан. Длина:', recognizedText.length);

    // 4. Теперь у нас есть распознанный текст!
    // Дальше мы можем использовать нашу уже существующую логику для генерации квиза.
    // (В будущем этот блок можно вынести в отдельную функцию, чтобы не дублировать код)
    
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
      },
      { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    const quizJson = JSON.parse(groqResponse.data.choices[0].message.content);

    // 5. Отправляем готовый квиз на фронтенд
    res.status(200).json(quizJson);

  } catch (error) {
    console.error("Ошибка в /ocr/upload-and-process:", error.message);
    res.status(500).json({ message: 'Что-то пошло не так на сервере.' });
  }
});

// === ЭНДПОИНТ ДЛЯ ПРОВЕРКИ ОТВЕТА НА КВИЗ И ПРОКАЧКИ РАЗУМА ===
app.post('/activity/submit-quiz', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    // Ожидаем от фронтенда ответ пользователя и правильный ответ для сверки
    const { userAnswer, correctAnswer } = req.body;

    if (userAnswer !== correctAnswer) {
      // Если ответ неверный, просто сообщаем об этом без начисления XP
      return res.status(200).json({ success: false, message: 'Ответ неверный. Попробуйте в следующий раз.' });
    }

    // --- Ответ верный! Начисляем награду ---
    const xpGained = 35; // Даем больше, чем за упражнения, т.к. это сложнее
    const intGained = 1;
    const wisGained = 1;

    const currentProfile = await prisma.profile.findUnique({ where: { userId } });

    if (!currentProfile) {
      return res.status(404).json({ message: 'Профиль не найден' });
    }

    // Обновляем профиль и лог в одной транзакции
    const [updatedProfile] = await prisma.$transaction([
      prisma.profile.update({
        where: { userId },
        data: {
          currentXp: currentProfile.currentXp + xpGained,
          statInt: currentProfile.statInt + intGained,
          statWis: currentProfile.statWis + wisGained,
          isReadingUnlocked: false,
        },
        include: { // <--- ДОБАВЛЯЕМ ЭТОТ БЛОК
          user: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: userId,
          activityType: 'quiz_passed',
          description: 'Пройден тест на знания',
          xpGained: xpGained,
          statAffected: 'INT/WIS',
        },
      }),
    ]);

    // Проверяем левел-ап (эту логику точно нужно будет вынести в отдельную функцию в будущем)
    let finalProfile = updatedProfile;
    if (updatedProfile.currentXp >= updatedProfile.xpToNextLevel) {
      finalProfile = await prisma.profile.update({
        where: { userId },
        data: {
          level: updatedProfile.level + 1,
          currentXp: updatedProfile.currentXp - updatedProfile.xpToNextLevel,
          xpToNextLevel: Math.floor(updatedProfile.xpToNextLevel * 1.5),
        },
      });
    }

    res.status(200).json({ 
      success: true, 
      message: `Верно! +${xpGained} XP!`, 
      profile: finalProfile 
    });

  } catch (error) {
    console.error("Ошибка в /activity/submit-quiz:", error);
    res.status(500).json({ message: 'Что-то пошло не так на сервере' });
  }
});
  


// --- 5. Запуск сервера ---
app.listen(PORT, () => {
  console.log(`Бэкенд-сервер успешно запущен на порту ${PORT}`);
});