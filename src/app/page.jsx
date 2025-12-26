"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  ChevronRight,
  Check,
  Zap,
  Brain,
  Trophy,
  Menu,
  X,
  Star,
  ArrowRight,
  Layers,
  Repeat,
  Search,
  Users,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Github,
  Linkedin,
  Mail,
  BookOpen,
  Timer,
  MessageSquare,
  User
} from "lucide-react";

// --- Components ---

const SideNav = () => {
  const { scrollYProgress } = useScroll();
  // Reveal sidebar earlier (0.2) so it's useful for navigation
  const x = useTransform(scrollYProgress, [0.1, 0.2], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);

  const navItems = [
    { id: "features", label: "Features", icon: Layers },
    { id: "olympiads", label: "Olympiads", icon: Trophy },
    { id: "reviews", label: "Reviews", icon: MessageSquare },
    { id: "about", label: "About", icon: User },
  ];

  return (
    <motion.div
      style={{ x, opacity }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-6 items-center bg-background/80 backdrop-blur-md border border-border p-3 rounded-full shadow-2xl"
    >
      {navItems.map((item) => (
        <Link
          key={item.id}
          href={`#${item.id}`}
          className="relative group flex items-center justify-center p-2 rounded-full hover:bg-primary/10 transition-colors"
          title={item.label}
        >
          <item.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />

          {/* Hover Label */}
          <span className="absolute right-12 whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-[10px] font-mono uppercase tracking-widest bg-foreground text-background px-2 py-1 rounded shadow-lg">
            {item.label}
          </span>
        </Link>
      ))}
    </motion.div>
  );
};

// Replaces standard button with "assembling" lines effect
const AssembleButton = ({ children, className, ...props }) => {
  return (
    <button className={`relative group px-8 py-3 bg-transparent overflow-hidden ${className}`} {...props}>
      <span className="relative z-10 group-hover:text-primary transition-colors duration-500">{children}</span>
      {/* Top Line */}
      <span className="absolute top-0 left-0 w-full h-[1px] bg-foreground group-hover:bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left" />
      {/* Right Line */}
      <span className="absolute top-0 right-0 h-full w-[1px] bg-foreground group-hover:bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 delay-200 origin-top" />
      {/* Bottom Line */}
      <span className="absolute bottom-0 right-0 w-full h-[1px] bg-foreground group-hover:bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-700 delay-500 origin-right" />
      {/* Left Line */}
      <span className="absolute bottom-0 left-0 h-full w-[1px] bg-foreground group-hover:bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 delay-700 origin-bottom" />
    </button>
  )
}

const AiGuide = () => {
  const { scrollYProgress } = useScroll();
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      if (latest < 0.05) { setMsg(""); setVisible(false); }
      else if (latest < 0.2) { setMsg("Let's calibrate your path."); setVisible(true); }
      else if (latest < 0.4) { setMsg("Analyzing curriculum..."); setVisible(true); }
      else if (latest < 0.6) { setMsg("Optimizing resources."); setVisible(true); }
      else if (latest < 0.85) { setMsg("Validating success metrics."); setVisible(true); }
      else { setMsg(""); setVisible(false); } // Hide near footer
    });
  }, [scrollYProgress]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-10 left-10 z-40 flex items-center gap-3 bg-background/80 backdrop-blur-md border border-border p-3 rounded-full shadow-sm"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground">{msg}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Theme Toggle Navbar Component
const ThemeNav = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="fixed top-6 right-6 z-50 flex items-center gap-4"
    >
      <Link href="/auth/signin">
        <button className="px-5 py-2.5 rounded-full bg-background/50 backdrop-blur-md border border-border hover:bg-background hover:scale-105 active:scale-95 transition-all shadow-sm text-sm font-medium text-foreground">
          Sign In
        </button>
      </Link>
    </motion.div>
  );
};

