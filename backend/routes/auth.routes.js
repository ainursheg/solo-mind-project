// backend/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Маршрут для регистрации
// POST /auth/signup
router.post('/signup', authController.signup);

// Маршрут для входа в систему
// POST /auth/login
router.post('/login', authController.login);

module.exports = router;