'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LoginFormProps {
  type: 'customer' | 'admin';
}

export default function LoginForm({ type }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = type === 'admin' 
      ? '/api/v1/auth/admin/login' 
      : '/api/v1/auth/customer/login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', type);
        
        if (type === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(data.error || 'AUTHENTICATION FAILED');
      }
    } catch (err) {
      setError('SYSTEM ERROR: UNEXPECTED FAILURE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.01)] backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 transition-all duration-300">
      <div className="mb-10">
        <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-300 dark:text-zinc-600 mb-2">
          {type === 'admin' ? 'Administrative Access' : 'Customer Portal'}
        </h2>
        <h1 className="text-2xl font-light text-zinc-600 dark:text-zinc-200">
          Sign In
        </h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 text-[9px] font-bold tracking-widest text-zinc-600 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 border-l-2 border-zinc-300 dark:border-zinc-600">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Identification
          </label>
          <input
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-0 py-3 bg-transparent border-b border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-colors text-sm rounded-none placeholder:text-zinc-200 dark:placeholder:text-zinc-700"
            placeholder={type === 'admin' ? "USERNAME OR EMAIL" : "EMAIL ADDRESS"}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Security Key
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-0 py-3 bg-transparent border-b border-zinc-100 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 focus:border-zinc-300 dark:focus:border-zinc-500 outline-none transition-colors text-sm rounded-none placeholder:text-zinc-200 dark:placeholder:text-zinc-700 pr-10"
              placeholder="PASSWORD"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-4 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all disabled:opacity-50 rounded-none shadow-sm active:translate-y-[1px] active:shadow-none"
        >
          {loading ? 'WAIT...' : 'Verify Identity'}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-zinc-50 dark:border-zinc-800 text-center space-y-4">
        {type === 'customer' && (
          <div>
            <Link 
              href="/register"
              className="text-[9px] font-bold tracking-[0.2em] uppercase text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors"
            >
              No account? Register
            </Link>
          </div>
        )}
        <p className="text-[8px] font-bold tracking-[0.2em] uppercase text-zinc-200 dark:text-zinc-800">
          Standard Secure Protocol v2.1
        </p>
      </div>
    </div>
  );
}
