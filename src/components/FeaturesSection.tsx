import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import financeAnalyticsBg from '../assets/images/finance_analytics_abstract_1790439838268.jpg';
import {
  ArrowDownUp,
  LayoutDashboard,
  Tags,
  PieChart,
  Target,
  BarChart3,
  Lightbulb,
  History,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface FeatureItem {
  id: string;
  icon: any;
  title: string;
  shortDesc: string;
  detail: string;
  studentUseCase: string;
  previewPill: string;
}

const FEATURES: FeatureItem[] = [
  {
    id: 'tracking',
    icon: ArrowDownUp,
    title: 'Income & Expense Tracking',
    shortDesc: 'Record and organize money coming in and going out.',
    detail: 'Log part-time earnings, family allowances, meal purchases, and print station charges with a single tap.',
    studentUseCase: 'Log Rs 8.50 coffee & notes right after leaving your morning lecture.',
    previewPill: 'Manual Real-Time Logging',
  },
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Smart Dashboard',
    shortDesc: 'View monthly income, expenses, balance, and spending highlights.',
    detail: 'A high-level command center showing your current safe-to-spend allowance, recent transactions, and month status.',
    studentUseCase: 'Check your remaining allowance before agreeing to a weekend dinner.',
    previewPill: 'Instant Financial Pulse',
  },
  {
    id: 'categories',
    icon: Tags,
    title: 'Category Management',
    shortDesc: 'Organize transactions into useful categories.',
    detail: 'Pre-configured student categories: Campus Dining, Textbooks, Transit, Subscriptions, and Tuition Essentials.',
    studentUseCase: 'Tag expenses by semester course or living category.',
    previewPill: 'Tailored for College Life',
  },
  {
    id: 'budgets',
    icon: PieChart,
    title: 'Monthly Budgets',
    shortDesc: 'Set category budgets and monitor spending progress.',
    detail: 'Visual progress gauges show you when you are nearing your category limits before the month ends.',
    studentUseCase: 'Keep food delivery under Rs 150 and textbooks within the term allowance.',
    previewPill: 'Active Spending Guardrails',
  },
  {
    id: 'goals',
    icon: Target,
    title: 'Savings Goals',
    shortDesc: 'Define savings targets and track progress.',
    detail: 'Create personalized savings buckets for study abroad, emergency funds, or graduation gear.',
    studentUseCase: 'Track Rs 30/week towards next semester’s housing deposit.',
    previewPill: 'Visual Goal Milestones',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Reports & Analytics',
    shortDesc: 'Understand monthly spending patterns and compare income with expenses.',
    detail: 'Visual breakdown charts comparing your total allowance to outflows across the semester timeline.',
    studentUseCase: 'See which month had the highest non-essential spending.',
    previewPill: 'Semester Comparison',
  },
  {
    id: 'tips',
    icon: Lightbulb,
    title: 'Personalized Saving Tips',
    shortDesc: 'Get suggestions based on spending habits and financial goals.',
    detail: 'Smart reminders and habit prompts when category spending trends higher than your historical average.',
    studentUseCase: 'Helpful tips like swapping 2 dining hall takeouts to hit your savings goal.',
    previewPill: 'Actionable Advice',
  },
  {
    id: 'history',
    icon: History,
    title: 'Transaction History',
    shortDesc: 'Review, edit, and manage previous transactions.',
    detail: 'Fast search and filtering by category, date range, or tag to find any past receipt in seconds.',
    studentUseCase: 'Locate a book purchase receipt to split costs with a study partner.',
    previewPill: 'Searchable Audit Log',
  },
];

export default function FeaturesSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  const [selectedFeature, setSelectedFeature] = useState<FeatureItem>(FEATURES[0]);

  return (
    <section
      id="features"
      ref={containerRef}
      className="py-24 md:py-32 bg-[#FAFAFA] border-t border-gray-200/70 relative overflow-hidden"
    >
      {/* Background Architectural Dot Matrix Pattern */}
      <div className="absolute inset-0 bg-dot-subtle opacity-85 pointer-events-none z-0" />

      {/* Finance Analytics Background Image: Visibly discernible at ~0.32 opacity */}
      <motion.div
        style={{ y: yBg }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        <img
          src={financeAnalyticsBg}
          alt="Finance Analytics Abstract Texture"
          className="w-full h-[125%] object-cover opacity-30 md:opacity-35 filter contrast-115 saturate-105"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFA]/80 via-[#FAFAFA]/40 to-[#FAFAFA]/85" />
      </motion.div>

      {/* Floating interactive indicator chip with infinite float */}
      <div className="hidden lg:block absolute top-16 left-12 z-10 animate-float-slow pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-gray-200/90 shadow-xl text-xs font-semibold text-gray-800 flex items-center gap-2.5 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-950 animate-ping" />
          <span>8 Integrated Tools for University Students</span>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-20 right-12 z-10 animate-float-reverse pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-gray-200/90 shadow-xl text-xs font-semibold text-gray-800 flex items-center gap-2.5 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-gray-950" />
          <span>Auto-Categorization & Pacing</span>
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
              Core Capabilities
            </span>
            <span className="w-6 h-px bg-gray-300" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-gray-950 tracking-tight leading-tight">
            Everything students need to{' '}
            <span className="font-display italic text-[#64748B] block sm:inline font-normal">
              master their money.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-4 leading-relaxed font-normal">
            Eight essential personal finance tools crafted specifically for university life, monthly allowances, and student budgets.
          </p>
        </motion.div>

        {/* Feature Grid & Interactive Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 8 Cards in a 2-column grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              const isSelected = selectedFeature.id === feature.id;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-30px' }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  whileHover={{ y: -4, scale: 1.01 }}
                  onClick={() => setSelectedFeature(feature)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 text-left relative overflow-hidden ${
                    isSelected
                      ? 'bg-white border-gray-950 shadow-xl ring-2 ring-gray-300'
                      : 'bg-white/95 border-gray-200/90 hover:border-gray-400 hover:shadow-lg backdrop-blur-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-black text-white shadow-md'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
                      0{idx + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-gray-950 mb-1.5 flex items-center justify-between">
                    <span>{feature.title}</span>
                    {isSelected && <ChevronRight className="w-4 h-4 text-gray-900" />}
                  </h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    {feature.shortDesc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Right: Live Interactive Deep Dive Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 sticky top-28"
          >
            <div className="p-7 rounded-3xl bg-white/95 border border-gray-200/90 shadow-2xl text-left relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 w-32 h-32 bg-grid-subtle opacity-50 pointer-events-none" />

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                  {selectedFeature.previewPill}
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white mb-5 shadow-md">
                <selectedFeature.icon className="w-7 h-7 text-gray-200" />
              </div>

              <h3 className="text-xl font-bold text-gray-950 mb-2">
                {selectedFeature.title}
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed mb-6">
                {selectedFeature.detail}
              </p>

              {/* Student Scenario Box */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 mb-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gray-950" />
                  <span>Student Scenario</span>
                </div>
                <p className="text-xs text-[#64748B] italic">
                  "{selectedFeature.studentUseCase}"
                </p>
              </div>

              <div className="space-y-2 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#c85b40] shrink-0" />
                  <span>Designed without bank login requirements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#c85b40] shrink-0" />
                  <span>Fast manual entry optimized for mobile & laptop</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
