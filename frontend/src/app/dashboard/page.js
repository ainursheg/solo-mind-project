'use client';

import Dashboard from "@/components/Dashboard";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Загрузка...</p></div>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Dashboard />
    </main>
  );
}