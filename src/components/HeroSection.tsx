import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, type Variants } from 'motion/react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  TrendingUp,
  ArrowRight,
  Shield,
  PlusCircle,
  Coffee,
  BookOpen,
  Utensils,
  Bus,
  CheckCircle2,
  Star,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HeroSectionProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

interface SimulatedTransaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  time: string;
  icon: any;
  color: string;
}

const INITIAL_TRANSACTIONS: SimulatedTransaction[] = [
  {
    id: 'tx-1',
    name: 'Campus Coffee & Bagel',
    category: 'Food & Dining',
    amount: -5.75,
    time: '20 min ago',
    icon: Coffee,
    color: 'text-[#e1694a] bg-[#e1694a]/10 border-[#e1694a]/20',
  },
  {
    id: 'tx-2',
    name: 'Monthly Allowance Deposit',
    category: 'Allowance',
    amount: 650.0,
    time: 'Yesterday',
    icon: Wallet,
    color: 'text-neutral-200 bg-white/10 border-white/15',
  },
  {
    id: 'tx-3',
    name: 'Organic Chemistry Lab Manual',
    category: 'Academic Books',
    amount: -42.0,
    time: 'Sep 24',
    icon: BookOpen,
    color: 'text-[#efaa94] bg-[#e1694a]/10 border-[#e1694a]/20',
  },
  {
    id: 'tx-4',
    name: 'Campus Shuttle Pass',
    category: 'Transit',
    amount: -25.0,
    time: 'Sep 22',
    icon: Bus,
    color: 'text-[#c85b40] bg-[#e1694a]/10 border-[#e1694a]/20',
  },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

export default function HeroSection({ onOpenAuth }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Subtle parallax effects using useScroll and useTransform
  const yVideo = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const yContent = useTransform(scrollYProgress, [0, 1], ['0%', '-6%']);
  const opacityContent = useTransform(scrollYProgress, [0, 0.85], [1, 0.3]);

  const [activeTab, setActiveTab] = useState<'expenses' | 'budget' | 'goals' | 'analytics'>('expenses');
  const [transactions, setTransactions] = useState<SimulatedTransaction[]>(INITIAL_TRANSACTIONS);
  const [balance, setBalance] = useState<number>(577.25);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    const tabs: Array<'expenses' | 'budget' | 'goals' | 'analytics'> = [
      'expenses',
      'budget',
      'goals',
      'analytics',
    ];
    const timer = setInterval(() => {
      setActiveTab((curr) => {
        const nextIdx = (tabs.indexOf(curr) + 1) % tabs.length;
        return tabs[nextIdx];
      });
    }, 6500);
    return () => clearInterval(timer);
  }, []);

  const handleAddQuickExpense = () => {
    const quickItems = [
      { name: 'Iced Matcha Latte', category: 'Food & Dining', amount: -6.20, icon: Coffee, color: 'text-[#e1694a] bg-[#e1694a]/10 border-[#e1694a]/20' },
      { name: 'Late-Night Pizza Slice', category: 'Food & Dining', amount: -8.50, icon: Utensils, color: 'text-[#efaa94] bg-[#e1694a]/10 border-[#e1694a]/20' },
      { name: 'Library Printing Credit', category: 'Academic', amount: -4.00, icon: BookOpen, color: 'text-[#c85b40] bg-[#e1694a]/10 border-[#e1694a]/20' },
    ];
    const item = quickItems[Math.floor(Math.random() * quickItems.length)];
    const newTx: SimulatedTransaction = {
      id: `tx-${Date.now()}`,
      name: item.name,
      category: item.category,
      amount: item.amount,
      time: 'Just now',
      icon: item.icon,
      color: item.color,
    };
    setTransactions((prev) => [newTx, ...prev.slice(0, 4)]);
    setBalance((prev) => Number((prev + item.amount).toFixed(2)));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden bg-gray-950 text-white"
    >
      {/* Background Video: Clearly visible with subtle parallax drift and dark bottom fade */}
      <motion.div
        style={{ y: yVideo }}
        className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_165750_358b1e72-c921-48b7-aaac-f200994f32fb.mp4"
          className="w-full h-full object-cover opacity-90 filter brightness-95"
        />
        {/* Soft dark gradient overlays to ensure text is 100% readable while video shines */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-transparent to-gray-950" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />
      </motion.div>

      {/* Floating parallax ambient chips with infinite floating animation */}
      <div className="hidden xl:block absolute top-36 left-8 z-10 animate-float-slow pointer-events-none">
        <div className="bg-gray-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <Zap className="w-3.5 h-3.5 text-[#e1694a]" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 block font-medium">Daily Safe Spend</span>
            <span className="text-xs font-bold text-white">Rs 24.50 left today</span>
          </div>
        </div>
      </div>

      <div className="hidden xl:block absolute top-48 right-8 z-10 animate-float-reverse pointer-events-none">
        <div className="bg-gray-950/85 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/15 shadow-[0_0_20px_rgba(0,0,0,0.6)] flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#e1694a]/20 text-[#e1694a] flex items-center justify-center">
            <PiggyBank className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-gray-400 block font-medium">Laptop Milestone</span>
            <span className="text-xs font-bold text-[#e1694a]">75% Reached</span>
          </div>
        </div>
      </div>

      {/* Main Content: NO text container box - text floats freely on the hero */}
      <motion.div
        style={{ y: yContent, opacity: opacityContent }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-7xl mx-auto px-6 text-center"
      >
        {/* Rating Pill Badge */}
        <motion.div variants={itemVariants} className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-gray-950/70 text-gray-200 text-xs font-medium tracking-tight shadow-lg backdrop-blur-md">
            <Star className="w-3.5 h-3.5 fill-[#e1694a] text-[#e1694a]" />
            <span className="font-semibold text-white">4.9 rating</span>
            <span className="text-gray-400">from 18.3K+ students</span>
          </div>
        </motion.div>

        {/* Hero Heading: Direct white text with zero container box */}
        <motion.div variants={itemVariants} className="max-w-4xl mx-auto mb-8">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[80px] font-normal tracking-tight leading-[1.05] mb-5 text-white [text-shadow:_0_2px_24px_rgba(0,0,0,0.95)]">
            Take Control of Your{' '}
            <span className="font-display italic text-gray-200 block sm:inline font-normal">
              Student Finances.
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed mb-8 [text-shadow:_0_2px_14px_rgba(0,0,0,0.9)] font-normal">
            Track your spending, manage your monthly budget, and build better money habits — all in one place, designed for student life.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-5">
            <button
              onClick={() => onOpenAuth('signup')}
              className="w-full sm:w-auto bg-white hover:bg-gray-100 text-gray-950 px-8 py-3.5 rounded-full text-base font-semibold transition-all shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:shadow-[0_0_35px_rgba(255,255,255,0.45)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/25 px-7 py-3.5 rounded-full text-base font-medium transition-all shadow-md cursor-pointer hover:border-white/40 backdrop-blur-md"
            >
              Explore Features
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-gray-300 [text-shadow:_0_1px_8px_rgba(0,0,0,0.9)] font-medium">
            <Shield className="w-3.5 h-3.5 text-[#e1694a]" />
            <span>100% Private manual tracking • No bank credentials required</span>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* INTERACTIVE CAMPUSCOIN DASHBOARD SIMULATOR (DARK GLASSMORPHISM) */}
        {/* ========================================================================= */}
        <motion.div variants={itemVariants} className="max-w-5xl mx-auto mt-10">
          {/* Tab Filter Bar */}
          <div className="flex justify-center mb-5">
            <div className="bg-gray-950/80 backdrop-blur-xl p-1.5 rounded-2xl flex flex-wrap items-center justify-center gap-1 border border-white/15 shadow-2xl">
              <button
                onClick={() => setActiveTab('expenses')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'expenses'
                    ? 'bg-white text-gray-950 shadow-md font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Live Expense Tracker</span>
              </button>
              <button
                onClick={() => setActiveTab('budget')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'budget'
                    ? 'bg-white text-gray-950 shadow-md font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Monthly Budget</span>
              </button>
              <button
                onClick={() => setActiveTab('goals')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'goals'
                    ? 'bg-white text-gray-950 shadow-md font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <PiggyBank className="w-4 h-4" />
                <span>Savings Goals</span>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-white text-gray-950 shadow-md font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Spending Habits</span>
              </button>
            </div>
          </div>

          {/* Interactive Simulation Frame in Dark Glass */}
          <div className="bg-gray-950/85 border border-white/15 rounded-3xl p-6 md:p-8 shadow-[0_20px_80px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-left">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-xs text-gray-400 block mb-1">Available Allowance</span>
                <div className="text-2xl font-bold text-white tabular-nums">${balance.toFixed(2)}</div>
                <span className="text-[11px] text-[#e1694a] mt-1 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Safe for 18 days left
                </span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-xs text-gray-400 block mb-1">Month's Spent</span>
                <div className="text-2xl font-bold text-white tabular-nums">Rs 322.75</div>
                <span className="text-[11px] text-gray-400 mt-1 block">Budget cap: Rs 600.00</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-xs text-gray-400 block mb-1 font-medium">Savings Stash</span>
                <div className="text-2xl font-bold text-white tabular-nums">Rs 450.00</div>
                <span className="text-[11px] text-[#e1694a] mt-1 block font-medium">Laptop fund (75%)</span>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-xs text-gray-400 block mb-1">Avg Daily Spend</span>
                <div className="text-2xl font-bold text-white tabular-nums">Rs 14.20</div>
                <span className="text-[11px] text-[#e1694a] mt-1 block font-medium">↓ Rs 3.10 vs last week</span>
              </div>
            </div>

            {/* TAB CONTENTS */}
            <AnimatePresence mode="wait">
              {/* TAB 1: LIVE EXPENSES */}
              {activeTab === 'expenses' && (
                <motion.div
                  key="expenses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-white">Recent Student Ledger</h3>
                      <p className="text-xs text-gray-400">Manual log of money in & out. Try adding a demo expense!</p>
                    </div>
                    <button
                      onClick={handleAddQuickExpense}
                      className="inline-flex items-center gap-2 bg-white hover:bg-gray-200 text-gray-950 text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>{justAdded ? 'Added!' : '+ Add Demo Coffee'}</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {transactions.map((tx) => {
                      const IconComponent = tx.icon;
                      const isIncome = tx.amount > 0;
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${tx.color}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-white">{tx.name}</div>
                              <div className="text-[11px] text-gray-400 flex items-center gap-2">
                                <span>{tx.category}</span>
                                <span>•</span>
                                <span>{tx.time}</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`text-sm font-bold tabular-nums ${
                              isIncome ? 'text-[#e1694a]' : 'text-gray-200'
                            }`}
                          >
                            {isIncome ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: MONTHLY BUDGET */}
              {activeTab === 'budget' && (
                <motion.div
                  key="budget"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Monthly Category Budgets</h3>
                      <p className="text-xs text-gray-400">Set limits for student living expenses and track progress.</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 text-white border border-white/15">
                      Overall Budget: 54% spent
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Utensils className="w-3.5 h-3.5 text-[#e1694a]" /> Food & Dining
                      </span>
                      <span className="text-gray-400 tabular-nums">
                        <strong className="text-white">Rs 145.00</strong> / Rs 250.00
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full w-[58%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                      <span>Rs 105.00 remaining</span>
                      <span className="text-[#e1694a] font-medium">On Track</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-white flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-[#efaa94]" /> Academic & Books
                      </span>
                      <span className="text-gray-400 tabular-nums">
                        <strong className="text-white">Rs 88.00</strong> / Rs 100.00
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#efaa94] rounded-full w-[88%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                      <span>Rs 12.00 remaining</span>
                      <span className="text-[#efaa94] font-medium">Near Limit</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Bus className="w-3.5 h-3.5 text-[#c85b40]" /> Transit & Campus Commute
                      </span>
                      <span className="text-gray-400 tabular-nums">
                        <strong className="text-white">Rs 25.00</strong> / Rs 60.00
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#e1694a] rounded-full w-[41%]" />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                      <span>Rs 35.00 remaining</span>
                      <span className="text-[#e1694a] font-medium">Comfortable</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 3: SAVINGS GOALS */}
              {activeTab === 'goals' && (
                <motion.div
                  key="goals"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Student Savings Targets</h3>
                    <p className="text-xs text-gray-400">Allocate small savings each week toward semester goals.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">Emergency Buffer</h4>
                          <span className="text-xs text-gray-400">Target: End of semester</span>
                        </div>
                        <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                          82%
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white mb-2 tabular-nums">
                        Rs 410.00 <span className="text-xs font-normal text-gray-400">/ Rs 500.00</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-[#e1694a] rounded-full w-[82%]" />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Just Rs 90.00 left to complete this milestone!</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">New Study Laptop</h4>
                          <span className="text-xs text-gray-400">Target: Spring 2027</span>
                        </div>
                        <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-full border border-white/15">
                          52%
                        </span>
                      </div>
                      <div className="text-xl font-bold text-white mb-2 tabular-nums">
                        Rs 520.00 <span className="text-xs font-normal text-gray-400">/ Rs 1,000.00</span>
                      </div>
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full w-[52%]" />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">Saving Rs 40 / month puts you on schedule.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 4: SPENDING HABITS */}
              {activeTab === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">Where Your Money Goes</h3>
                    <p className="text-xs text-gray-400">Transparent breakdown of category spending for the current month.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs text-gray-400">Top Expense Category</span>
                      <div className="text-base font-bold text-white mt-1">Food & Groceries</div>
                      <div className="text-xs text-gray-300 font-semibold mt-1">45% of total budget</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs text-gray-400">Academic & Coursework</span>
                      <div className="text-base font-bold text-white mt-1">Textbooks & Labs</div>
                      <div className="text-xs text-gray-300 font-semibold mt-1">27% of total budget</div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-xs text-gray-400">Personal & Commute</span>
                      <div className="text-base font-bold text-white mt-1">Transit + Social</div>
                      <div className="text-xs text-[#e1694a] font-semibold mt-1">28% of total budget</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
