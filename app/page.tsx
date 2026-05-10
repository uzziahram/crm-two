import LoginForm from '@/components/LoginForm';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative font-mono">
      <LoginForm type="customer" />
      
      {/* Admin Switch Button - Even lighter styling */}
      <Link 
        href="/admin/login"
        className="fixed bottom-8 right-8 px-6 py-3 bg-white dark:bg-zinc-900/50 text-zinc-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] border border-zinc-200 dark:border-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-600 dark:hover:text-zinc-400 transition-all backdrop-blur-sm"
      >
        Switch to Admin
      </Link>
    </div>
  );
}
