import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { UserCheck, Edit3, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenAuth: (mode: 'signup' | 'signin') => void;
}

const STEPS = [
  {
    step: '01',
    title: 'Create Your Account',
    description: 'Sign up in under 60 seconds with your student email and set up your profile currency and monthly stipend.',
    icon: UserCheck,
    highlights: ['No bank credentials required', '100% free for students', 'Private & secure profile'],
  },
  {
    step: '02',
    title: 'Track Your Money',
    description: 'Quickly record allowances, part-time wages, and daily expenses into categorized student buckets.',
    icon: Edit3,
    highlights: ['1-click quick add', 'Custom categories (Dining, Books, Rent)', 'Split expense tags'],
  },
  {
    step: '03',
    title: 'Understand & Improve',
    description: 'Review your visual dashboard, monitor category budgets in real time, and systematically reach savings targets.',
    icon: TrendingUp,
    highlights: ['Safe-to-spend allowance pacing', 'Overspending alerts', 'Semester milestone progress'],
  },
];

export default function HowItWorksSection({ onOpenAuth }: HowItWorksSectionProps) {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const yCards = useTransform(scrollYProgress, [0, 1], ['25px', '-25px']);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="py-24 md:py-32 bg-white relative overflow-hidden border-t border-gray-100"
    >
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-80 pointer-events-none z-0" />

      {/* Floating infinite badge */}
      <div className="hidden lg:block absolute top-16 right-16 z-10 animate-float-slow pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-gray-200 shadow-md text-xs font-semibold text-gray-800 flex items-center gap-2.5 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e1694a] animate-ping" />
          <span>60-Second Frictionless Setup</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-6 h-px bg-gray-300" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Simple 3-Step Routine
            </span>
            <span className="w-6 h-px bg-gray-300" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-gray-950 tracking-tight leading-tight">
            How CampusCoin works in{' '}
            <span className="font-display italic text-[#64748B] block sm:inline font-normal">
              three simple steps.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-4 leading-relaxed">
            No complex accounting curves. Just a fast, effortless daily routine that keeps your university finances under control.
          </p>
        </motion.div>

        {/* 3 Step Cards with Parallax Offset */}
        <motion.div
          style={{ y: yCards }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative"
        >
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                whileHover={{ y: -6 }}
                className="group relative p-8 rounded-3xl bg-white border border-gray-200/90 shadow-sm hover:border-gray-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl md:text-5xl font-display italic text-gray-400 group-hover:text-gray-700 transition-colors">
                      {item.step}
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-950 mb-3 group-hover:text-black transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-2">
                  {item.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs text-[#64748B]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gray-800 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <button
            onClick={() => onOpenAuth('signup')}
            className="inline-flex items-center gap-2.5 bg-black hover:bg-gray-800 text-white font-semibold px-8 py-3.5 rounded-full text-sm shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            <span>Start Step 01 Now — It's Free</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
