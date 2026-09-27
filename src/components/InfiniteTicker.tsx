import React from 'react';
import { Sparkles, ShieldCheck, TrendingUp, Users, Award, CheckCircle2 } from 'lucide-react';

const TICKER_ITEMS = [
  { icon: Users, label: '18,300+ University Students' },
  { label: 'Stanford' },
  { icon: ShieldCheck, label: '100% Private • No Bank Credentials' },
  { label: 'UC Berkeley' },
  { icon: TrendingUp, label: 'Average Rs 180 Saved Every Month' },
  { label: 'NYU Stern' },
  { icon: Sparkles, label: '4.9/5 Student Community Rating' },
  { label: 'UT Austin' },
  { icon: Award, label: 'Top-Rated Student Budgeting App' },
  { label: 'UCLA' },
  { icon: CheckCircle2, label: 'Fall 2026 Academic Ready' },
  { label: 'Michigan' },
  { icon: Users, label: 'Rs 1.4M+ Allowances Managed' },
  { label: 'Georgia Tech' },
  { icon: Sparkles, label: 'Zero Subscription Fees' },
  { label: 'Columbia' },
];

export default function InfiniteTicker() {
  return (
    <div className="relative py-3.5 bg-gray-950 border-b border-white/10 overflow-hidden select-none">
      {/* Edge gradient fades for smooth infinite stream effect */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-950 to-transparent z-10 pointer-events-none" />

      {/* Double loop marquee for seamless infinite looping */}
      <div className="flex animate-marquee whitespace-nowrap items-center gap-8">
        {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-xs text-xs font-medium text-gray-300 tracking-tight hover:border-white/20 transition-colors"
            >
              {Icon && <Icon className="w-3.5 h-3.5 text-[#e1694a]" />}
              <span>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
