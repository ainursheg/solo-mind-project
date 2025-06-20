// backend/controllers/auth.controller.js

const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// --- Контроллер для регистрации ---
const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Пожалуйста, заполните все поля' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

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
    next(error);
  }
};

// --- Контроллер для логина ---
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Пожалуйста, введите email и пароль' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Вход выполнен успешно!',
      token: token,
      userId: user.id,
      name: user.name,
    });

  } catch (error) {
    next(error);
  }
};

// Экспортируем функции, чтобы их можно было использовать в роутах
module.exports = {
  signup,
  login,
};