// "Empty" Hero that assembles
const MinimalHero = () => {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const pointerEvents = useTransform(scrollY, [0, 200], ["auto", "none"]);

  return (
    <motion.section
      style={{ opacity, pointerEvents }}
      className="h-screen flex flex-col items-center justify-center relative z-10 overflow-hidden"
    >
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 z-10" /> {/* Overlay for readability */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-50"
        >
          <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="relative z-20 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, letterSpacing: "1em" }}
          animate={{ opacity: 1, letterSpacing: "0.2em" }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <h1 className="text-7xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-300 to-gray-600 drop-shadow-2xl text-center tracking-tighter mix-blend-overlay">
            MINDORA
          </h1>
        </motion.div>

        {/* <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-8 text-xs font-mono text-muted-foreground uppercase tracking-widest"
        >
          Scroll to initialize
        </motion.div> */}

        <motion.div
          initial={{ height: 0 }}
          animate={{ height: 60 }}
          transition={{ delay: 2, duration: 1 }}
          className="mt-8 w-[1px] bg-border"
        >
          <motion.div
            animate={{ y: [0, 60] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-full h-1/2 bg-gradient-to-b from-transparent to-primary"
          />
        </motion.div>
      </div>
    </motion.section>
  );
};

const FragmentReveal = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
    >
      {children}
    </motion.div>
  )
}

const StickyNarrative = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    return scrollYProgress.onChange((latest) => {
      if (latest < 0.3) setActiveStep(0);
      else if (latest < 0.6) setActiveStep(1);
      else setActiveStep(2);
    });
  }, [scrollYProgress]);

  const steps = [
    {
      id: "class",
      title: "Select Class",
      desc: "Grade 9-12 data loaded.",
      visual: (
        <div className="grid grid-cols-1 gap-4 w-full">
          {[
            { num: "09", label: "Foundation Year", sub: "Build core concepts." },
            { num: "10", label: "Board Prep", sub: "Master the fundamentals." },
            { num: "11", label: "Advanced Concepts", sub: "Deep dive into specialized streams." },
            { num: "12", label: "Final Leap", sub: "Exam-oriented precision." }
          ].map((item, i) => (
            <motion.div
              key={item.num}
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: "100%", opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group relative h-20 border-b border-border flex items-center justify-between px-4 hover:bg-muted/5 transition-colors cursor-default overflow-hidden"
            >
              <div className="flex items-center gap-6 z-10">
                <span className="font-mono text-3xl font-light text-muted-foreground group-hover:text-primary transition-colors">{item.num}</span>
                <div>
                  <div className="text-lg font-medium tracking-tight text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{item.sub}</div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30 group-hover:bg-primary group-hover:scale-150 transition-all" />

              {/* Hover Reveal Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </motion.div>
          ))}
        </div>
      )
    },
    {
      id: "subject",
      title: "Calibrate Subject",
      desc: "Physics, Math, Chem detected.",
      visual: (
        <div className="flex flex-wrap gap-4 justify-center">
          {["Physics", "Chemistry", "Mathematics", "Science", "Astronomy"].map((subj, i) => (
            <motion.div
              key={subj}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              className="px-6 py-3 border border-border rounded-full text-sm font-mono hover:bg-primary hover:text-white hover:border-primary transition-colors cursor-crosshair"
            >
              {subj}
            </motion.div>
          ))}
        </div>
      )
    },
    {
      id: "depth",
      title: "Initialize Learning",
      desc: "AI Mentor ready.",
      visual: (
        <div className="relative w-64 h-64 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border border-dashed border-muted-foreground/30 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 border border-border rounded-full"
          />
          <BookOpen className="w-10 h-10 text-primary animate-pulse" />
        </div>
      )
    }
  ];

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-background">
      <div className="sticky top-0 h-screen flex items-center max-w-7xl mx-auto px-6 overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-20 w-full items-center">
          <div className="space-y-12">
            <div>
              <span className="text-primary font-mono text-xs mb-2 block tracking-widest">SYSTEM_FLOW</span>
              <h2 className="text-4xl font-light mb-6">Discovery Phase</h2>
              <p className="text-xl text-muted-foreground font-light">
                As you scroll, the platform adapts to your academic profile.
              </p>
            </div>

            <div className="space-y-8 pl-4 border-l border-border/30">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  animate={{ opacity: activeStep === index ? 1 : 0.3 }}
                  className="transition-all"
                >
                  <h3 className={`text-xl ${activeStep === index ? "text-foreground font-medium" : "text-muted-foreground font-light"}`}>{step.title}</h3>
                  <p className="text-sm font-mono text-muted-foreground mt-1">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="h-[500px] w-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(10px)" }}
                className="w-full flex justify-center"
              >
                {steps[activeStep].visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

const ZLayerOlympiads = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const items = [
    { title: "NSO", desc: "Science Olympiad", icon: <Brain />, color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/50", text: "text-blue-500" },
    { title: "IMO", desc: "Math Olympiad", icon: <Zap />, color: "from-green-500/20 to-emerald-500/20", border: "border-green-500/50", text: "text-green-500" },
    { title: "NSTSE", desc: "Talent Search", icon: <Search />, color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/50", text: "text-purple-500" },
    { title: "Astronomy", desc: "Space Science", icon: <Star />, color: "from-indigo-500/20 to-violet-500/20", border: "border-indigo-500/50", text: "text-indigo-500" },
  ];

  return (
    <section ref={containerRef} className="h-[300vh] relative bg-background border-t border-border">
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute top-10 text-center z-20 mix-blend-difference">
          <h2 className="text-4xl font-light mb-2">Target Acquisition</h2>
          <p className="text-muted-foreground font-mono text-xs">MODULES_LOADING...</p>
        </div>

        <div className="relative w-full max-w-lg h-[400px] flex items-center justify-center perspective-1000">
          {items.map((item, i) => {
            const start = i * 0.25;
            const end = start + 0.5;
            const scale = useTransform(scrollYProgress, [start, end], [0.5, 1.5]);
            const opacity = useTransform(scrollYProgress, [start, start + 0.1, end - 0.1, end], [0, 1, 1, 0]);
            const y = useTransform(scrollYProgress, [start, end], [100, -100]);
            const blur = useTransform(scrollYProgress, [start, end], [5, 0]);

            return (
              <motion.div
                key={i}
                style={{ scale, opacity, y, filter: blur ? `blur(${blur}px)` : "none", zIndex: i }}
                className="absolute inset-0 flex items-center justify-center p-6"
              >
                <div className={`w-full h-full bg-gradient-to-br ${item.color} backdrop-blur-md rounded-3xl flex flex-col items-center justify-center text-center border ${item.border} shadow-2xl relative overflow-hidden group hover:scale-105 transition-transform duration-500`}>

                  {/* Inner Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-tr ${item.color} opacity-20`} />

                  <div className={`w-20 h-20 border-2 ${item.border} flex items-center justify-center rounded-full mb-6 bg-background/50 backdrop-blur-xl shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
                    {React.cloneElement(item.icon, { size: 36, className: item.text })}
                  </div>
                  <h3 className={`text-5xl font-thin tracking-tighter mb-4 ${item.text} drop-shadow-sm`}>{item.title}</h3>
                  <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest bg-background/50 px-3 py-1 rounded-full">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const ParallaxCards = () => {
  return (
    <section id="features" className="py-32 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 mb-20 text-center">
        <h2 className="text-3xl font-light mb-6">Core Architectures</h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 ">
        {[
          { title: "Structured Data", desc: "Topic-wise content categorization.", icon: <BookOpen /> },
          { title: "Recursive Practice", desc: "Daily problem loops.", icon: <Repeat /> },
          { title: "Performance Logic", desc: "Timed execution tests.", icon: <Timer /> }
        ].map((feat, i) => (
          <FragmentReveal key={i}>
            <div className="group border border-border p-8 h-full hover:border-primary transition-colors cursor-none relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                <div className="text-[10px] font-mono">ID_{i + 1}</div>
              </div>
              <div className="mb-6 opacity-50 group-hover:opacity-100 transition-opacity">{feat.icon}</div>
              <h3 className="text-xl font-medium mb-2">{feat.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
            </div>
          </FragmentReveal>
        ))}
      </div>
    </section>
  );
};

// ... Reviews and Metric sections kept simple/minimal ...
// ... Reviews and Metric sections kept simple/minimal ...
const ReviewsSection = () => {
  const reviews = [
    { name: "Aarav G.", role: "Class 10 Student", text: "The adaptive logic actually works. It found my weak spots in Physics instantly.", rating: 5 },
    { name: "Ishita S.", role: "JEE Aspirant", text: "Minimal distraction, maximum output. The timed tests are brutal but effective.", rating: 5 },
    { name: "Rohan K.", role: "Olympiad Winner", text: "Finally, a platform that respects the student's intelligence. No clutter.", rating: 5 },
    { name: "Meera P.", role: "Class 9 Student", text: "I love the dark mode and the way modules unlock. Feels like a game.", rating: 4 },
    { name: "Arjun M.", role: "NEET Aspirant", text: "Biology diagrams are crystal clear. The daily loops keep me on track.", rating: 5 },
  ];

  return (
    <section className="py-32 bg-background border-t border-border overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 text-center mb-16 relative z-10">
        <div className="inline-block border border-primary/30 rounded-full px-4 py-1 mb-4 bg-primary/5 backdrop-blur-sm">
          <span className="text-xs font-mono text-primary tracking-widest uppercase">System Feedback</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-light mb-6">User Verification</h2>
        <p className="text-muted-foreground font-light max-w-xl mx-auto">
          Real-time data from students actively engaged in the Mindora ecosystem.
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full z-0">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-20" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-20" />

        <motion.div
          className="flex gap-6 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          {[...reviews, ...reviews].map((r, i) => (
            <div key={i} className="w-[400px] bg-card/50 backdrop-blur-sm border border-border p-8 rounded-2xl relative group hover:border-primary/50 transition-colors">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className={`${j < r.rating ? "fill-primary text-primary" : "text-muted"} transition-colors`} />
                ))}
              </div>

              <p className="text-lg font-light italic text-foreground mb-8 text-left leading-relaxed">"{r.text}"</p>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black border border-border flex items-center justify-center font-bold font-mono text-xs text-secondary-foreground">
                  {r.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

const MetricsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref);

  return (
    <section ref={ref} className="py-32 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 text-center font-mono">
          {[
            { label: "NODES_ACTIVE", val: "10,240" },
            { label: "TEST_EXECS", val: "512/day" },
            { label: "SUCCESS_RT", val: "98.5%" }
          ].map((stat, i) => (
            <div key={i}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: i * 0.2 }}
                className="text-4xl text-foreground font-light mb-2"
              >
                {stat.val}
              </motion.div>
              <div className="text-xs text-muted-foreground tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DeveloperSection = () => {
  return (
    <section className="py-24 bg-background border-t border-border">

      <div className="max-w-3xl mx-auto px-6 flex flex-col items-center text-center">
        <div className="mb-8">
          <div className="w-32 h-32 bg-muted rounded-full overflow-hidden border-4 border-border shadow-xl">
            <img src="/images/ketan-kumar.jpg" alt="Dev" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="mb-8">
          <h3 className="font-mono text-lg">DEV_PROFILE: Ketan Kumar</h3>
          <p className="text-sm text-muted-foreground">Full-Stack / DevOps</p>
        </div>
        <p className="text-sm font-light leading-7 text-justify text-muted-foreground">
          Mindora is a solo-built project engineered by Ketan, a Full-Stack & DevOps-oriented developer with a strong focus on building scalable, reliable, and learner-centric digital platforms. Designed using Next.js with Supabase as the core data layer, Mindora reflects his commitment to modern engineering practices, clean architecture, and real-world problem solving. Inspired by personal learning challenges and the academic gaps students commonly face, Ketan set out to create a structured, accessible, and high-impact preparation platform that helps students learn smarter and progress with confidence.
        </p>
      </div>
    </section>
  )
}

const FinalCta = () => {
  return (
    <section className="h-screen flex items-center justify-center relative bg-background border-t border-border overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-background/80 z-10" />
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-60"
        >
          <source src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="text-center z-20 px-6 relative">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          className="mb-8"
        >
          {/* The Fixed Chat Bubble Final Appearance */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-mono mb-6 backdrop-blur-md border border-primary/20">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            System Ready. Awaiting Input.
          </div>
        </motion.div>

        <h2 className="text-5xl md:text-7xl font-thin mb-12 tracking-tight text-white drop-shadow-lg">Begin Sequence.</h2>

        <Link href="/auth/signup">
          <AssembleButton className="text-xl bg-background/20 backdrop-blur-sm border border-white/20 hover:bg-background/40">
            INITIATE FREE TRIAL
          </AssembleButton>
        </Link>
      </div>
    </section>
  );
};

const WhyChooseSection = () => {
  const benefits = [
    {
      title: "Structured, Outcome-Driven Learning",
      desc: "Content is organized by class, subject, and topic, ensuring students always know what to study next and why it matters.",
      icon: <BookOpen className="w-6 h-6 text-blue-500" />,
      class: "md:col-span-1 lg:col-span-1 bg-blue-500/5 border-blue-500/20 hover:border-blue-500/50"
    },
    {
      title: "Smart Practice & Real Exam Simulation",
      desc: "Daily Practice Problems (DPPs) and weekly timed tests replicate real exam pressure, helping students build consistency, speed, and confidence.",
      icon: <Timer className="w-6 h-6 text-orange-500" />,
      class: "md:col-span-1 lg:col-span-1 bg-orange-500/5 border-orange-500/20 hover:border-orange-500/50"
    },
    {
      title: "Actionable Progress Insights",
      desc: "Clear analytics highlight strengths, weaknesses, and improvement areas—so students can study strategically, not blindly.",
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      class: "md:col-span-1 lg:col-span-1 bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/50"
    },
    {
      title: "AI-Assisted Learning Support",
      desc: "An integrated AI assistant helps resolve doubts, explain concepts, and guide revision—available whenever students need help.",
      icon: <Brain className="w-6 h-6 text-purple-500" />,
      class: "md:col-span-2 lg:col-span-2 bg-purple-500/5 border-purple-500/20 hover:border-purple-500/50"
    },
    {
      title: "Motivation Through Gamification",
      desc: "Leaderboards, points, and achievement badges encourage healthy competition and sustained engagement.",
      icon: <Trophy className="w-6 h-6 text-emerald-500" />,
      class: "md:col-span-1 lg:col-span-1 bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/50"
    },
    {
      title: "Engineered for Reliability & Scale",
      desc: "Built using Next.js and Supabase, Mindora follows clean architecture and performance-first design principles—ensuring fast load times, secure data handling, and long-term scalability.",
      icon: <Layers className="w-6 h-6 text-cyan-500" />,
      class: "md:col-span-1 lg:col-span-1 bg-cyan-500/5 border-cyan-500/20 hover:border-cyan-500/50"
    },
    {
      title: "Designed by a Learner, Built by an Engineer",
      desc: "Mindora is crafted by someone who understands both the student struggle and modern engineering, resulting in a platform that’s practical, intuitive, and dependable.",
      icon: <User className="w-6 h-6 text-rose-500" />,
      class: "md:col-span-2 lg:col-span-2 bg-rose-500/5 border-rose-500/20 hover:border-rose-500/50"
    }
  ];

  return (
    <section className="py-32 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block border border-primary/30 rounded-full px-4 py-1 mb-6 bg-primary/5 backdrop-blur-sm"
          >
            <span className="text-xs font-mono text-primary tracking-widest uppercase">Why Choose Mindora</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-light mb-6 tracking-tight"
          >
            Built for how students actually learn.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground font-light"
          >
            Mindora removes clutter and guesswork from exam preparation by offering structured content, daily practice, and focused assessments—all in one place.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-3xl border backdrop-blur-sm transition-all duration-500 group hover:shadow-2xl ${item.class}`}
            >
              <div className="mb-6 p-3 bg-background rounded-2xl w-fit shadow-sm group-hover:scale-110 transition-transform duration-500">
                {item.icon}
              </div>
              <h3 className="text-xl font-medium mb-4">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">

          {/* Brand & Contact */}
          <div className="lg:col-span-1 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50 group-hover:bg-primary/30 transition-colors">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight">Mindora</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Empowering students with AI-driven insights and structured learning paths for Olympiad excellence.
            </p>
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <span>support@mindora.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                <div className="p-2 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <span>123 Education Lane, Tech City</span>
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all"><Github className="w-4 h-4" /></Link>
              <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all"><Twitter className="w-4 h-4" /></Link>
              <Link href="#" className="p-2 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all"><Linkedin className="w-4 h-4" /></Link>
            </div>
          </div>

          {/* Product */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold mb-6 flex items-center gap-2">
              Product
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">BETA</span>
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Features</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Pricing Plans</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Live Classes</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Mock Tests</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> AI Mentor</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Success Stories</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Press & Media</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Partners</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold mb-6">Resources</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Study Guides</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Olympiad Syllabus</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Community Forum</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Parent's Guide</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="lg:col-span-1">
            <h4 className="font-semibold mb-6">Stay Updated</h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Join 10,000+ students. Get the latest exam tips and study hacks directly to your inbox.
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-muted/50 border border-border rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:border-primary transition-colors"
              />
              <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 group">
                Subscribe <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">
              By subscribing, you agree to our Privacy Policy and provide consent to receive updates.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Mindora Education. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-primary transition-colors">Cookie Settings</Link>
            <Link href="#" className="hover:text-primary transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 cursor-default">
      <AiGuide />
      <ThemeNav />
      <SideNav />
      {/* Remove Standard Header */}

      <main>
        <MinimalHero />
        <StickyNarrative />
        <ZLayerOlympiads />
        <ParallaxCards />
        <WhyChooseSection />
        <ReviewsSection />
        <MetricsSection />
        <DeveloperSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
