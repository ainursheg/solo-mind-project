'use client';

import SignupForm from "@/components/SignupForm";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Загрузка...</p></div>;
  }
  
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white">Создать Героя</h1>
        <p className="text-lg text-gray-400 mt-2">Пройди регистрацию и начни свой путь</p>
      </div>
      <SignupForm />
    </main>
  );
}