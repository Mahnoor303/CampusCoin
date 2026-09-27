import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import financeSavingsBg from '../assets/images/finance_savings_student_1790439855556.jpg';
import {
  Compass,
  BellRing,
  CalendarCheck,
  PiggyBank,
  BrainCircuit,
  GraduationCap,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Compass,
    title: 'Gain Clear Visibility Into Daily Spending',
    description: 'Replace guesswork with a clean, continuous log of every dollar leaving your pocket each semester.',
  },
  {
    icon: CalendarCheck,
    title: 'Avoid Running Out of Money Before Month-End',
    description: 'Our dynamic daily safe-to-spend pace warns you before you overextend your allowance.',
  },
  {
    icon: BrainCircuit,
    title: 'Build Healthy Financial Habits During College',
    description: 'Develop discipline and financial mindfulness that carries into your post-graduation career.',
  },
  {
    icon: BellRing,
    title: 'Stay Constantly Aware of Budget Limits',
    description: 'Visual category trackers notify you when food delivery or entertainment creeps into textbook funds.',
  },
  {
    icon: PiggyBank,
    title: 'Set Aside Savings for Semesters & Emergencies',
    description: 'Build confidence with steady, incremental progress towards spring breaks, deposits, and emergency reserves.',
  },
  {
    icon: GraduationCap,
    title: 'Make Informed Decisions on Discretionary Spend',
    description: 'Know with certainty whether you can afford that concert ticket or study retreat this weekend.',
  },
];

export default function StudentBenefitsSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);
  const yCards = useTransform(scrollYProgress, [0, 1], ['20px', '-20px']);

  return (
    <section
      id="benefits"
      ref={containerRef}
      className="py-24 md:py-32 bg-white relative overflow-hidden border-t border-gray-100"
    >
      {/* Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-grid-subtle opacity-80 pointer-events-none z-0" />

      {/* Finance Savings Student Background Image: Visibly discernible with opacity ~0.35 */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        <img
          src={financeSavingsBg}
          alt="Student Savings Background"
          className="w-full h-[125%] object-cover opacity-35 md:opacity-40 filter saturate-105 contrast-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/35 to-white/85" />
      </motion.div>

      {/* Floating infinite badge */}
      <div className="hidden lg:block absolute top-16 left-12 z-10 animate-float-slow pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-gray-200/90 shadow-xl text-xs font-semibold text-gray-800 flex items-center gap-2.5 backdrop-blur-md">
          <GraduationCap className="w-4 h-4 text-gray-950" />
          <span>Tailored For College & Dorm Budgets</span>
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
              Long-Term Student Impact
            </span>
            <span className="w-6 h-px bg-gray-300" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-gray-950 tracking-tight leading-tight">
            Why students stick with{' '}
            <span className="font-display italic text-[#475569] block sm:inline font-normal">
              CampusCoin.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#475569] mt-4 leading-relaxed font-normal">
            Personal finance shouldn't feel like a chore. CampusCoin transforms overwhelming numbers into clear, actionable habits.
          </p>
        </motion.div>

        {/* Benefits 6-Grid with Parallax */}
        <motion.div
          style={{ y: yCards }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {BENEFITS.map((benefit, idx) => {
            const Icon = benefit.icon;
            return (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group p-8 rounded-3xl bg-white/95 border border-gray-200/90 shadow-md hover:border-gray-400 hover:shadow-2xl transition-all duration-300 backdrop-blur-md"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 mb-5 group-hover:scale-110 group-hover:bg-black group-hover:text-white transition-all duration-300 shadow-xs">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-950 mb-2.5 group-hover:text-black transition-colors">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed font-normal">
                  {benefit.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
