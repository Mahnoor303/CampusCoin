/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import TrustHighlights from './components/TrustHighlights';
import InfiniteTicker from './components/InfiniteTicker';
import StudentProblemSection from './components/StudentProblemSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import DashboardPreviewSection from './components/DashboardPreviewSection';
import StudentBenefitsSection from './components/StudentBenefitsSection';
import FAQSection from './components/FAQSection';
import FinalCTASection from './components/FinalCTASection';
import CampusCoinFooter from './components/CampusCoinFooter';
import StudentAuthModal from './components/StudentAuthModal';
import InfoModal, { InfoModalType } from './components/InfoModal';
import ScrollProgressBar from './components/ScrollProgressBar';
import DashboardApp from './dashboard/App';
import OnboardingWizard, { type OnboardingData } from './onboarding/OnboardingWizard';
import { getStoredUser, getToken, logoutStudent, updateProfile, type ApiUser } from './lib/api';
import { pushBackendTransaction, pushBackendGoal } from './lib/sync';

export default function App() {
  // Auth modal state ('signin' | 'signup')
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // App stage: landing → auth → onboarding (signup only) → dashboard
  // Returning users with a saved session skip straight to the dashboard.
  const [stage, setStage] = useState<'landing' | 'onboarding' | 'dashboard'>(() =>
    getToken() && getStoredUser() ? 'dashboard' : 'landing',
  );

  // Bumped once onboarding's backend pushes settle, so the freshly-mounted
  // dashboard re-fetches instead of showing stale zeros from its first fetch
  // (which races with those in-flight pushes).
  const [onboardingRefreshNonce, setOnboardingRefreshNonce] = useState(0);

  // Legal & Info modal state ('privacy' | 'terms' | 'contact' | null)
  const [infoModalType, setInfoModalType] = useState<InfoModalType>(null);

  const handleSignOut = () => {
    void logoutStudent(); // clear backend session + local storage (best-effort)
    setStage('landing');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Sign up → 3-step onboarding wizard; sign in → straight to (student) dashboard.
  // submitMode is captured by the modal at submit time, so a mid-request tab switch can't redirect wrongly.
  const handleAuthSuccess = (_user: ApiUser | undefined, submitMode: 'signin' | 'signup') => {
    setStage(submitMode === 'signup' ? 'onboarding' : 'dashboard');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Push onboarding answers to the backend: profile + the planned amount becomes
  // a real income transaction and a savings goal, so the dashboard shows it right away.
  const handleOnboardingComplete = (data: OnboardingData) => {
    setStage('dashboard');
    window.scrollTo({ top: 0, behavior: 'auto' });
    const pushes: Promise<unknown>[] = [
      updateProfile({
        monthlyAllowanceBaseline: data.income,
        monthlySavingsGoal: data.goal,
      }).catch(() => {
        /* profile sync is best-effort — the dashboard still works with local data */
      }),
    ];
    // The amount the user entered during the wizard becomes visible on the dashboard:
    if (data.income > 0) {
      pushes.push(
        pushBackendTransaction({
          type: 'Income',
          amount: data.income,
          title: data.incomeSource ? `${data.incomeSource} income` : 'Monthly income',
          note: `Planned ${data.incomeFrequency || 'monthly'} income from onboarding`,
          category: 'Allowance',
          date: new Date().toISOString().slice(0, 10),
        }).catch(() => {}),
      );
    }
    if (data.goal > 0) {
      pushes.push(
        pushBackendGoal({
          name: data.goalLabel ? `${data.goalLabel} savings goal` : 'My savings goal',
          targetAmount: data.goal,
          currentAmount: 0,
          deadline: '',
        }).catch(() => {}),
      );
    }
    // Once every push has settled, tell the dashboard to re-fetch — its initial
    // fetch raced with these requests and saw none of them.
    void Promise.allSettled(pushes).then(() => setOnboardingRefreshNonce((n) => n + 1));
  };

  if (stage === 'onboarding') {
    return (
      <OnboardingWizard
        onComplete={handleOnboardingComplete}
        onExit={handleSignOut}
      />
    );
  }

  // Signed-in students land directly in the dashboard (admin + student views)
  if (stage === 'dashboard') {
    return <DashboardApp onSignOut={handleSignOut} onboardingRefreshNonce={onboardingRefreshNonce} />;
  }

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenInfo = (type: InfoModalType) => {
    setInfoModalType(type);
  };

  return (
    <div className="bg-gray-950 min-h-screen text-gray-900 selection:bg-gray-900 selection:text-white font-sans overflow-x-hidden relative">
      {/* 0. SCROLL PROGRESS BAR */}
      <ScrollProgressBar />

      {/* 1. STICKY NAVBAR */}
      <Navbar onOpenAuth={handleOpenAuth} />

      {/* MAIN LANDING PAGE CONTENT */}
      <main>
        {/* SECTION 1 — HERO & INTERACTIVE SIMULATOR (WITH AMBIENT VIDEO & PARTICLES) */}
        <HeroSection onOpenAuth={handleOpenAuth} />

        {/* SECTION 2 — TRUST / VALUE HIGHLIGHTS */}
        <TrustHighlights />

        {/* INFINITE MARQUEE TICKER: UNIVERSITIES & COMMUNITY PROOF */}
        <InfiniteTicker />

        {/* SECTION 3 — THE STUDENT MONEY PROBLEM */}
        <StudentProblemSection />

        {/* SECTION 4 — FEATURES (8 CORE CAPABILITIES + INTERACTIVE PREVIEW) */}
        <FeaturesSection />

        {/* SECTION 5 — HOW CAMPUSCOIN WORKS (3 STEPS) */}
        <HowItWorksSection onOpenAuth={handleOpenAuth} />

        {/* SECTION 6 — DASHBOARD PREVIEW */}
        <DashboardPreviewSection />

        {/* SECTION 7 — STUDENT BENEFITS */}
        <StudentBenefitsSection />

        {/* SECTION 8 — FREQUENTLY ASKED QUESTIONS */}
        <FAQSection />

        {/* SECTION 9 — FINAL CALL TO ACTION (WITH AMBIENT VIDEO & PARTICLES) */}
        <FinalCTASection onOpenAuth={handleOpenAuth} />
      </main>

      {/* FOOTER */}
      <CampusCoinFooter
        onOpenAuth={handleOpenAuth}
        onOpenInfo={handleOpenInfo}
      />

      {/* AUTHENTICATION MODAL (LOGIN & REGISTRATION) */}
      <StudentAuthModal
        isOpen={authModalOpen}
        mode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSwitchMode={(mode) => setAuthMode(mode)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* INFORMATION MODAL (PRIVACY, TERMS, CONTACT) */}
      <InfoModal
        type={infoModalType}
        onClose={() => setInfoModalType(null)}
      />
    </div>
  );
}
