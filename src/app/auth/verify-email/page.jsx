'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [error, setError] = useState('');
  const [resendStatus, setResendStatus] = useState('idle');

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [emailParam]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      // Focus last filled or next empty
      const nextIndex = Math.min(index + pastedData.length, 5);
      document.getElementById(`otp-${nextIndex}`).focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setStatus('success');
      setTimeout(() => {
        router.push('/auth/login?verified=true');
      }, 3000);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  const handleResendOtp = async () => {
    setResendStatus('loading');
    try {
      // Reuse the register API or a dedicated resend API
      // For now, let's assume we need to trigger a resend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          resendOnly: true // We should update the register API to handle this
        }),
      });

      if (!response.ok) throw new Error('Failed to resend OTP');
      
      setResendStatus('success');
      setTimeout(() => setResendStatus('idle'), 3000);
    } catch (err) {
      setResendStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-2xl border-none">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</CardTitle>
          <p className="text-gray-600 mb-8">
            Awesome! Your email has been verified. You're all set to start your learning journey with Mindora.
          </p>
          <div className="space-y-4">
            <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 animate-progress"></div>
            </div>
            <p className="text-sm text-gray-500">Redirecting you to login...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="space-y-2 pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-extrabold text-center text-gray-900">Verify your email</CardTitle>
          <p className="text-center text-gray-500 font-medium">
            We've sent a 6-digit code to <span className="text-indigo-600 font-bold">{email}</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {status === 'error' && (
            <div className="flex items-center gap-3 p-4 text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex justify-between gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold text-indigo-600 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                  disabled={status === 'loading'}
                />
              ))}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all active:scale-95"
              disabled={status === 'loading' || otp.join('').length !== 6}
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Account'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-gray-500 font-medium">
              Didn't receive the code?{' '}
              <button
                onClick={handleResendOtp}
                disabled={resendStatus === 'loading'}
                className="text-indigo-600 font-bold hover:underline disabled:opacity-50"
              >
                {resendStatus === 'loading' ? 'Sending...' : 'Resend Code'}
              </button>
            </p>
            {resendStatus === 'success' && (
              <p className="text-green-600 text-sm font-bold mt-2">New code sent successfully!</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pb-8">
          <Link href="/auth/register" className="text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors">
            ← Back to registration
          </Link>
        </CardFooter>
      </Card>
      
      <style jsx>{`
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}
