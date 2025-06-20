/**
 * Централизованный middleware для обработки ошибок.
 * Express распознает его как обработчик ошибок благодаря четырем аргументам.
 * @param {Error} err - Объект ошибки, переданный из `next(err)`.
 * @param {import('express').Request} req - Объект запроса Express.
 * @param {import('express').Response} res - Объект ответа Express.
 * @param {import('express').NextFunction} next - Функция для вызова следующего middleware.
 */
const errorHandler = (err, req, res, next) => {
  // Логируем ошибку для отладки. err.stack дает больше информации, чем err.message.
  console.error(err.stack || err);

  // Отправляем стандартизированный ответ клиенту
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера. Что-то пошло не так.',
  });
};

module.exports = errorHandler;