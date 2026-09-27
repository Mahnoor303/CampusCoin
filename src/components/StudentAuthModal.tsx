import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Coins, Check, Eye, EyeOff, Chrome, Github, GraduationCap } from 'lucide-react';
import { registerStudent, loginStudent, type ApiUser } from '../lib/api';
import { requestPasswordReset, resetPasswordWithToken } from '../lib/sync';

interface StudentAuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'signin' | 'signup') => void;
  /** Receives the authenticated user + the mode that was active on submit (signup → wizard, signin → dashboard). */
  onAuthSuccess?: (user: ApiUser | undefined, submitMode: 'signin' | 'signup') => void;
}

export default function StudentAuthModal({
  isOpen,
  mode,
  onClose,
  onSwitchMode,
  onAuthSuccess,
}: StudentAuthModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  // ── Password reset flow (A6): forgot → token → new password. ──
  const [resetStage, setResetStage] = useState<'none' | 'request' | 'confirm'>('none');
  const [resetToken, setResetToken] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthError(null);
    setResetMessage(null);
    setAuthLoading(true);
    try {
      const result = await requestPasswordReset(resetEmail);
      if (result.resetToken) {
        // Dev mode: the backend returns the raw token so the flow is testable.
        setResetToken(result.resetToken);
        setResetMessage(`Reset token (dev): ${result.resetToken} — it has been filled in for you. Expires in ${result.expiresInMinutes ?? 30} min.`);
        setResetStage('confirm');
      } else {
        setResetMessage('If that email is registered, a reset link has been sent.');
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not send the reset request.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    setAuthError(null);
    setAuthLoading(true);
    try {
      const result = await resetPasswordWithToken(resetToken.trim(), password);
      setAuthSuccess(true);
      setResetStage('none');
      setResetToken('');
      setResetMessage('Password reset! Signing you in…');
      setTimeout(() => {
        setAuthSuccess(false);
        onClose();
        setPassword('');
        onAuthSuccess?.(result.user, 'signin');
      }, 1200);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Password reset failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authLoading) return;
    // Capture the mode now — switching tabs mid-request must not change the flow.
    const submitMode = mode;
    setAuthError(null);
    setAuthLoading(true);
    try {
      const name = `${firstName} ${lastName}`.trim();
      const result =
        submitMode === 'signup'
          ? await registerStudent({ name: name || 'Student', email, password })
          : await loginStudent(email, password);
      setAuthSuccess(true);
      setTimeout(() => {
        setAuthSuccess(false);
        onClose();
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        onAuthSuccess?.(result.user, submitMode);
      }, 1200);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in-overlay overflow-y-auto">
        <div className="relative w-full max-w-5xl max-h-[96vh] rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl flex flex-col my-auto text-white">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <main className="flex min-h-[580px] w-full bg-black selection:bg-white/30 p-2 transition-all duration-500 lg:h-[740px] lg:overflow-hidden lg:p-4">
            {/* Left Column: Campus Life Video & Staggered Steps */}
            <div className="w-[50%] hidden lg:flex relative flex-col items-center justify-end pb-24 px-10 rounded-3xl overflow-hidden shadow-2xl h-full border border-white/5">
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source
                  src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4"
                  type="video/mp4"
                />
              </video>

              {/* Tint gradient for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20" />

              <div className="z-10 w-full max-w-sm space-y-6 text-center">
                {/* Brand icon + CampusCoin */}
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center shadow-md">
                    <Coins className="w-4 h-4 text-black" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-white">
                    CampusCoin
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h2 className="text-3xl font-medium tracking-tight text-white">
                    {mode === 'signup' ? 'Join CampusCoin' : 'Welcome Back'}
                  </h2>
                  <p className="text-white/70 text-xs leading-relaxed px-4">
                    {mode === 'signup'
                      ? 'Follow these 3 simple phases to activate your student workspace.'
                      : 'Access your logged transactions, savings milestones, and budgets.'}
                  </p>
                </div>

                <div className="space-y-2.5 text-left">
                  {mode === 'signup' ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white text-black font-medium text-xs shadow-md">
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold">
                          1
                        </span>
                        <span>Register student identity & campus</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white/80 font-medium text-xs">
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[11px] font-bold">
                          2
                        </span>
                        <span>Set your monthly allowance cap</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white/80 font-medium text-xs">
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[11px] font-bold">
                          3
                        </span>
                        <span>Start logging daily expenses</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white text-black font-medium text-xs shadow-md">
                        <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold">
                          1
                        </span>
                        <span>Verify student email credentials</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white/80 font-medium text-xs">
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[11px] font-bold">
                          2
                        </span>
                        <span>Load semester transaction history</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/10 text-white/80 font-medium text-xs">
                        <span className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[11px] font-bold">
                          3
                        </span>
                        <span>Review budget & savings progress</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Form */}
            <div className="flex-1 flex flex-col items-center justify-center py-8 lg:py-6 px-4 sm:px-10 lg:px-12 overflow-y-auto">
              <div className="w-full max-w-md space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    {mode === 'signup' ? 'Create Student Profile' : 'Sign In to CampusCoin'}
                  </h2>
                  <p className="text-white/50 text-xs sm:text-sm mt-1">
                    {mode === 'signup'
                      ? 'Enter your details to start managing your student finances.'
                      : 'Enter your student credentials to open your dashboard.'}
                  </p>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => alert(`Continuing with Google Student account for ${mode}...`)}
                    className="flex items-center justify-center gap-2 h-11 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-xs font-medium text-white transition-all cursor-pointer"
                  >
                    <Chrome className="w-4 h-4" />
                    <span>Google (.edu)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert(`Continuing with GitHub Student Developer Pack for ${mode}...`)}
                    className="flex items-center justify-center gap-2 h-11 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-xs font-medium text-white transition-all cursor-pointer"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center">
                  <div className="w-full border-t border-white/10" />
                  <span className="absolute bg-black px-3 text-[10px] font-semibold text-white/40 uppercase tracking-widest">
                    Or Email
                  </span>
                </div>

                {resetStage === 'request' && (
                  <form onSubmit={handleForgotRequest} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/80">Student Email</label>
                      <input
                        type="email"
                        required
                        placeholder="student@university.edu"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3.5 text-xs text-white placeholder:text-white/20 focus:border-white/50 outline-none"
                      />
                    </div>
                    {resetMessage && (
                      <p className="text-[11px] leading-relaxed text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 break-all" role="status">{resetMessage}</p>
                    )}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span>{authLoading ? 'Sending…' : 'Send reset link'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResetStage('none'); setResetMessage(null); setAuthError(null); }}
                      className="w-full text-[11px] text-gray-400 hover:text-white"
                    >
                      Back to sign in
                    </button>
                  </form>
                )}

                {resetStage === 'confirm' && (
                  <form onSubmit={handleResetConfirm} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/80">Reset Token</label>
                      <input
                        type="text"
                        required
                        placeholder="Paste the token from your email"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3.5 text-xs text-white placeholder:text-white/20 focus:border-white/50 outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-white/80">New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3.5 text-xs text-white placeholder:text-white/20 focus:border-white/50 outline-none"
                      />
                    </div>
                    {resetMessage && <p className="text-[11px] leading-relaxed text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 break-all" role="status">{resetMessage}</p>}
                    <button
                      type="submit"
                      disabled={authSuccess || authLoading}
                      className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {authSuccess ? (
                        <><Check className="w-4 h-4 text-black" /><span>Password Reset!</span></>
                      ) : authLoading ? (
                        <span>Resetting…</span>
                      ) : (
                        <span>Set new password & sign in</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setResetStage('none'); setResetMessage(null); setAuthError(null); }}
                      className="w-full text-[11px] text-gray-400 hover:text-white"
                    >
                      Back to sign in
                    </button>
                  </form>
                )}

                {resetStage === 'none' && <form onSubmit={handleSubmit} className="space-y-3.5">
                  {mode === 'signup' && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-white/80">First Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Alex"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3.5 text-xs text-white placeholder:text-white/20 focus:border-white/50 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-white/80">Last Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Chen"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3.5 text-xs text-white placeholder:text-white/20 focus:border-white/50 outline-none"
                          />
                        </div>
                      </div>

                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/80">Student Email</label>
                    <input
                      type="email"
                      required
                      placeholder="student@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3.5 text-xs text-white placeholder:text-white/20 focus:border-white/50 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-white/80">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl h-10 px-3.5 pr-10 text-xs text-white placeholder:text-white/20 focus:border-white/50 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'signin' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setResetStage('request'); setResetEmail(email); setResetMessage(null); setAuthError(null); }}
                        className="text-[11px] text-gray-400 hover:text-white"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {authError && (
                    <p className="text-[11px] leading-relaxed text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2" role="alert">
                      {authError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={authSuccess || authLoading}
                    className="w-full h-12 bg-white hover:bg-gray-100 text-black font-semibold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {authSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-black" />
                        <span>{mode === 'signup' ? 'Student Profile Created!' : 'Authenticated!'}</span>
                      </>
                    ) : authLoading ? (
                      <span>{mode === 'signup' ? 'Creating account…' : 'Signing in…'}</span>
                    ) : (
                      <span>{mode === 'signup' ? 'Create Student Account' : 'Sign In'}</span>
                    )}
                  </button>
                </form>}

                {/* Switch mode */}
                <div className="text-center pt-2">
                  {mode === 'signup' ? (
                    <p className="text-xs text-white/50">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => onSwitchMode('signin')}
                        className="text-white font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Log in
                      </button>
                    </p>
                  ) : (
                    <p className="text-xs text-white/50">
                      New to CampusCoin?{' '}
                      <button
                        type="button"
                        onClick={() => onSwitchMode('signup')}
                        className="text-white font-semibold hover:underline cursor-pointer ml-1"
                      >
                        Create student account
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AnimatePresence>
  );
}
