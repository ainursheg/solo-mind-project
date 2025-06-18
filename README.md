# Проект "Solo Mind" (v0.2.0 - MVP)

Это Full-Stack веб-приложение для геймификации саморазвития, вдохновленное "Solo Leveling". Пользователь прокачивает свои реальные навыки, выполняя квесты в приложении.

---

## 1. Технологический Стек

*   **Frontend:** React, Next.js, Tailwind CSS, axios
*   **Backend:** Node.js, Express, Prisma, PostgreSQL
*   **Внешние API:**
    *   **OCR:** OCR.space (для распознавания текста с изображений)
    *   **AI/LLM:** Groq (модель Llama 3 для генерации квизов)

---

## 2. Структура Проекта

```
solo-mind-project/
├── backend/ # Бэкенд-сервер на Express
│ ├── prisma/ # Схема и миграции базы данных
│ ├── middleware/ # Middleware (auth.js)
│ ├── .env # Секретные ключи
│ └── index.js # Главный файл сервера
├── frontend/ # Фронтенд-приложение на Next.js
│ ├── src/
│ │ ├── app/ # Страницы и роутинг
│ │ ├── components/ # React-компоненты
│ │ └── hooks/ # React-хуки (useAuth.js)
└── README.md # Этот файл
```

---

## 3. Модели Данных (Схема Prisma)

```

// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// === НАША МОДЕЛЬ ДАННЫХ ===

// Модель Пользователя (для аутентификации)
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?  // Знак '?' означает, что поле необязательное

  // Связь: один User может иметь один Profile
  profile   Profile?
  
  // Связь: один User может иметь много записей в логе
  activities ActivityLog[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Модель Профиля Героя (игровые данные)
model Profile {
  id        Int      @id @default(autoincrement())
  level     Int      @default(1)
  currentXp Int      @default(0)
  xpToNextLevel Int  @default(100)
  
  statStr   Int      @default(5)
  statEnd   Int      @default(5)
  statAgi   Int      @default(5)
  statInt   Int      @default(5)
  statWis   Int      @default(5)
  statFoc   Int      @default(5)

  isReadingUnlocked Boolean @default(true)

  // Связь с пользователем (один-к-одному)
  user      User     @relation(fields: [userId], references: [id])
  userId    Int      @unique // ID пользователя, к которому привязан этот профиль
}

// Модель для записи всех действий пользователя
model ActivityLog {
  id        Int      @id @default(autoincrement())
  activityType String
  description  String
  xpGained     Int
  statAffected String?

  // Связь с пользователем (многие-к-одному)
  user      User     @relation(fields: [userId], references: [id])
  userId    Int

  createdAt DateTime @default(now())
}

```


 ---

   ## 4. API Эндпоинты (Карта Бэкенда)

   ### Аутентификация

   *   `POST /auth/signup` - Регистрация нового пользователя.
   *   `POST /auth/login` - Вход пользователя, возвращает JWT токен.

   ### Защищенные маршруты (требуют `Authorization: Bearer <token>`)

  *   `GET /profile` - Получение профиля текущего пользователя.
  *   `POST /activity/exercise` - Запись о выполнении упражнения, прокачка Тела, разблокировка чтения.
  *   `POST /ocr/upload-and-process` - Загрузка изображения, OCR, генерация квиза.
  *   `POST /activity/submit-quiz` - Проверка ответа на квиз, прокачка Разума, блокировка чтения.

  ---

   ## 5. Основной Игровой Цикл

   1.  Пользователь на дэшборде. `isReadingUnlocked = true`.
    2.  Он загружает изображение с текстом (`/ocr/upload-and-process`).
    3.  Система возвращает квиз.
    4.  Пользователь отвечает на квиз (`/activity/submit-quiz`).
    5.  При правильном ответе:
        *   Начисляется XP для Разума (INT, WIS).
        *   Проверяется левел-ап.
        *   В профиле устанавливается `isReadingUnlocked = false`.
    6.  Интерфейс меняется, показывая "Врата Выносливости".
    7.  Пользователь выполняет упражнение (`/activity/exercise`).
    8.  Начисляется XP для Тела (STR, END).
    9.  В профиле устанавливается `isReadingUnlocked = true`.
    10. Интерфейс возвращается к возможности загружать изображение. Цикл завершен.

   ---

   ## 6. Как запустить проект локально

   

  1.  **Настройка Бэкенда:**
        *   `cd backend`
        *   `npm install`
        *   Создать файл `.env` по шаблону.
        *   `npx prisma migrate dev`
        *   `npm run dev` (запустится на `localhost:3001`)         
  2.  **Настройка Фронтенда:**
        *   `cd frontend`
        *   `npm install`
        *   `npm run dev` (запустится на `localhost:3000`)
   
