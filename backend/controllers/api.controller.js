// backend/controllers/api.controller.js

const { PrismaClient } = require('../generated/prisma');
const axios = require('axios');
const FormData = require('form-data');
const {
  calculateXpForLevel,
  calculateUnityXp,
  calculateNewStats,
  getRecommendedReps,
} = require('../services/gameMechanicsService');

const prisma = new PrismaClient();

// --- Получение профиля пользователя ---
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userWithProfile = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!userWithProfile || !userWithProfile.profile) {
      return res.status(404).json({ message: 'Профиль не найден' });
    }

    const response = {
      ...userWithProfile.profile,
      user: {
        id: userWithProfile.id,
        name: userWithProfile.name,
        email: userWithProfile.email,
        totalMindEffort: userWithProfile.totalMindEffort,
        totalBodyEffort: userWithProfile.totalBodyEffort,
        quizzesPassed: userWithProfile.quizzesPassed,
        approachesCompleted: userWithProfile.approachesCompleted,
        muscleTension: userWithProfile.muscleTension,
      }
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// --- Получение списка упражнений ---
const getExercises = async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany();
    res.status(200).json(exercises);
  } catch (error) {
    next(error);
  }
};

// --- Обработка выполнения упражнения ---
const handleExercise = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { reps, exerciseId, isTrainingMode } = req.body;

        if (!reps || !exerciseId) {
            return res.status(400).json({ message: 'Необходимо указать упражнение и количество повторений.' });
        }

        const exercise = await prisma.exercise.findUnique({
            where: { id: parseInt(exerciseId, 10) }
        });

        if (!exercise) {
            return res.status(404).json({ message: 'Упражнение не найдено.' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });

        if (!user || !user.profile) {
            return res.status(404).json({ message: 'Профиль не найден.' });
        }

        if (!isTrainingMode) {
            const recommendedReps = getRecommendedReps(user.profile.level, user.profile.statEnd);
            const minReps = Math.floor(recommendedReps * 0.3);
            if (reps < minReps) {
                return res.status(400).json({
                    message: `Для разблокировки чтения нужно выполнить хотя бы 30% от рекомендации (${minReps} повторений).`
                });
            }
        }

        const evBody = reps * exercise.multiplier;
        const userDataToUpdate = {
            totalBodyEffort: { increment: evBody },
            approachesCompleted: { increment: 1 },
        };
        const profileDataToUpdate = {};

        if (!isTrainingMode) {
            const unityXpGained = calculateUnityXp(evBody, user.profile);
            profileDataToUpdate.currentXp = user.profile.currentXp + unityXpGained;
            profileDataToUpdate.isReadingUnlocked = true;
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

        const muscleTension = user.muscleTension || {};
        const trainedGroup = exercise.group;
        muscleTension[trainedGroup] = (muscleTension[trainedGroup] || 0) + evBody;
        userDataToUpdate.muscleTension = muscleTension;

        const tempUpdatedUser = {
            ...user,
            totalBodyEffort: user.totalBodyEffort + evBody,
            approachesCompleted: user.approachesCompleted + 1,
        };
        const newStats = calculateNewStats(tempUpdatedUser);
        Object.assign(profileDataToUpdate, newStats);

        const [updatedUser, updatedProfile] = await prisma.$transaction([
            prisma.user.update({ where: { id: userId }, data: userDataToUpdate }),
            prisma.profile.update({ where: { userId }, data: profileDataToUpdate }),
        ]);

        res.status(200).json({
            message: 'Упражнение выполнено, прогресс сохранен!',
            updatedProfile: updatedProfile,
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
        next(error);
    }
};

// --- Загрузка и распознавание изображения ---
const uploadAndProcess = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (!req.file) {
            return res.status(400).json({ message: 'Файл не был загружен.' });
        }
        const formData = new FormData();
        formData.append('language', 'rus');
        formData.append('apikey', process.env.OCR_SPACE_API_KEY);
        formData.append('file', req.file.buffer, { filename: req.file.originalname });
        const ocrResponse = await axios.post('https://api.ocr.space/parse/image', formData, { headers: formData.getHeaders() });
        if (ocrResponse.data.IsErroredOnProcessing || !ocrResponse.data.ParsedResults?.[0]?.ParsedText) {
            return res.status(500).json({ message: 'Ошибка при распознавании текста или текст пуст.', details: ocrResponse.data.ErrorMessage });
        }
        const recognizedText = ocrResponse.data.ParsedResults[0].ParsedText;
        const mindEffortGained = recognizedText.length / 10;
        await prisma.user.update({
            where: { id: userId },
            data: { totalMindEffort: { increment: mindEffortGained } },
        });
        const prompt = `Проанализируй следующий текст. На его основе сгенерируй 1 вопрос для теста с 4 вариантами ответа. Один из вариантов должен быть правильным. Верни результат СТРОГО в формате JSON, без каких-либо других слов или объяснений. Пример формата: {"question": "Текст вопроса?", "options": ["Вариант А", "Вариант Б", "Вариант В", "Правильный ответ Г"], "correctAnswer": "Правильный ответ Г"} Текст для анализа:\n---\n${recognizedText}\n---`;
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
        }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } });
        let aiResponseContent = groqResponse.data.choices[0].message.content;
        const firstBracket = aiResponseContent.indexOf('{');
        const lastBracket = aiResponseContent.lastIndexOf('}');
        if (firstBracket === -1 || lastBracket === -1) {
            throw new Error("AI не вернул валидный JSON объект.");
        }
        const jsonString = aiResponseContent.substring(firstBracket, lastBracket + 1);
        const quizJson = JSON.parse(jsonString);
        res.status(200).json(quizJson);
    } catch (error) {
        next(error);
    }
};

// --- Проверка ответа на квиз ---
const submitQuiz = async (req, res) => {
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
        res.status(200).json({
            success: true,
            message: 'Верно! Знания усвоены. Теперь выполните физическое упражнение.',
            updatedProfile: updatedProfile,
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
        next(error);
    }
};


module.exports = {
  getProfile,
  getExercises,
  handleExercise,
  uploadAndProcess,
  submitQuiz,
};