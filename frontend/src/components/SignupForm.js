// components/SignupForm.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';

export default function SignupForm() {
    const router = useRouter(); 
    const auth = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post('http://localhost:3001/auth/signup', { name, email, password });
            await auth.login(email, password);
            router.push('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Не удалось подключиться к серверу');
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary rounded-2xl shadow-xl text-text-primary border border-accent-secondary/20">
        <h1 className="text-3xl font-display font-bold text-center">Создать Аккаунт</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Имя Героя</label>
            <input
              id="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-secondary focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email</label>
            <input
              id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-secondary focus:border-transparent transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">Пароль</label>
            <input
              id="password" type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-secondary focus:border-transparent transition"
            />
          </div>

          {error && <p className="text-sm text-danger text-center">{error}</p>}

          <div>
            <button
              type="submit" disabled={loading}
              className="
                w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-accent-secondary shadow-lg 
                transition-all duration-300 ease-in-out
                hover:shadow-glow-primary hover:-translate-y-0.5
                disabled:bg-background-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
              "
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    );
}