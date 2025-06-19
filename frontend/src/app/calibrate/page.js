'use client';
import CalibrationForm from '@/components/CalibrationForm';
import { useAuth } from '@/hooks/useAuth';

export default function CalibrationPage() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Загрузка...</p></div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">Обряд Инициации</h1>
        <p className="text-lg text-gray-400 mt-2">Система сканирует твои параметры...</p>
      </div>
      <CalibrationForm />
    </main>
  );
}