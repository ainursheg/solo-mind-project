import "./globals.css";

export const metadata = {
  title: "Solo Mind",
  description: "Прокачай себя, как героя в RPG",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}