'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FcGoogle } from 'react-icons/fc';
import { Loader2, AlertCircle, Mail, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SignUp() {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP, 3: Success
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
    studentClass: '',
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState('idle');
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedData.forEach((char, i) => { if (index + i < 6) newOtp[index + i] = char; });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedData.length, 5);
      const nextInput = document.getElementById(`otp-${nextIndex}`);
      if (nextInput) nextInput.focus();
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.role === 'STUDENT' && !formData.studentClass) {
      setError('Please select your class');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          class: formData.studentClass,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      setStep(2);
      setIsLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to create account');
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) { setError('Please enter the full 6-digit code'); return; }
    setIsLoading(true);
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
      setIsLoading(false);
      setTimeout(() => router.push('/auth/signin?verified=true'), 3000);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050816] py-12 px-4 relative overflow-hidden font-sans">
      {/* Dynamic Animated Background */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse delay-1000" />
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] rounded-full bg-blue-500/10 blur-[80px]" />
      
      <div className="max-w-md w-full relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: REGISTRATION DETAILS */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/10"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h2>
                <p className="text-slate-400 text-sm font-medium">
                  Join Mindora or{' '}
                  <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                    Sign in here
                  </Link>
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-xs text-red-400 font-bold">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5 ml-1">Full Name</label>
                    <input
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5 ml-1">Email Address</label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5 ml-1">Password</label>
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5 ml-1">Confirm</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-black text-slate-500 mb-1.5 ml-1">Your Class</label>
                    <select
                      name="studentClass"
                      value={formData.studentClass}
                      onChange={handleChange}
                      required
                      className="w-full px-5 py-3.5 bg-white/[0.05] border border-white/10 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[#050816]">Select Class</option>
                      {[9, 10, 11, 12].map(c => <option key={c} value={c} className="bg-[#050816]">Class {c}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Sign Up <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-white/5">
                <button
                  onClick={() => window.location.href = '/api/auth/signin/google'}
                  className="w-full py-3.5 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-[0.98]"
                >
                  <FcGoogle className="h-5 w-5" /> Sign up with Google
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="bg-white/[0.03] backdrop-blur-xl p-8 sm:p-10 rounded-[32px] shadow-2xl border border-white/10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-24 h-24 text-white" />
              </div>

              <div className="text-center mb-10 relative z-10">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-600/20 rounded-[24px] mb-6 border border-indigo-500/20">
                  <Mail className="h-8 w-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight mb-2">Check Email</h2>
                <p className="text-slate-400 text-sm font-medium px-4">
                  We've sent a code to <span className="text-indigo-400 font-black">{formData.email}</span>
                </p>
              </div>

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <p className="text-xs text-red-400 font-bold">{error}</p>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} className="space-y-10 relative z-10">
                <div className="flex justify-between gap-3">
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
                      className="w-full h-14 text-center text-2xl font-black bg-white/[0.05] border-2 border-white/5 rounded-2xl text-indigo-400 focus:border-indigo-500 focus:bg-indigo-500/10 focus:ring-0 outline-none transition-all shadow-inner"
                      disabled={isLoading}
                    />
                  ))}
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length !== 6}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Verify Account'}
                </button>
              </form>

              <div className="mt-10 text-center relative z-10">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Didn't get it?</p>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendStatus === 'loading'}
                  className="text-indigo-400 hover:text-indigo-300 font-black text-sm transition-colors decoration-2 underline-offset-4 hover:underline"
                >
                  {resendStatus === 'loading' ? 'Resending...' : 'Resend Code'}
                </button>
                {resendStatus === 'success' && <p className="text-green-500 text-[10px] font-black mt-2 uppercase tracking-tighter">New code dispatched!</p>}
              </div>

              <button 
                onClick={() => setStep(1)} 
                className="mt-8 w-full text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-indigo-500 transition-colors"
              >
                ← Wrong email? Edit details
              </button>
            </motion.div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.03] backdrop-blur-xl p-12 rounded-[40px] shadow-2xl border border-white/10 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-indigo-600/10 pointer-events-none" />
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12 }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30 mb-8"
              >
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </motion.div>
              <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Welcome Aboard!</h2>
              <p className="text-slate-400 text-lg font-medium mb-10 px-4 leading-relaxed">
                Verification complete. Preparing your personal learning space...
              </p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-green-500 to-indigo-500" 
                />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mt-6 animate-pulse">Redirecting to Login</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
