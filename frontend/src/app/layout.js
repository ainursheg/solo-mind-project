// # Добавляем GameProvider в корневой макет
// src/app/layout.js

import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { GameProvider } from "@/context/GameContext"; // Импортируем новый провайдер
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Solo Mind Project",
  description: "Прокачай себя, как героя в RPG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
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