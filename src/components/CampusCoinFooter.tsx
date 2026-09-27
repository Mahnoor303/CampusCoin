import React from 'react';
import { Coins, Shield, Lock } from 'lucide-react';
import { InfoModalType } from './InfoModal';

interface CampusCoinFooterProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onOpenInfo: (type: InfoModalType) => void;
}

export default function CampusCoinFooter({
  onOpenAuth,
  onOpenInfo,
}: CampusCoinFooterProps) {
  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-950 border-t border-white/10 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white text-gray-950 flex items-center justify-center shadow-md">
                <Coins className="w-4 h-4 text-gray-950" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                CampusCoin
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-normal">
              A simpler way for students to track spending, manage budgets, and build better money habits.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <Shield className="w-3.5 h-3.5 text-[#e1694a]" />
              <span>Independent Student Tracker</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => scrollTo('#home')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#features')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Features & Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#how-it-works')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#dashboard-preview')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Live Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#benefits')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Student Benefits
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollTo('#faq')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Frequently Asked Questions
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Student Portal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Student Portal
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onOpenAuth('signin')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Student Login
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="hover:text-white transition-colors cursor-pointer text-white font-medium"
                >
                  Create Student Account
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('contact')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Student Support & Feedback
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Transparency */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Data & Privacy
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => onOpenInfo('privacy')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onOpenInfo('terms')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li className="text-[11px] text-gray-400 pt-2 leading-relaxed font-normal">
                CampusCoin is a personal finance tracker. It does not connect to bank accounts, process payments, or transfer funds.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div>
            © {new Date().getFullYear()} CampusCoin. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Lock className="w-3.5 h-3.5 text-[#e1694a]" />
              <span>Zero Bank Credentials Required</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
