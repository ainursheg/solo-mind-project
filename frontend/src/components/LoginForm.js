// components/LoginForm.js
"use client";

import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await auth.login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Произошла ошибка при входе');
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary rounded-2xl shadow-xl text-text-primary border border-accent-primary/20">
      <h1 className="text-3xl font-display font-bold text-center">Вход в Solo Mind</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email</label>
          <input 
            id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required 
            className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-secondary">Пароль</label>
          <input 
            id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required 
            className="mt-1 block w-full px-3 py-2 bg-background-primary border border-text-secondary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent transition"
          />
        </div>
        
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        
        <div>
          <button 
            type="submit" disabled={auth.loading} 
            className="
              w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-accent-primary shadow-lg 
              transition-all duration-300 ease-in-out
              hover:shadow-glow-primary hover:-translate-y-0.5
              disabled:bg-background-secondary disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
            "
          >
            {auth.loading ? 'Вход...' : 'Войти'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;