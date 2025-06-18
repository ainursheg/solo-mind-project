const jwt = require('jsonwebtoken');

// Наш middleware-охранник
const authMiddleware = (req, res, next) => {
  // 1. Ищем токен. Обычно его присылают в заголовке Authorization в формате "Bearer <token>"
  const authHeader = req.headers.authorization;

  // 2. Если заголовка нет или он не в правильном формате, отказываем в доступе
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Доступ запрещен. Токен не предоставлен.' });
  }

  // 3. Извлекаем сам токен, отрезая "Bearer "
  const token = authHeader.split(' ')[1];

  try {
    // 4. Проверяем токен. jwt.verify делает всю магию:
    //    - Проверяет, что токен не подделан (с помощью нашего JWT_SECRET)
    //    - Проверяет, что срок действия токена не истек
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Если токен валидный, мы добавляем информацию о пользователе (его ID)
    //    прямо в объект запроса (req). Теперь все следующие обработчики
    //    будут знать, какой пользователь сделал этот запрос.
    req.user = { userId: decoded.userId };

    // 6. Вызываем next(), чтобы передать управление следующему обработчику в цепочке (нашему маршруту)
    next();
  } catch (error) {
    // Если jwt.verify выдает ошибку (невалидный токен), отказываем в доступе
    res.status(401).json({ message: 'Невалидный токен.' });
  }
};

module.exports = authMiddleware; // Экспортируем нашего охранника, чтобы использовать его в index.js