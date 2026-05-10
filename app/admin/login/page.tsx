import LoginForm from '@/components/LoginForm';
import Link from 'next/link';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative font-mono transition-colors duration-300">
      <div className="absolute top-8 left-8 text-zinc-400 dark:text-zinc-500 font-bold tracking-[0.3em] text-[10px] uppercase border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
        Administrative <br /> Secure Portal
      </div>
      
      <LoginForm type="admin" />

      {/* Back to Customer Login - Sharp edges */}
      <Link 
        href="/"
        className="fixed bottom-8 right-8 px-6 py-3 bg-white dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-400 transition-all backdrop-blur-sm shadow-sm"
      >
        Portal Home
      </Link>
    </div>
  );
}
