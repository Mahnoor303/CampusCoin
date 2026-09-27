import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    question: '1. What is CampusCoin?',
    answer:
      'CampusCoin is a personal finance management web application designed specifically for university students. It helps you track your daily expenses, monitor your monthly allowance or part-time job income, set category budgets, and systematically work toward your savings goals.',
  },
  {
    question: '2. Who can use CampusCoin?',
    answer:
      'CampusCoin is open to all university students, college attendees, and young adults managing an allowance, work-study earnings, or living on a student budget. Anyone who wants simple, organized money tracking without complex accounting tools can benefit.',
  },
  {
    question: '3. Do I need to link my bank account to use CampusCoin?',
    answer:
      'No! CampusCoin never connects to your bank accounts, credit cards, or payment services. It is a 100% private, manual tracking tool. You record your transactions yourself, ensuring complete privacy, zero banking credential sharing, and no financial risk.',
  },
  {
    question: '4. How is my financial data kept secure?',
    answer:
      'Your student data is protected with secure encryption, hashed credentials, and modern web application security practices. Because CampusCoin never asks for bank account numbers, credit cards, or routing codes, your financial institutions remain completely isolated and safe.',
  },
  {
    question: '5. Can I track both income and expenses?',
    answer:
      'Yes. You can record income from monthly allowances, parents, scholarships, stipends, and part-time jobs, as well as all daily expenditures like campus dining, coffee, textbooks, rent, transit, and personal entertainment.',
  },
  {
    question: '6. Can I set savings goals?',
    answer:
      'Yes. CampusCoin allows you to define target savings amounts (such as an emergency cushion, spring break trip, or new laptop) and monitor your weekly progress as you put money aside.',
  },
  {
    question: '7. Is CampusCoin free to use?',
    answer:
      'Yes, CampusCoin is completely free for students. Our goal is to provide accessible, transparent personal finance tracking without hidden fees or subscription paywalls.',
  },
  {
    question: '8. What technologies power CampusCoin?',
    answer:
      'CampusCoin is built on the modern MERN stack — MongoDB for high-performance data storage, Express.js and Node.js for the backend API services, and React.js with TypeScript and Tailwind CSS for the responsive, fluid frontend user experience.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 md:py-32 bg-[#FAFAFA] border-t border-gray-200/70 relative overflow-hidden">
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-dot-subtle opacity-80 pointer-events-none z-0" />

      {/* Floating infinite badge */}
      <div className="hidden lg:block absolute top-16 right-12 z-10 animate-float-slow pointer-events-none">
        <div className="px-4 py-2 rounded-2xl bg-white/95 border border-gray-200 shadow-md text-xs font-semibold text-gray-800 flex items-center gap-2.5 backdrop-blur-md">
          <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
          <span>Student Support • FAQ</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-6 h-px bg-gray-300" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Got Questions?
            </span>
            <span className="w-6 h-px bg-gray-300" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal text-gray-950 tracking-tight leading-tight">
            Frequently Asked{' '}
            <span className="font-display italic text-[#64748B] block sm:inline font-normal">
              Questions.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-[#64748B] mt-4 leading-relaxed">
            Everything you need to know about how CampusCoin works, data privacy, and student financial tracking.
          </p>
        </motion.div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={faq.question}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-white border-gray-300 shadow-md'
                    : 'bg-white/80 border-gray-200/80 hover:border-gray-300 hover:bg-white'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left cursor-pointer transition-colors"
                >
                  <span className={`text-base font-semibold transition-colors ${
                    isOpen ? 'text-gray-950' : 'text-gray-800'
                  }`}>
                    {faq.question}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isOpen
                        ? 'bg-gray-100 text-gray-900 rotate-180'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-1 text-sm text-[#64748B] leading-relaxed border-t border-gray-100">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
