'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    await signIn('google', { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 w-full h-full bg-background z-0" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        <div className="bg-card p-8 sm:p-10 rounded-2xl shadow-2xl border border-border/40 backdrop-blur-sm">
          {/* Header */}
          <div>
            <h2 className="text-center text-3xl font-extrabold text-foreground tracking-tight">
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Or{' '}
              <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                create a new account
              </Link>
            </p>
          </div>

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
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all duration-200"
                  placeholder="Enter your password"
                  suppressHydrationWarning
                />
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

            <div className="mt-6 flex items-center justify-between">
              <div className="h-px flex-1 bg-border"></div>
              <span className="px-4 text-sm text-muted-foreground">Or continue with</span>
              <div className="h-px flex-1 bg-border"></div>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-input rounded-lg shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 cursor-pointer"
                suppressHydrationWarning
              >
                <FcGoogle className="h-5 w-5 mr-3" />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
