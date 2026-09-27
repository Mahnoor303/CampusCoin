import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  HelpCircle,
  TrendingDown,
  CalendarX,
  CreditCard,
  SearchX,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

const PROBLEMS = [
  {
    icon: SearchX,
    title: 'Losing Track of Daily Expenses',
    detail:
      'Frequent small purchases — Rs 4 iced coffees, print shop runs, and fast snacks between lectures — quickly add up without being noticed.',
    tag: 'Daily Blindspots',
  },
  {
    icon: TrendingDown,
    title: 'Overspending in Certain Categories',
    detail:
      'Late-night food orders, study group dinners, or subscription services quietly consume more of your budget than expected.',
    tag: 'Category Creep',
  },
  {
    icon: CalendarX,
    title: 'Difficulty Managing a Monthly Allowance',
    detail:
      'Starting the month with cash or a stipend and realizing by week three that there is barely enough left for essential academic supplies.',
    tag: 'Allowance Pacing',
  },
  {
    icon: CreditCard,
    title: 'Struggling to Save Consistently',
    detail:
      'Wanting to build an emergency fund or prepare for semester tuition, but unexpected social expenses repeatedly wipe out your savings.',
    tag: 'Goal Friction',
  },
  {
    icon: HelpCircle,
    title: 'Not Knowing Where Most Money Goes',
    detail:
      'Wondering where hundreds of dollars vanished at the end of every term without a clear, searchable record of your transactions.',
    tag: 'Lack of Visibility',
  },
];

export default function StudentProblemSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Parallax effect on background picture and cards
  const yBg = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  const yCards = useTransform(scrollYProgress, [0, 1], ['20px', '-20px']);

  return (
    <section
      ref={containerRef}
      className="py-24 md:py-32 bg-white relative overflow-hidden border-t border-gray-100"
    >
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-90 pointer-events-none z-0" />

      {/* Finance Background Image: Opacity tuned to ~0.35 so it's clearly visible without overpowering content */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        <img
          src="/src/assets/images/finance_student_desk_1790439817862.jpg"
          alt="Student Budget Planning Desk Background"
          className="w-full h-[125%] object-cover opacity-35 md:opacity-40 filter saturate-105 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/30 to-white/85" />
      </motion.div>

      {/* Floating infinite animated badges for visual depth */}
      <div className="hidden lg:block absolute top-20 right-12 z-10 animate-float-slow pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-gray-200/90 shadow-xl text-xs font-semibold text-gray-800 flex items-center gap-2.5 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e1694a] animate-ping" />
          <span>73% of students exceed dining budgets</span>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-24 left-10 z-10 animate-float-reverse pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-gray-200/90 shadow-xl text-xs font-semibold text-gray-800 flex items-center gap-2.5 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-[#c85b40]" />
          <span>CampusCoin tracks daily allowance pacing</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-6 h-px bg-gray-300" />
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">
              The Reality of Student Life
            </span>
            <span className="w-6 h-px bg-gray-300" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-gray-950 tracking-tight leading-tight">
            Managing money in college is hard.{' '}
            <span className="font-display italic text-[#475569] block sm:inline font-normal">
              It doesn't have to be.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#475569] mt-4 leading-relaxed font-normal">
            Between lectures, project deadlines, and social life, keeping an accurate mental tally of your spending is almost impossible. Here are the common challenges CampusCoin solves.
          </p>
        </motion.div>

        {/* 5 Problem Cards with Parallax offset */}
        <motion.div
          style={{ y: yCards }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {PROBLEMS.map((problem, idx) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group p-7 rounded-2xl bg-white/95 border border-gray-200/90 shadow-md hover:border-gray-400 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between backdrop-blur-md relative overflow-hidden"
              >
                {/* Subtle corner grid watermark */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-grid-subtle opacity-40 pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-medium text-gray-600 bg-gray-100/90 px-2.5 py-1 rounded-full border border-gray-200/70">
                      {problem.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-950 mb-2.5 group-hover:text-black transition-colors">
                    {problem.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-normal">
                    {problem.detail}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-semibold text-gray-800 group-hover:text-black transition-colors">
                  <span>Solved with CampusCoin</span>
                  <CheckCircle2 className="w-3.5 h-3.5 ml-1.5 text-[#c85b40]" />
                </div>
              </motion.div>
            );
          })}

          {/* 6th Card: Solution Spotlight */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className="p-7 rounded-2xl bg-gradient-to-br from-gray-50 via-white to-gray-100/90 border border-gray-300 shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden backdrop-blur-md"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-grid-subtle opacity-60 pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center text-white mb-5 shadow-sm">
                <Sparkles className="w-6 h-6 text-gray-200" />
              </div>
              <h3 className="text-lg font-semibold text-gray-950 mb-2.5">
                Built Around Your Semester Cadence
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed font-normal">
                CampusCoin gives you daily clarity without requiring confusing spreadsheets, bank connections, or complex accounting jargon.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <a
                href="#features"
                className="text-xs font-semibold text-gray-900 hover:text-black flex items-center gap-1.5 transition-colors"
              >
                <span>See all 8 core features below</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
