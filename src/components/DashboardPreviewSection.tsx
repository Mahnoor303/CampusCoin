import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
  Filter,
  CheckCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import HlsVideoBackground from './HlsVideoBackground';

const TRANSACTIONS_DATA = {
  month: [
    { id: 1, title: 'Calculus Study Guide', category: 'Books & Supplies', date: 'Today, 2:15 PM', amount: -28.50, type: 'expense' },
    { id: 2, title: 'Monthly Allowance Transfer', category: 'Allowance', date: 'Yesterday', amount: 800.00, type: 'income' },
    { id: 3, title: 'Campus Dining Meal Card Refill', category: 'Food & Dining', date: 'Sep 24', amount: -65.00, type: 'expense' },
    { id: 4, title: 'Math Tutoring Hourly Wage', category: 'Part-Time Job', date: 'Sep 22', amount: 450.00, type: 'income' },
    { id: 5, title: 'Subway & City Bus Monthly Pass', category: 'Transportation', date: 'Sep 20', amount: -45.00, type: 'expense' },
    { id: 6, title: 'Coffee & Printing at Student Center', category: 'Personal & Study', date: 'Sep 18', amount: -8.75, type: 'expense' },
  ],
  recent: [
    { id: 1, title: 'Calculus Study Guide', category: 'Books & Supplies', date: 'Today, 2:15 PM', amount: -28.50, type: 'expense' },
    { id: 2, title: 'Monthly Allowance Transfer', category: 'Allowance', date: 'Yesterday', amount: 800.00, type: 'income' },
    { id: 3, title: 'Campus Dining Meal Card Refill', category: 'Food & Dining', date: 'Sep 24', amount: -65.00, type: 'expense' },
  ],
  term: [
    { id: 1, title: 'Calculus Study Guide', category: 'Books & Supplies', date: 'Today, 2:15 PM', amount: -28.50, type: 'expense' },
    { id: 2, title: 'Monthly Allowance Transfer', category: 'Allowance', date: 'Yesterday', amount: 800.00, type: 'income' },
    { id: 3, title: 'Campus Dining Meal Card Refill', category: 'Food & Dining', date: 'Sep 24', amount: -65.00, type: 'expense' },
    { id: 4, title: 'Math Tutoring Hourly Wage', category: 'Part-Time Job', date: 'Sep 22', amount: 450.00, type: 'income' },
    { id: 5, title: 'Subway & City Bus Monthly Pass', category: 'Transportation', date: 'Sep 20', amount: -45.00, type: 'expense' },
    { id: 6, title: 'Coffee & Printing at Student Center', category: 'Personal & Study', date: 'Sep 18', amount: -8.75, type: 'expense' },
    { id: 7, title: 'Biology Lab Kit Purchase', category: 'Academic', date: 'Sep 10', amount: -110.00, type: 'expense' },
    { id: 8, title: 'Campus Work-Study Stipend', category: 'Part-Time Job', date: 'Sep 01', amount: 420.00, type: 'income' },
  ],
};

