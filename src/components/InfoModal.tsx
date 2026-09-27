import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Mail } from 'lucide-react';

export type InfoModalType = 'privacy' | 'terms' | 'contact' | null;

interface InfoModalProps {
  type: InfoModalType;
  onClose: () => void;
}

export default function InfoModal({ type, onClose }: InfoModalProps) {
  if (!type) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 text-left max-h-[85vh] overflow-y-auto text-gray-800"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          {type === 'privacy' && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-950 flex items-center justify-center mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-950">Privacy Policy</h3>
              <p className="text-xs text-gray-600 font-mono">Last updated: 2026 Academic Term</p>

              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                <p>
                  <strong className="text-gray-900">No Bank Connectivity:</strong> CampusCoin is strictly an intentional personal expense logging web application. We do not integrate with Open Banking, Plaid, or third-party bank aggregators. Your bank accounts and card credentials are never requested or stored.
                </p>
                <p>
                  <strong className="text-gray-900">Data Ownership:</strong> All logged transactions, categories, and savings goals belong exclusively to your user account and are stored securely within our MERN stack database.
                </p>
                <p>
                  <strong className="text-gray-900">Zero Telemetry Selling:</strong> We do not sell student spending habits, transaction logs, or profile data to third-party advertisers or financial brokers.
                </p>
              </div>
            </div>
          )}

          {type === 'terms' && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-950 flex items-center justify-center mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-950">Terms of Use</h3>
              <p className="text-xs text-gray-600 font-mono">Student Agreement</p>

              <div className="text-sm text-gray-600 space-y-3 leading-relaxed">
                <p>
                  <strong className="text-gray-900">Personal Management Tool:</strong> CampusCoin provides personal financial tracking and budgeting calculation features. It does not provide certified financial advice, loans, credit services, or money transmission.
                </p>
                <p>
                  <strong className="text-gray-900">User Responsibility:</strong> Users are responsible for maintaining the accuracy of their manually entered transactions and keeping their account credentials confidential.
                </p>
                <p>
                  <strong className="text-gray-900">Service Availability:</strong> The application is developed as part of a modern MERN stack student initiative and is provided free of charge for university students.
                </p>
              </div>
            </div>
          )}

          {type === 'contact' && (
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-950 flex items-center justify-center mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-950">Student Support</h3>
              <p className="text-xs text-gray-600 font-mono">Get in touch with the development team</p>

              <p className="text-sm text-gray-600 leading-relaxed">
                Have a question about tracking your allowance, proposing a new category, or reporting an issue? Send us a message and our team will get back to you promptly.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Thank you for reaching out! A student team member will follow up shortly.');
                  onClose();
                }}
                className="space-y-3 pt-2"
              >
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Student Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@university.edu"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    How can we help?
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Tell us what you need help with..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:border-black focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-black hover:bg-gray-800 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
                >
                  Send Message
                </button>
              </form>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
