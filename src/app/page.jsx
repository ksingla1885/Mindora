"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Menu,
  Check,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  BookOpen,
  Brain,
  Timer,
  Trophy,
  MessageCircle,
  BarChart,
  ArrowRight,
  Github,
  Linkedin,
  Mail,
  X,
  Sun,
  Moon,
  Star
} from "lucide-react";

// Animation Variants
const fadeInUp = {
  hidden: { opacity: 0, y: 40, rotateX: -10 },
  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const cardHover = {
  rest: { scale: 1, rotateX: 0, rotateY: 0 },
  hover: { scale: 1.05, rotateX: 5, rotateY: 5, transition: { duration: 0.3 } }
};

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 overflow-x-hidden">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border fixed top-0 w-full z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-primary">Mindora</span>
              </div>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="#features" className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Features</Link>
                <Link href="#olympiads" className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Olympiads</Link>
                <Link href="#pricing" className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Pricing</Link>
                <Link href="#reviews" className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Reviews</Link>
                <Link href="#about" className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors">About</Link>
                <Link href="#contact" className="text-muted-foreground hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Contact</Link>
              </div>
            </nav>
            <div className="flex items-center space-x-4">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              )}
              <Link href="/auth/signin" className="hidden md:block text-muted-foreground hover:text-primary text-sm font-medium transition-colors">Sign In</Link>
              <Link href="/auth/signup" className="hidden md:block bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Start Free</Link>
            </div>
            <div className="md:hidden flex items-center gap-4">
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              )}
              <button
                type="button"
                className="text-muted-foreground hover:text-primary p-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border absolute w-full left-0 top-16 shadow-lg animate-in slide-in-from-top-5">
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link
                href="#features"
                className="block text-muted-foreground hover:text-primary hover:bg-accent px-3 py-3 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#olympiads"
                className="block text-muted-foreground hover:text-primary hover:bg-accent px-3 py-3 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Olympiads
              </Link>
              <Link
                href="#pricing"
                className="block text-muted-foreground hover:text-primary hover:bg-accent px-3 py-3 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#contact"
                className="block text-muted-foreground hover:text-primary hover:bg-accent px-3 py-3 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="#reviews"
                className="block text-muted-foreground hover:text-primary hover:bg-accent px-3 py-3 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Reviews
              </Link>
              <Link
                href="#about"
                className="block text-muted-foreground hover:text-primary hover:bg-accent px-3 py-3 rounded-md text-base font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <div className="pt-4 flex flex-col gap-3">
                <Link
                  href="/auth/signin"
                  className="block text-center text-muted-foreground hover:text-primary border border-border px-3 py-3 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block text-center bg-primary text-primary-foreground px-3 py-3 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Start Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 to-purple-500/5 py-16 px-4 sm:px-6 lg:px-8 perspective-1000">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="text-center lg:text-left"
              >
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                  Olympiad-Focused Learning for <span className="text-primary">Classes 9–12</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                  Daily practice questions, weekly timed tests, expert-curated content, performance analytics, and AI doubt-solving — built for serious students.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link href="/auth/signup" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg text-center">
                    Start Free (Class 9–12)
                  </Link>
                  <Link href="#olympiads" className="border-2 border-primary text-primary hover:bg-primary/5 px-8 py-4 rounded-lg font-semibold text-lg transition-colors text-center">
                    View Olympiads
                  </Link>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50, rotateY: 15 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                viewport={{ once: true }}
                className="flex justify-center lg:justify-end"
              >
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                  alt="Students preparing for Olympiad exams"
                  width="600"
                  height="450"
                  className="w-full max-w-lg rounded-2xl object-cover shadow-2xl hover:shadow-primary/20 transition-all"
                  loading="lazy"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Class-Wise Learning Paths */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Class-Wise Learning Paths</h2>
              <p className="text-xl text-muted-foreground">Tailored curriculum for every grade level</p>
            </motion.div>
            <motion.div
              className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-8 border border-green-200 dark:from-green-950/20 dark:to-emerald-900/10 dark:border-green-800 shadow-md">
                <div className="mb-6 overflow-hidden rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80"
                    alt="Classes 9-10 learning"
                    width="400"
                    height="225"
                    className="w-full object-cover shadow-sm hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Classes 9–10</h3>
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground/80 mb-2">Subjects:</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-1 rounded-full text-sm font-medium">Science</span>
                    <span className="bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-100 px-3 py-1 rounded-full text-sm font-medium">Mathematics</span>
                  </div>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    Concept clarity + foundational Olympiad prep
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    Daily Practice Problems (DPP)
                  </li>
                </ul>
              </motion.div>
              <motion.div variants={fadeInUp} whileHover={{ y: -5, transition: { duration: 0.2 } }} className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-8 border border-purple-200 dark:from-purple-950/20 dark:to-violet-900/10 dark:border-purple-800 shadow-md">
                <div className="mb-6 overflow-hidden rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80"
                    alt="Classes 11-12 learning"
                    width="400"
                    height="225"
                    className="w-full object-cover shadow-sm hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Classes 11–12</h3>
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground/80 mb-2">Subjects:</h4>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-sm font-medium">Physics</span>
                    <span className="bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-sm font-medium">Chemistry</span>
                    <span className="bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-sm font-medium">Mathematics</span>
                    <span className="bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-100 px-3 py-1 rounded-full text-sm font-medium">Astronomy</span>
                  </div>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                    Advanced problem-solving + real Olympiad patterns
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-purple-600 mt-0.5 mr-3 flex-shrink-0" />
                    Weekly timed tests & analytics
                  </li>
                </ul>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features - What Mindora Offers */}
        <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">What Mindora Offers</h2>
              <p className="text-xl text-muted-foreground">Everything you need for Olympiad success</p>
            </motion.div>
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <FeatureItem
                icon={<BookOpen className="w-10 h-10 text-primary" />}
                title="Topic-wise Content"
                description="Videos, PDFs & concise summaries for comprehensive understanding"
                image="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
              />
              <FeatureItem
                icon={<Brain className="w-10 h-10 text-primary" />}
                title="Daily Practice Problems"
                description="DPP to build consistent problem-solving skills"
                image="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=800&q=80"
              />
              <FeatureItem
                icon={<Timer className="w-10 h-10 text-primary" />}
                title="Weekly Timed Tests"
                description="Free & Paid tests to simulate real exam conditions"
                image="https://www.jqueryscript.net/images/analog-digital-timezone-dark-mode.jpg"
              />
              <FeatureItem
                icon={<Trophy className="w-10 h-10 text-primary" />}
                title="Leaderboards & Badges"
                description="Points, badges and rankings to keep you motivated"
                noImage
              />
              <FeatureItem
                icon={<MessageCircle className="w-10 h-10 text-primary" />}
                title="AI Doubt-Solving"
                description="Instant AI-powered chat to resolve your questions"
                noImage
              />
              <FeatureItem
                icon={<BarChart className="w-10 h-10 text-primary" />}
                title="Performance Analytics"
                description="Simple, actionable insights to track your progress"
                noImage
              />
            </motion.div>
          </div>
        </section>

        {/* Supported Olympiads */}
        <section id="olympiads" className="py-16 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Supported Olympiads</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Content mapped to real Olympiad patterns for Classes 9–12</p>
            </motion.div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <OlympiadCard
                label="NSO"
                title="National Science Olympiad"
                subtitle="Science concepts for Classes 9-12"
                colorClass="bg-blue-100 text-blue-600"
              />
              <OlympiadCard
                label="IMO"
                title="International Math Olympiad"
                subtitle="Advanced mathematics problems"
                colorClass="bg-green-100 text-green-600"
              />
              <OlympiadCard
                label="NSTSE"
                title="National Level Science Talent Search"
                subtitle="Comprehensive science assessment"
                colorClass="bg-purple-100 text-purple-600"
              />
              <OlympiadCard
                label="🌟"
                title="Astronomy Olympiads"
                subtitle="Space science and astronomy"
                colorClass="bg-indigo-100 text-indigo-600"
              />
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-card">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">How Mindora Works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Simple 3-step process to excel in Olympiad preparation</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <Step
                num="1"
                title="Choose Class & Subjects"
                desc="Select your class (9-12) and subjects like Physics, Chemistry, Mathematics, Science, or Astronomy based on your Olympiad goals."
                color="blue"
              />
              <Step
                num="2"
                title="Learn → Practice → Test"
                desc="Study with topic-wise content, solve daily practice problems (DPP), and take weekly timed tests to simulate real exam conditions."
                color="green"
              />
              <Step
                num="3"
                title="Analyze & Improve with AI"
                desc="Review detailed performance analytics, get AI-powered doubt resolution, and receive personalized recommendations to improve weak areas."
                color="purple"
              />
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">Free vs Premium</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Choose the plan that fits your Olympiad preparation needs</p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-card rounded-2xl p-8 shadow-sm border border-border"
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Free Plan</h3>
                  <p className="text-muted-foreground">Get started with essential features</p>
                </div>
                <ul className="space-y-4 mb-8">
                  {["Practice questions", "Sample tests", "Basic analytics", "AI doubt-solving (limited)"].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-foreground/80">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 px-6 bg-muted text-foreground/80 rounded-lg font-semibold hover:bg-muted/80 transition-colors">Current Plan</button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(var(--primary), 0.25)" }}
                className="bg-card rounded-2xl p-8 shadow-xl shadow-primary/20 border-2 border-primary relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full bg-primary/10 h-1"></div>
                <div className="flex justify-center mb-6">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-md">Recommended</span>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground mb-2">Premium Plan</h3>
                  <p className="text-muted-foreground">Unlock your full potential</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-foreground/80">All Free features</span>
                  </li>
                  {["Paid timed tests", "Certificates", "Advanced analytics", "Priority AI help"].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-foreground/80 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full py-3 px-6 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">Unlock Premium Tests</button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="py-16 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">What Students Say</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Hear from students who achieved their Olympiad goals with Mindora</p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <ReviewCard
                name="Aarav Gupta"
                class="Class 10"
                review="The topic-wise practice questions were a game changer for my NSO preparation. I especially loved the AI doubt solver!"
                rating={5}
              />
              <ReviewCard
                name="Ishita Sharma"
                class="Class 12"
                review="Mindora's mock tests are very close to the actual exam pattern. It helped me improve my speed and accuracy significantly."
                rating={5}
              />
              <ReviewCard
                name="Rohan Mehta"
                class="Class 9"
                review="I was struggling with Physics concepts, but the concise notes and video summaries made everything clear. Highly recommended!"
                rating={4}
              />
            </div>
          </div>
        </section>

        {/* Why Choose Mindora */}
        <section className="py-16 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Mindora?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Built specifically for serious students who want to excel in competitive exams</p>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <WhyItem
                  icon={<Trophy className="w-6 h-6 text-white" />}
                  bg="bg-primary"
                  title="Designed Only for Classes 9–12"
                  desc="Age-appropriate content and difficulty levels tailored specifically for secondary school students preparing for Olympiads."
                />
                <WhyItem
                  icon={<BookOpen className="w-6 h-6 text-white" />}
                  bg="bg-green-600"
                  title="Exam-Oriented, Not Generic Learning"
                  desc="Every question, test, and concept is mapped to real Olympiad patterns and competitive exam requirements."
                />
                <WhyItem
                  icon={<Timer className="w-6 h-6 text-white" />}
                  bg="bg-purple-600"
                  title="Real Test Simulations"
                  desc="Experience authentic exam conditions with timed tests that mirror actual Olympiad formats and difficulty levels."
                />
                <WhyItem
                  icon={<Brain className="w-6 h-6 text-white" />}
                  bg="bg-orange-600"
                  title="AI-Assisted Learning & Recommendations"
                  desc="Get instant doubt resolution and personalized study recommendations powered by advanced AI technology."
                />
              </div>
              <motion.div
                initial={{ opacity: 0, x: 50, rotateY: -10 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="lg:pl-8"
              >
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80"
                  alt="Students using AI-powered learning platform"
                  width="800"
                  height="600"
                  className="w-full rounded-2xl object-cover shadow-lg"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* About the Developer */}
        <section id="about" className="py-16 bg-card border-t border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-8 flex justify-center"
            >
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-primary shadow-xl">
                <img
                  src="/images/ketan-kumar.jpg"
                  alt="Ketan Kumar"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-2 mb-6"
            >
              <h2 className="text-3xl font-bold text-foreground">About the Developer</h2>
              <h3 className="text-xl text-primary font-medium">Ketan Kumar</h3>
            </motion.div>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-justify"
            >
              Mindora is a solo-built project engineered by Ketan, a Full-Stack & DevOps-oriented developer with a strong focus on building scalable, reliable, and learner-centric digital platforms. Designed using Next.js with Supabase as the core data layer, Mindora reflects his commitment to modern engineering practices, clean architecture, and real-world problem solving. Inspired by personal learning challenges and the academic gaps students commonly face, Ketan set out to create a structured, accessible, and high-impact preparation platform that helps students learn smarter and progress with confidence.
            </motion.p>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex justify-center items-center space-x-6"
            >
              <Link href="https://github.com/ksingla1885" target="_blank" className="p-3 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200">
                <Github className="w-6 h-6" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="https://www.linkedin.com/in/ketan-kumar-521249279/" target="_blank" className="p-3 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200">
                <Linkedin className="w-6 h-6" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="mailto:ketansingla7988@gmail.com" className="p-3 rounded-full bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200">
                <Mail className="w-6 h-6" />
                <span className="sr-only">Email</span>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-r from-primary via-purple-600 to-indigo-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <img
                src="https://images.pexels.com/photos/32377099/pexels-photo-32377099/free-photo-of-group-of-students-celebrating-outdoors-in-uniform.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Students achieving success in Olympiad competitions"
                width="800"
                height="450"
                className="w-full max-w-2xl mx-auto rounded-2xl object-cover shadow-2xl mb-8"
              />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Start Your Olympiad Preparation Today</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already excelling in competitive exams with Mindora's comprehensive preparation platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup" className="inline-flex items-center px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <ArrowRight className="w-5 h-5 mr-2" />
                Create Free Account
              </Link>
              <div className="text-blue-100 text-sm md:text-left">
                ✓ No credit card required<br />
                ✓ Instant access to practice questions
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-muted/20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-primary">Mindora</span>
              </div>
              <p className="text-muted-foreground text-sm">Olympiad-focused learning platform for Classes 9-12 students.</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Features</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Olympiads</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Free Trial</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">About</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Contact</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Privacy Policy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Terms of Service</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-primary text-sm">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} Mindora. All rights reserved.</p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Twitter className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <Youtube className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, description, image, noImage }) {
  // Animation variants moved inside or passed down if strictly needed, or use global
  const fadeInUp = {
    hidden: { opacity: 0, y: 40, rotateX: -10 },
    visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-card rounded-2xl p-8 shadow-sm border border-border hover:shadow-md transition-shadow"
    >
      {!noImage && image && (
        <div className="mb-6">
          <img
            src={image}
            alt={title}
            width="400"
            height="225"
            className="w-full rounded-xl object-cover shadow-sm"
          />
        </div>
      )}
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}

function OlympiadCard({ label, title, subtitle, colorClass }) {
  const fadeInUp = {
    hidden: { opacity: 0, y: 40, rotateX: -10 },
    visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ scale: 1.05 }}
      className="bg-card rounded-xl p-6 shadow-sm border border-border text-center hover:shadow-md transition-shadow cursor-default"
    >
      <div className={`inline-flex items-center justify-center px-6 py-3 rounded-2xl mx-auto mb-4 shadow-sm ${colorClass}`}>
        <span className="text-xl font-bold tracking-tight">{label}</span>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}

function WhyItem({ icon, bg, title, desc }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex items-start space-x-4"
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${bg}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{desc}</p>
      </div>
    </motion.div>
  );
}

function Step({ num, title, desc, color }) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
    green: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${colorMap[color]}`}>
        <span className="text-2xl font-bold">{num}</span>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-4">{title}</h3>
      <p className="text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

function ReviewCard({ name, review, rating, class: className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-muted/30 p-8 rounded-2xl border border-border"
    >
      <div className="flex gap-1 mb-4 text-amber-500">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < rating ? "fill-current" : "text-muted-foreground/30"}`} />
        ))}
      </div>
      <p className="text-foreground/90 font-medium mb-6 leading-relaxed">"{review}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
          {name[0]}
        </div>
        <div>
          <h4 className="font-bold text-foreground text-sm">{name}</h4>
          <p className="text-xs text-muted-foreground">{className}</p>
        </div>
      </div>
    </motion.div>
  );
}
