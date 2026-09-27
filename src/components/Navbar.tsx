import { useState, useEffect } from 'react';
import { Coins, Menu, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
interface NavbarProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Live Dashboard', href: '#dashboard-preview' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'FAQ', href: '#faq' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-3 sm:top-4 inset-x-0 z-50 px-4 sm:px-6 pointer-events-none transition-all duration-300">
      <div className="max-w-5xl mx-auto pointer-events-auto relative">
        <nav
          className={`w-full rounded-2xl md:rounded-full transition-all duration-300 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between ${
            scrolled
              ? 'bg-white/95 backdrop-blur-xl border border-gray-200/90 shadow-[0_12px_35px_rgba(0,0,0,0.12)]'
              : 'bg-white/90 backdrop-blur-lg border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
          }`}
        >
          {/* Brand Logo */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('#home');
            }}
            className="flex items-center gap-2.5 sm:gap-3 group cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-950 text-white flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-black transition-all duration-300">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12 text-[#e1694a]" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base sm:text-lg font-bold tracking-tight text-gray-950 group-hover:text-black transition-colors flex items-center gap-1.5">
                CampusCoin
                <span className="w-1.5 h-1.5 rounded-full bg-[#e1694a] animate-pulse" />
              </span>
              <span className="text-[9px] sm:text-[10px] -mt-1 font-semibold text-gray-500 uppercase tracking-widest">
                Student Finance
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links - Centered */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100/90 border border-gray-200/70 px-2.5 py-1 rounded-full">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href);
                }}
                className="text-xs lg:text-sm font-medium text-gray-600 hover:text-gray-950 px-3 py-1.5 rounded-full hover:bg-white hover:shadow-xs transition-all duration-200 cursor-pointer"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right CTA / Auth Buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            <button
              onClick={() => onOpenAuth('signin')}
              className="text-xs lg:text-sm font-semibold text-gray-700 hover:text-gray-950 px-3.5 py-2 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="bg-gray-950 hover:bg-gray-800 text-white px-5 py-2 rounded-full text-xs lg:text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onOpenAuth('signup')}
              className="bg-gray-950 text-white px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-gray-800 transition-colors shadow-xs"
            >
              Get Started
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-gray-700 hover:text-gray-950 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile Glassmorphic Dropdown in White */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white/98 backdrop-blur-2xl border border-gray-200 rounded-2xl px-5 py-5 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(link.href);
                  }}
                  className="text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 px-3 py-2.5 rounded-xl transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-gray-800 border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signup');
                }}
                className="w-full text-center py-2.5 rounded-xl text-sm font-semibold bg-gray-950 text-white hover:bg-gray-800 transition-colors shadow-md"
              >
                Get Started Free
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
