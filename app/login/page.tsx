import LoginForm from '@/components/LoginForm';

export default function CustomerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-mono">
      <LoginForm type="customer" />
    </div>
  );
}
