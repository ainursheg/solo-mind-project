// backend/routes/api.routes.js

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Импортируем контроллер и middleware
const apiController = require('../controllers/api.controller');
const authMiddleware = require('../middleware/auth');

// Инициализируем multer для загрузки файлов в память
const upload = multer({ storage: multer.memoryStorage() });

// --- Маршруты API ---

// GET /api/profile
router.get('/profile', authMiddleware, apiController.getProfile);

// GET /api/exercises
router.get('/exercises', authMiddleware, apiController.getExercises);

// POST /api/activity/exercise
router.post('/activity/exercise', authMiddleware, apiController.handleExercise);

// POST /api/activity/submit-quiz
router.post('/activity/submit-quiz', authMiddleware, apiController.submitQuiz);

// POST /api/ocr/upload-and-process
router.post(
  '/ocr/upload-and-process',
  authMiddleware,
  upload.single('image'), // Применяем два middleware
  apiController.uploadAndProcess
);

module.exports = router;