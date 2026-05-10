'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/v1/auth/customer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', 'customer');
        router.push('/dashboard');
      } else {
        setError(data.error || 'REGISTRATION FAILED');
      }
    } catch (err) {
      setError('SYSTEM ERROR: UNEXPECTED FAILURE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm p-10 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.02)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.01)] backdrop-blur-sm bg-opacity-80 dark:bg-opacity-80 transition-all duration-300 font-mono">
      <div className="mb-10">
        <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-400 mb-2">
          New Account
        </h2>
        <h1 className="text-2xl font-light text-zinc-700 dark:text-zinc-200">
          Register
        </h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 text-xs font-bold tracking-wider text-zinc-600 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 border-l-2 border-zinc-300 dark:border-zinc-600">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-0 py-3 bg-transparent border-b border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:border-zinc-500 dark:focus:border-zinc-400 outline-none transition-colors text-sm rounded-none"
              placeholder="FIRST"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-0 py-3 bg-transparent border-b border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:border-zinc-500 dark:focus:border-zinc-400 outline-none transition-colors text-sm rounded-none"
              placeholder="LAST"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Email
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-0 py-3 bg-transparent border-b border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:border-zinc-500 dark:focus:border-zinc-400 outline-none transition-colors text-sm rounded-none"
            placeholder="EMAIL@DOMAIN.COM"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Security Key
          </label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-0 py-3 bg-transparent border-b border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:border-zinc-500 dark:focus:border-zinc-400 outline-none transition-colors text-sm rounded-none"
            placeholder="PASSWORD"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-4 bg-zinc-800 dark:bg-zinc-200 text-zinc-50 dark:text-zinc-800 text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-all disabled:opacity-50 rounded-none shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none"
        >
          {loading ? 'Registering...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
        <Link 
          href="/"
          className="text-[10px] font-bold tracking-[0.1em] uppercase text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 transition-colors"
        >
          Already have an account? Sign In
        </Link>
      </div>
    </div>
  );
}
