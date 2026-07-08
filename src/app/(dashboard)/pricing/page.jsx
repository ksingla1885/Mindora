'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Crown, Sparkles, Zap, BarChart3, BookOpen, Trophy,
  Shield, Clock, Star, ArrowLeft, Bell
} from 'lucide-react';

// ─── Animated countdown ────────────────────────────────────────────────────────

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  function getTimeLeft(target) {
    const diff = Math.max(0, new Date(target) - new Date());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return timeLeft;
}

// ─── Planned features ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: 'Deep Analytics',
    desc: 'Subject-wise breakdown, time analysis, and accuracy trends over every test.',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: 'Unlimited Mock Tests',
    desc: 'Access 500+ premium mock tests curated by expert faculty.',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'AI Study Planner',
    desc: 'Personalized timetables and revision schedules powered by AI.',
    color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: <Trophy className="h-5 w-5" />,
    title: 'Rank Booster',
    desc: 'Compete in exclusive ranked contests and climb national leaderboards.',
    color: 'from-green-500/20 to-green-600/10 border-green-500/20',
    iconColor: 'text-green-400',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Doubt Resolution',
    desc: '1-on-1 doubt sessions with subject experts, available 24/7.',
    color: 'from-rose-500/20 to-rose-600/10 border-rose-500/20',
    iconColor: 'text-rose-400',
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: 'Curated DPP Packs',
    desc: 'Chapter-wise DPP packs designed by IIT & NEET toppers.',
    color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20',
    iconColor: 'text-cyan-400',
  },
];

// ─── Floating particle ────────────────────────────────────────────────────────

function Particle({ style }) {
  return (
    <div
      className="absolute rounded-full bg-white/10 animate-pulse"
      style={style}
    />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingComingSoonPage() {
  // Target launch date — 60 days from now as a placeholder
  const launchDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const { days, hours, minutes, seconds } = useCountdown(launchDate);

  const [notified, setNotified] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleNotify(e) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setNotified(true);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0d1a] text-white flex flex-col">
      {/* ── Ambient background ────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Large glow blobs */}
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-purple-700/10 blur-[100px]" />

        {/* Floating particles */}
        <Particle style={{ top: '12%', left: '8%', width: 6, height: 6, animationDuration: '3s' }} />
        <Particle style={{ top: '30%', left: '90%', width: 10, height: 10, animationDuration: '4s' }} />
        <Particle style={{ top: '70%', left: '5%', width: 8, height: 8, animationDuration: '2.5s' }} />
        <Particle style={{ top: '85%', left: '75%', width: 5, height: 5, animationDuration: '3.5s' }} />
        <Particle style={{ top: '50%', left: '55%', width: 7, height: 7, animationDuration: '5s' }} />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* ── Back link ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 px-6 pt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-6 pt-10 pb-16 text-center">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
            Coming Very Soon
          </span>
        </div>

        {/* Crown icon */}
        <div className="relative mb-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-[0_0_60px_rgba(251,191,36,0.4)]">
            <Crown className="h-12 w-12 text-white drop-shadow-lg" />
          </div>
          <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-white via-blue-100 to-indigo-300 bg-clip-text text-transparent">
            Mindora Premium
          </span>
        </h1>
        <p className="mt-4 max-w-lg text-base text-white/60 leading-relaxed">
          We're crafting an elite learning experience with AI-powered analytics, unlimited mock tests, and expert guidance — designed for toppers.
        </p>

        {/* ── Countdown ───────────────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-5">
          {[
            { label: 'Days', value: days },
            { label: 'Hours', value: hours },
            { label: 'Mins', value: minutes },
            { label: 'Secs', value: seconds },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center">
              <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg">
                <span className="text-2xl sm:text-3xl font-black tabular-nums">
                  {String(value).padStart(2, '0')}
                </span>
              </div>
              <span className="mt-2 text-[10px] uppercase tracking-widest text-white/40">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Notify form ─────────────────────────────────────────────────── */}
        <div className="mt-10 w-full max-w-md">
          {notified ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-6 py-4 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                <Bell className="h-4 w-4 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-green-300">You're on the list! 🎉</p>
                <p className="text-xs text-white/50">We'll notify you the moment Premium launches.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleNotify} className="flex flex-col sm:flex-row gap-3">
              <input
                id="premium-notify-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email for early access"
                required
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              />
              <button
                id="premium-notify-btn"
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-indigo-500 transition-all disabled:opacity-60 whitespace-nowrap"
              >
                {submitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
                {submitting ? 'Saving…' : 'Notify Me'}
              </button>
            </form>
          )}
          <p className="mt-3 text-xs text-white/30">No spam. Early birds get exclusive launch discounts. 🚀</p>
        </div>

        {/* ── Features grid ───────────────────────────────────────────────── */}
        <div className="mt-16 w-full max-w-4xl">
          <p className="mb-8 text-sm font-semibold uppercase tracking-widest text-white/30">
            What's coming
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${f.color}`}
              >
                {/* Subtle shimmer on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 rounded-2xl" />

                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ${f.iconColor}`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-xs text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Early bird note ──────────────────────────────────────────────── */}
        <div className="mt-12 inline-flex items-center gap-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-3 backdrop-blur-sm">
          <Crown className="h-5 w-5 text-yellow-400 shrink-0" />
          <p className="text-sm text-white/60">
            <span className="font-semibold text-yellow-300">Early birds get 40% off</span> — join the waitlist above to lock in your discount.
          </p>
        </div>
      </div>
    </div>
  );
}
