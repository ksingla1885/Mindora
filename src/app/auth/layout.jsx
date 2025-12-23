import { Inter } from 'next/font/google';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Mindora - Authentication',
  description: 'Sign in or create an account to access Mindora learning platform',
};

export default function AuthLayout({ children }) {
  return (
    <main className={`min-h-screen bg-background text-foreground ${inter.className}`}>
      {children}
    </main>
  );
}