export default function DashboardPreviewSection() {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Parallax transform on video & container
  const yVideo = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  const yFrame = useTransform(scrollYProgress, [0, 1], ['20px', '-20px']);

  const [activeRange, setActiveRange] = useState<'month' | 'term' | 'recent'>('month');
  const transactions = TRANSACTIONS_DATA[activeRange];

  return (
    <section
      id="dashboard-preview"
      ref={containerRef}
      className="py-24 md:py-32 bg-gray-950 text-white border-y border-white/10 relative overflow-hidden"
    >
      {/* Architectural Dot Grid Behind Dashboard Section */}
      <div className="absolute inset-0 bg-dot-subtle opacity-30 pointer-events-none z-0" />

      {/* Background Streaming Video with Parallax Drift - Clearly Visible in Dark Mode */}
      <motion.div style={{ y: yVideo }} className="absolute inset-0 pointer-events-none z-0">
        <HlsVideoBackground
          src="https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8"
          className="opacity-70"
          videoClassName="object-cover opacity-85 filter brightness-90"
        />
        {/* Soft edge blend only, keeping center video crisp and visible */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-950/40 to-gray-950" />
      </motion.div>

      {/* Floating infinite animated metric badges */}
      <div className="hidden lg:block absolute top-28 right-10 z-10 animate-float-slow pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-gray-900/90 border border-white/15 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#e1694a] animate-ping" />
          <span className="text-xs font-semibold text-white">Live Campus Feed Active</span>
        </div>
      </div>

      <div className="hidden lg:block absolute bottom-28 left-8 z-10 animate-float-reverse pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-gray-900/90 border border-white/15 shadow-2xl backdrop-blur-xl flex items-center gap-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[#e1694a]" />
          <span className="text-xs font-semibold text-white">Instant Budget Sync</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-6 h-px bg-white/20" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Live Interface Walkthrough
            </span>
            <span className="w-6 h-px bg-white/20" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-white tracking-tight leading-tight [text-shadow:_0_2px_20px_rgba(0,0,0,0.8)]">
            A dashboard built for{' '}
            <span className="font-display italic text-gray-200 block sm:inline font-normal">
              clarity and control.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-300 mt-3 leading-relaxed font-normal">
            See your allowance, daily expenses, savings milestones, and safe-to-spend balance in one cohesive, uncluttered view.
          </p>
        </motion.div>

        {/* Dashboard Preview Container in Dark Glass with Parallax Drift */}
        <motion.div
          style={{ y: yFrame }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.8 }}
          className="bg-gray-950/85 rounded-3xl border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-2xl"
        >
          {/* Top Bar of Dashboard Preview */}
          <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white text-gray-950 flex items-center justify-center text-xs font-bold shadow-md">
                CC
              </div>
              <div>
                <span className="text-xs font-bold text-white block">CampusCoin Student Portal</span>
                <span className="text-[10px] text-gray-400 block">Fall 2026 Academic Term</span>
              </div>
            </div>

            {/* Time Filter Pills */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15 text-xs shadow-xs">
              <button
                onClick={() => setActiveRange('month')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeRange === 'month'
                    ? 'bg-white text-gray-950 shadow-md font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Current Month
              </button>
              <button
                onClick={() => setActiveRange('recent')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeRange === 'recent'
                    ? 'bg-white text-gray-950 shadow-md font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setActiveRange('term')}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  activeRange === 'term'
                    ? 'bg-white text-gray-950 shadow-md font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Full Semester
              </button>
            </div>
          </div>

          {/* Main Dashboard Inner Grid */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Total Inflow</span>
                  <span className="p-1 rounded-md bg-[#e1694a]/20 text-[#e1694a]">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">Rs 1,250.00</div>
                <div className="text-[11px] text-[#e1694a] mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3 h-3" /> Allowance + Tutoring
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Total Spent</span>
                  <span className="p-1 rounded-md bg-[#e1694a]/15 text-[#c85b40]">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">Rs 627.50</div>
                <div className="text-[11px] text-gray-400 mt-1">50.2% of total income</div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Remaining Balance</span>
                  <span className="p-1 rounded-md bg-white/10 text-white">
                    <Wallet className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">Rs 622.50</div>
                <div className="text-[11px] text-gray-300 mt-1 font-medium">Available to spend</div>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Daily Safe Pace</span>
                  <span className="p-1 rounded-md bg-[#e1694a]/15 text-[#c85b40]">
                    <Calendar className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-2xl font-bold text-white tabular-nums">Rs 34.58 / day</div>
                <div className="text-[11px] text-[#e1694a] mt-1 font-medium">18 days left in month</div>
              </div>
            </div>

            {/* Split Section: Category Progress & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Category Spending Progress (7 cols) */}
              <div className="lg:col-span-7 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-base font-semibold text-white">Monthly Category Breakdown</h3>
                    <p className="text-xs text-gray-400">Live progress against planned monthly caps</p>
                  </div>
                  <PieChart className="w-4 h-4 text-gray-400" />
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-200 font-medium">Food & Dining</span>
                      <span className="text-gray-400 tabular-nums">
                        <strong className="text-white">Rs 245.00</strong> of Rs 300.00 (81%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full w-[81%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-200 font-medium">Academic Books & Printing</span>
                      <span className="text-gray-400 tabular-nums">
                        <strong className="text-white">Rs 142.50</strong> of Rs 200.00 (71%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#e1694a] rounded-full w-[71%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-200 font-medium">Transit & Commute</span>
                      <span className="text-gray-400 tabular-nums">
                        <strong className="text-white">Rs 75.00</strong> of Rs 100.00 (75%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#e1694a] rounded-full w-[75%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-gray-200 font-medium">Personal & Entertainment</span>
                      <span className="text-gray-400 tabular-nums">
                        <strong className="text-white">Rs 165.00</strong> of Rs 200.00 (82%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#efaa94] rounded-full w-[82%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger (5 cols) */}
              <div className="lg:col-span-5 p-6 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">Recent Transactions</h3>
                    <p className="text-xs text-gray-400">{transactions.length} entries shown</p>
                  </div>
                  <span className="text-[11px] text-gray-300 bg-white/10 px-2.5 py-1 rounded-full border border-white/15 font-medium">
                    Manual Ledger
                  </span>
                </div>

                <div className="space-y-2.5">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-xs shadow-xs hover:border-white/20 hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-white">{tx.title}</div>
                        <div className="text-[10px] text-gray-400">{tx.category} • {tx.date}</div>
                      </div>
                      <div
                        className={`font-bold tabular-nums ${
                          tx.type === 'income' ? 'text-[#e1694a]' : 'text-gray-200'
                        }`}
                      >
                        {tx.type === 'income' ? `+Rs ${tx.amount.toFixed(2)}` : `-Rs ${Math.abs(tx.amount).toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
