'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send password reset email');
      }
      
      setStatus('success');
    } catch (error) {
      console.error('Forgot password error:', error);
      setStatus('error');
      setError(error.message || 'Failed to process your request. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 p-4 flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 right-10 h-80 w-80 rounded-full bg-indigo-200/60 blur-3xl" />

        <Card className="w-full max-w-md shadow-2xl border border-slate-200/80">
          <CardHeader className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary">
              <span className="text-3xl font-black">M</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mindora</h1>
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mt-1">
                Master Your Olympiads
              </p>
            </div>
            <CardTitle className="text-2xl">Check your inbox</CardTitle>
            <CardDescription className="text-slate-500">
              We've sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-primary/10 p-4 border border-primary/20">
              <CheckCircle className="h-14 w-14 text-primary" />
            </div>
            <p className="text-center text-slate-600">
              If an account exists with this email, you should receive a link shortly. The link is valid for 1 hour.
            </p>
            <p className="text-sm text-slate-500 text-center">
              Didn’t receive the email? Check your spam folder or try again.
            </p>
          </CardContent>

          <CardFooter className="grid gap-3">
            <Button
              onClick={() => {
                setStatus('idle');
                setEmail('');
              }}
              className="w-full"
            >
              Send again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Back to sign in
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 p-4 flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute top-8 left-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-80 w-80 rounded-full bg-indigo-200/60 blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl border border-slate-200/80">
        <CardHeader className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 border border-primary/20 text-primary">
            <span className="text-3xl font-black">M</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Mindora</h1>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-semibold mt-1">
              Master Your Olympiads
            </p>
          </div>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription className="text-slate-500">
            Enter your email and we’ll send you a secure reset link.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {status === 'error' && (
              <div className="rounded-2xl border border-red-200/80 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">{error || 'Unable to send reset email. Please try again.'}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="py-3"
                required
              />
            </div>

            <p className="text-sm text-slate-500">
              Remember your password?{' '}
              <Link href="/auth/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </CardContent>

          <CardFooter className="pt-0">
            <Button
              type="submit"
              className="w-full"
              disabled={status === 'loading' || !email}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
