import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Coins, ShieldCheck, Sparkles } from 'lucide-react';

interface FinalCTASectionProps {
  onOpenAuth: (mode: 'signup' | 'signin') => void;
}

export default function FinalCTASection({ onOpenAuth }: FinalCTASectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const yCard = useTransform(scrollYProgress, [0, 1], ['20px', '-20px']);

  return (
    <section
      ref={containerRef}
      className="py-24 md:py-36 bg-gray-950 text-white relative overflow-hidden text-center border-t border-white/10"
    >
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none z-0" />

      {/* Ambient glowing radial orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-[#e1694a]/10 via-white/5 to-[#c85b40]/10 rounded-full blur-3xl pointer-events-none -z-1 animate-pulse-glow" />

      {/* Floating infinite badges */}
      <div className="hidden lg:block absolute top-20 left-16 z-10 animate-float-slow pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-gray-900/90 border border-white/15 shadow-2xl text-xs font-semibold text-white flex items-center gap-2.5 backdrop-blur-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e1694a] animate-ping" />
          <span>Join 18,300+ Active Students</span>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-20 right-16 z-10 animate-float-reverse pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-gray-900/90 border border-white/15 shadow-2xl text-xs font-semibold text-white flex items-center gap-2.5 backdrop-blur-xl">
          <ShieldCheck className="w-4 h-4 text-[#e1694a]" />
          <span>No Credit Card or Bank Login</span>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          style={{ y: yCard }}
          initial={{ opacity: 0, scale: 0.96, y: 25 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="p-10 md:p-16 rounded-3xl bg-gray-900/80 border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.85)] relative overflow-hidden backdrop-blur-2xl"
        >
          {/* Logo Badge */}
          <div className="w-14 h-14 rounded-2xl bg-white text-gray-950 flex items-center justify-center mx-auto mb-8 shadow-[0_0_25px_rgba(255,255,255,0.3)]">
            <Coins className="w-7 h-7 text-gray-950" />
          </div>

          <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal text-white tracking-tight mb-5 leading-tight [text-shadow:_0_2px_24px_rgba(0,0,0,0.9)]">
            Your Money. Your Goals.{' '}
            <span className="font-display italic text-gray-200 block sm:inline font-normal">
              Your Campus Life.
            </span>
          </h2>

          <p className="text-base sm:text-lg text-gray-300 mb-10 max-w-xl mx-auto leading-relaxed font-normal">
            Start building better financial habits with CampusCoin. Track your allowances, set realistic semester budgets, and never run out before finals.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-950 px-9 py-4 rounded-full text-base font-semibold transition-all shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(255,255,255,0.45)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => onOpenAuth('signin')}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-full text-base font-medium transition-all shadow-md cursor-pointer hover:border-white/40 backdrop-blur-md"
            >
              Sign In to Your Account
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-[#e1694a]" />
            <span>Zero bank linking required • Free for all university students</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
