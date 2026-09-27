import React from 'react';
import { Sparkles, Shield, TrendingUp, Wallet, CheckCircle2, Zap } from 'lucide-react';

const TICKER_ITEMS = [
  { icon: Shield, text: 'Zero Bank Credentials Required' },
  { icon: Zap, text: '1-Tap Daily Expense Logging' },
  { icon: Wallet, text: 'Safe-To-Spend Allowance Pacing' },
  { icon: TrendingUp, text: 'Real-Time Semester Budget Limits' },
  { icon: CheckCircle2, text: 'Target Savings Milestones' },
  { icon: Sparkles, text: 'Built Specifically for University Life' },
];

export default function InfiniteFinanceTicker() {
  return (
    <div className="py-4 bg-gray-50/80 border-y border-gray-200/80 overflow-hidden relative select-none">
      {/* Subtle edge fades */}
      <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div className="animate-marquee flex items-center gap-10">
        {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="flex items-center gap-2.5 text-xs font-medium text-[#64748B] hover:text-gray-950 transition-colors shrink-0"
            >
              <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-800 shadow-2xs">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="tracking-tight">{item.text}</span>
              <span className="text-gray-300 ml-4">•</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
