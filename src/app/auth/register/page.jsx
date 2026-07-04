'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertCircle, Mail, User, Lock, Eye, EyeOff, BookOpen, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1); // 1: Details, 2: OTP, 3: Success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    class: '9',
  });
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'success', 'error'
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [resendStatus, setResendStatus] = useState('idle');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => { if (index + i < 6) newOtp[index + i] = char; });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedData.length, 5);
      document.getElementById(`otp-${nextIndex}`).focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    if (!formData.name.trim()) { newErrors.name = 'Name is required'; isValid = false; }
    if (!formData.email) { newErrors.email = 'Email is required'; isValid = false; }
    else if (!/\S+@\S+\.\S+/.test(formData.email)) { newErrors.email = 'Email is invalid'; isValid = false; }
    if (!formData.password) { newErrors.password = 'Password is required'; isValid = false; }
    else if (formData.password.length < 8) { newErrors.password = 'Password must be at least 8 characters'; isValid = false; }
    if (formData.password !== formData.confirmPassword) { newErrors.confirmPassword = 'Passwords do not match'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          class: formData.class,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to register');
      setStep(2);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setError(error.message || 'Failed to register. Please try again.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otpString }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Verification failed');
      setStep(3);
      setStatus('success');
      setTimeout(() => router.push('/auth/login?verified=true'), 3000);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  const handleResendOtp = async () => {
    setResendStatus('loading');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, resendOnly: true }),
      });
      if (!response.ok) throw new Error('Failed to resend OTP');
      setResendStatus('success');
      setTimeout(() => setResendStatus('idle'), 3000);
    } catch (err) { setResendStatus('error'); }
  };

  if (step === 3) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
        <Card className="w-full max-w-md p-8 text-center shadow-2xl border-none">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</CardTitle>
          <p className="text-gray-600 mb-8">
            Awesome! Your account is verified. Redirecting you to the login page to start your journey.
          </p>
          <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-[progress_3s_linear_forwards]"></div>
          </div>
        </Card>
        <style jsx>{` @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } } `}</style>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
          <CardHeader className="space-y-2 pb-8 bg-white">
            <div className="flex justify-center mb-4">
              <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-extrabold text-center text-gray-900">Verify your email</CardTitle>
            <p className="text-center text-gray-500 font-medium">
              We've sent a 6-digit code to <span className="text-indigo-600 font-bold">{formData.email}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {status === 'error' && (
              <div className="flex items-center gap-3 p-4 text-sm text-red-800 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}
            <form onSubmit={handleOtpSubmit} className="space-y-8">
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold text-indigo-600 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-0 transition-all outline-none"
                    disabled={status === 'loading'}
                  />
                ))}
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg"
                disabled={status === 'loading' || otp.join('').length !== 6}
              >
                {status === 'loading' ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</> : 'Verify Account'}
              </Button>
            </form>
            <div className="text-center">
              <p className="text-gray-500 font-medium">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendStatus === 'loading'}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  {resendStatus === 'loading' ? 'Sending...' : 'Resend Code'}
                </button>
              </p>
              {resendStatus === 'success' && <p className="text-green-600 text-sm font-bold mt-2">New code sent!</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pb-8">
            <button onClick={() => setStep(1)} className="text-sm font-bold text-gray-500 hover:text-indigo-600">
              ← Change email / Edit details
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 relative">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-gray-200/60 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:border-indigo-300 hover:shadow-[0_0_20px_rgba(79,70,229,0.1)] transition-all duration-300 group cursor-pointer"
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
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-md mb-2">
              <svg
                className="w-10 h-10 text-white"
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
            <h1 className="text-2xl font-black text-indigo-600 tracking-wider">
              MINDORA
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-[#616f89] font-bold mt-0.5">
              Master Your Olympiads
            </p>
          </div>
          <CardTitle className="text-xl font-bold text-center text-gray-900">Create your account</CardTitle>
          <p className="text-sm text-center text-gray-500">Join Mindora's community of learners</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-100 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="name" name="name" placeholder="John Doe" value={formData.name} onChange={handleChange} className="pl-10" disabled={status === 'loading'} />
              </div>
              {errors.name && <p className="text-xs text-red-600 font-medium">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="email" name="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} className="pl-10" disabled={status === 'loading'} />
              </div>
              {errors.email && <p className="text-xs text-red-600 font-medium">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select name="class" value={formData.class} onChange={handleChange} className="w-full h-10 pl-10 rounded-md border border-input bg-background text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                  {[9, 10, 11, 12].map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} disabled={status === 'loading'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[10px] text-red-600 leading-tight">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm</Label>
                <Input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} disabled={status === 'loading'} />
              </div>
            </div>
            <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl" disabled={status === 'loading'}>
              {status === 'loading' ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-gray-600">
            Already have an account? <Link href="/auth/login" className="font-bold text-indigo-600 hover:underline">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
