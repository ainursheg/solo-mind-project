// # Добавляем GameProvider в корневой макет
// src/app/layout.js

import { Orbitron, Poppins } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { GameProvider } from "@/context/GameContext"; // Импортируем новый провайдер
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

// Настройка основного шрифта (для текста)
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"], // Загружаем несколько начертаний
  variable: "--font-poppins", // Задаем CSS-переменную
});

// Настройка дисплейного шрифта (для заголовков)
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-orbitron", // Задаем CSS-переменную
});

export const metadata = {
  title: "Solo Mind Project",
  description: "Прокачай себя, как героя в RPG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Применяем переменные шрифтов ко всему приложению */}
      <body className={`${poppins.variable} ${orbitron.variable} bg-background-primary text-text-primary font-sans`}>
        <AuthProvider>
          <GameProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
          </GameProvider>
        </AuthProvider>
      </body>
    </html>
  );
}