'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Redirect to login page with success message
      router.push(`/auth/signin?registered=true`);
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    // This will be handled by NextAuth
    window.location.href = '/api/auth/signin/google';
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
              Create a new account
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Or{' '}
              <Link href="/auth/signin" className="font-medium text-primary hover:text-primary/80 transition-colors">
                sign in to your existing account
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

          {/* Form */}
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Inputs separated for modern look unlike the previous grouped style */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all duration-200"
                  placeholder="John Doe"
                  suppressHydrationWarning
                />
              </div>
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
                  value={formData.email}
                  onChange={handleChange}
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
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all duration-200"
                  placeholder="Minimum 8 characters"
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all duration-200"
                  placeholder="Re-enter your password"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-foreground mb-1">
                I am a
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-3 py-2.5 bg-background border border-input rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all duration-200"
                suppressHydrationWarning
              >
                <option value="STUDENT">Student</option>
                <option value="TEACHER">Teacher</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`group relative w-full flex justify-center py-2.5 px-4 border border-primary/50 text-sm font-bold rounded-lg text-foreground bg-transparent backdrop-blur-md hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 shadow-lg cursor-pointer ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                suppressHydrationWarning
              >
                {isLoading ? 'Creating account...' : 'Sign up'}
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <div className="h-px flex-1 bg-border"></div>
            <span className="px-4 text-sm text-muted-foreground">Or sign up with</span>
            <div className="h-px flex-1 bg-border"></div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-2.5 border border-input rounded-lg shadow-sm text-sm font-medium text-foreground bg-background hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 cursor-pointer"
              suppressHydrationWarning
            >
              <FcGoogle className="h-5 w-5 mr-3" />
              Sign up with Google
            </button>
          </div>

          <div className="mt-6 text-xs text-center text-muted-foreground">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="font-medium text-primary hover:text-primary/80 underline underline-offset-4">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-primary hover:text-primary/80 underline underline-offset-4">
              Privacy Policy
            </Link>.
          </div>
        </div>
      </div>
    </div>
  );
}
