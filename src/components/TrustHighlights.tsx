import React from 'react';
import { motion } from 'motion/react';
import { ArrowDownUp, Calculator, Target, LineChart, ShieldCheck, Zap } from 'lucide-react';

const HIGHLIGHTS = [
  {
    icon: ArrowDownUp,
    badge: 'Real-Time',
    title: 'Track Income & Expenses',
    description: 'Log part-time jobs, stipends, allowances, and daily student expenses in seconds.',
    accent: 'from-[#e1694a]/15 to-transparent',
  },
  {
    icon: Calculator,
    badge: 'Auto-Paced',
    title: 'Plan Monthly Budgets',
    description: 'Set realistic caps for groceries, dining, books, and social outings without stress.',
    accent: 'from-[#e1694a]/20 to-transparent',
  },
  {
    icon: Target,
    badge: 'Milestones',
    title: 'Set Savings Goals',
    description: 'Save step-by-step for a new laptop, campus trip, or semester emergency fund.',
    accent: 'from-[#c85b40]/15 to-transparent',
  },
  {
    icon: LineChart,
    badge: 'Visual Trends',
    title: 'Understand Spending Habits',
    description: 'Clear category charts so you know exactly where every dollar goes each month.',
    accent: 'from-[#efaa94]/15 to-transparent',
  },
];

export default function TrustHighlights() {
  return (
    <section className="py-20 bg-gray-950 text-white border-b border-white/10 relative overflow-hidden">
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 bg-grid-subtle opacity-30 pointer-events-none z-0" />

      {/* Ambient glowing radial orbs with subtle pulse */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none -z-1 animate-pulse-glow" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-48 bg-[#e1694a]/5 rounded-full blur-3xl pointer-events-none -z-1 animate-pulse-glow" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Floating pill badge for motion and excitement */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/15 bg-white/5 backdrop-blur-md text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-[#e1694a] animate-ping" />
            <span>Built Specifically For College & University Students</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HIGHLIGHTS.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative p-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-white/25 shadow-lg hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-all duration-300 overflow-hidden"
              >
                {/* Subtle hover gradient highlight */}
                <div className={`absolute -inset-px opacity-0 group-hover:opacity-100 bg-gradient-to-b ${item.accent} transition-opacity duration-300 pointer-events-none`} />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-white group-hover:text-gray-950 transition-all duration-300 shadow-md">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-2 group-hover:text-gray-100 transition-colors relative z-10">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-normal relative z-10 group-hover:text-gray-300 transition-colors">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
