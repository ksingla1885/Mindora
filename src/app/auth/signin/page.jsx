'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      // Redirect on successful login
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Failed to sign in');
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 backdrop-blur-md border border-border/40 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 group cursor-pointer"
        suppressHydrationWarning
      >
        <svg
          className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform duration-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Home</span>
      </Link>
      {/* Background decoration */}
      <div className="absolute inset-0 w-full h-full bg-background z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-card p-8 sm:p-10 rounded-2xl shadow-2xl border border-border/40 backdrop-blur-sm">
          {/* Branding */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="flex items-center justify-center rounded-2xl bg-primary/10 p-3 mb-3 border border-primary/20">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400 tracking-wider">
              MINDORA
            </h1>
            <p className="text-xs uppercase tracking-widest text-[#616f89] font-bold mt-1">
              Master Your Olympiads
            </p>
          </div>

          {/* Header */}
          <div>
            <h2 className="text-center text-2xl font-bold text-foreground tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-center text-sm text-muted-foreground">
              Or{' '}
              <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                create a new account
              </Link>
            </p>
          </div>

          {/* Success Messages */}
          {searchParams.get('registered') === 'true' && (
            <div className="mt-6 bg-green-500/10 border-l-4 border-green-500 p-4 rounded-r-md flex items-center gap-3">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-500 font-medium">Registration successful! Please check your email to verify your account.</p>
            </div>
          )}
          {searchParams.get('verified') === 'true' && (
            <div className="mt-6 bg-green-500/10 border-l-4 border-green-500 p-4 rounded-r-md flex items-center gap-3">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-500 font-medium">Email verified successfully! You can now sign in.</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-destructive/10 border-l-4 border-destructive p-4 rounded-r-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-destructive" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-foreground mb-1">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all duration-200"
                  placeholder="you@example.com"
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-3 pr-10 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all duration-200"
                    placeholder="Enter your password"
                    suppressHydrationWarning
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-input rounded bg-background"
                  suppressHydrationWarning
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-muted-foreground">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2.5 px-4 border border-primary/50 text-sm font-bold rounded-lg text-foreground bg-transparent backdrop-blur-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-lg cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                suppressHydrationWarning
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
}
