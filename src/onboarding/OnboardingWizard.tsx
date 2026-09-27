/**
 * Onboarding wizard — 3 steps (Income → Spending → Goal) + confirmation.
 * Converted from 3step.html; shown after sign up, before the dashboard.
 */
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import "./onboarding.css";

export interface OnboardingData {
  onboarded: boolean;
  income: number;
  incomeSource: string;
  incomeFrequency: string;
  plannedSpending: number;
  focusCategories: string[];
  goal: number;
  goalLabel: string;
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
  onExit: () => void;
}

interface WizardState {
  incomeSource: string;
  noRegularIncome: boolean;
  incomeAmount: string;
  incomeFrequency: string;
  monthlySpending: string;
  mainSpendingCategories: string[];
  savingGoal: string;
  noGoal: boolean;
  savingGoalAmount: string;
}

const INCOME_SOURCES = ["Allowance", "Salary", "Freelance", "Scholarship", "Other"];
const INCOME_FREQUENCIES = ["Monthly", "Weekly", "One-Time"];
const SPENDING_CATEGORIES = ["Food", "Transport", "Education", "Entertainment", "Other"];
const GOALS = ["Laptop", "Education", "Travel", "Emergency", "Other"];

export default function OnboardingWizard({ onComplete, onExit }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    incomeSource: "",
    noRegularIncome: false,
    incomeAmount: "",
    incomeFrequency: "",
    monthlySpending: "",
    mainSpendingCategories: [],
    savingGoal: "",
    noGoal: false,
    savingGoalAmount: "",
  });

  const patch = (partial: Partial<WizardState>) => setState((s) => ({ ...s, ...partial }));

  const step1Valid = state.noRegularIncome
    ? true
    : Boolean(state.incomeSource && state.incomeAmount && state.incomeFrequency);

  const finish = () => {
    onComplete({
      onboarded: true,
      income: Math.round(parseFloat(state.incomeAmount) || 0),
      incomeSource: state.incomeSource || "",
      incomeFrequency: state.incomeFrequency || "",
      plannedSpending: Math.round(parseFloat(state.monthlySpending) || 0),
      focusCategories: state.mainSpendingCategories || [],
      goal: state.noGoal ? 250 : Math.round(parseFloat(state.savingGoalAmount) || 0) || 250,
      goalLabel: state.noGoal ? "" : state.savingGoal || "",
    });
  };

  const renderProgress = () => (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-12 md:mb-16">
      {["INCOME", "SPENDING", "GOAL"].map((label, i) => (
        <div key={label} className="contents">
          {i > 0 && (
            <div className={`wiz-progress-line ${step > i + 1 ? "filled" : ""}`} />
          )}
          <div
            className={`wiz-progress-step ${step === i + 1 ? "active" : ""} ${
              step > i + 1 ? "completed" : ""
            }`}
          >
            <span className="text-lg md:text-xl font-bold">{`0${i + 1}`}</span>
            <span className="text-[10px] md:text-xs tracking-widest">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="onboarding-wizard">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        {step < 4 && (
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold uppercase tracking-tight text-[#171717] md:text-5xl">
              Let&apos;s Set Up Your CampusCoin
            </h1>
            <p className="mx-auto max-w-md text-sm text-[#525252] md:text-base">
              Just 3 quick steps and your dashboard is ready.
            </p>
          </div>
        )}

        {step < 4 && renderProgress()}

        {/* ─── STEP 1: INCOME ─── */}
        {step === 1 && (
          <div className="wiz-fade-up" style={{ animation: "wiz-fade-up .4s cubic-bezier(.2,.7,.3,1) both" }}>
            <h2 className="mb-3 text-3xl font-bold uppercase text-[#171717] md:text-4xl">Your Income</h2>
            <p className="mb-8 text-sm text-[#525252] md:text-base">
              Where does your money usually come from?
            </p>

            <div className="mb-8">
              {INCOME_SOURCES.map((source) => (
                <button
                  key={source}
                  className={`wiz-chip ${state.incomeSource === source && !state.noRegularIncome ? "active" : ""}`}
                  onClick={() => patch({ incomeSource: source, noRegularIncome: false })}
                >
                  {source}
                </button>
              ))}
              <button
                className={`wiz-chip border-2 border-dashed ${state.noRegularIncome ? "active" : ""}`}
                onClick={() =>
                  patch({ noRegularIncome: true, incomeSource: "None", incomeAmount: "", incomeFrequency: "" })
                }
              >
                I don&apos;t have regular income
              </button>
            </div>

            {!state.noRegularIncome && (
              <div>
                <div className="mb-8">
                  <label className="mb-4 block text-base font-bold uppercase text-[#171717] md:text-lg">
                    How much do you usually receive?
                    <span className="text-sm font-normal normal-case opacity-60"> (Optional if no regular income)</span>
                  </label>
                  <div className="wiz-input-line flex items-center border-b-2 pb-2" style={{ borderColor: "var(--wiz-border)" }}>
                    <span className="mr-3 text-2xl font-bold text-[#525252] md:text-3xl">Rs.</span>
                    <input
                      type="number"
                      min={1}
                      placeholder="0"
                      value={state.incomeAmount}
                      onChange={(e) => patch({ incomeAmount: e.target.value })}
                      className="w-full bg-transparent text-2xl font-bold text-[#171717] outline-none placeholder:text-[rgba(0,0,0,0.25)] md:text-3xl"
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="mb-4 block text-base font-bold uppercase text-[#171717] md:text-lg">How often?</label>
                  <div className="flex flex-wrap">
                    {INCOME_FREQUENCIES.map((freq) => (
                      <button
                        key={freq}
                        className={`wiz-chip ${state.incomeFrequency === freq ? "active" : ""}`}
                        onClick={() => patch({ incomeFrequency: freq })}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-between">
              <button className="wiz-btn-secondary" onClick={onExit}>
                <ArrowLeft size={14} className="mr-1 inline" /> Back
              </button>
              <button className="wiz-btn-primary" disabled={!step1Valid} onClick={() => setStep(2)}>
                Continue <ArrowRight size={14} className="ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: SPENDING ─── */}
        {step === 2 && (
          <div style={{ animation: "wiz-fade-up .4s cubic-bezier(.2,.7,.3,1) both" }}>
            <h2 className="mb-3 text-3xl font-bold uppercase text-[#171717] md:text-4xl">Your Spending</h2>
            <p className="mb-8 text-sm text-[#525252] md:text-base">
              About how much do you usually spend each month?
            </p>

            <div className="mb-8">
              <label className="mb-4 block text-base font-bold uppercase text-[#171717] md:text-lg">
                Monthly Spending <span className="text-sm font-normal normal-case opacity-60">(Optional)</span>
              </label>
              <div className="wiz-input-line flex items-center border-b-2 pb-2" style={{ borderColor: "var(--wiz-border)" }}>
                <span className="mr-3 text-2xl font-bold text-[#525252] md:text-3xl">Rs.</span>
                <input
                  type="number"
                  min={1}
                  placeholder="0"
                  value={state.monthlySpending}
                  onChange={(e) => patch({ monthlySpending: e.target.value })}
                  className="w-full bg-transparent text-2xl font-bold text-[#171717] outline-none placeholder:text-[rgba(0,0,0,0.25)] md:text-3xl"
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="mb-4 block text-base font-bold uppercase text-[#171717] md:text-lg">
                Where do you spend the most?
              </label>
              <div className="flex flex-wrap">
                {SPENDING_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`wiz-chip ${state.mainSpendingCategories.includes(cat) ? "active" : ""}`}
                    onClick={() =>
                      patch({
                        mainSpendingCategories: state.mainSpendingCategories.includes(cat)
                          ? state.mainSpendingCategories.filter((c) => c !== cat)
                          : [...state.mainSpendingCategories, cat],
                      })
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-[#525252] opacity-70">
                Don&apos;t worry about being exact. You can change this later.
              </p>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <button className="wiz-btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={14} className="mr-1 inline" /> Back
              </button>
              <button className="wiz-btn-primary" onClick={() => setStep(3)}>
                Continue <ArrowRight size={14} className="ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: GOAL ─── */}
        {step === 3 && (
          <div style={{ animation: "wiz-fade-up .4s cubic-bezier(.2,.7,.3,1) both" }}>
            <h2 className="mb-3 text-3xl font-bold uppercase text-[#171717] md:text-4xl">Your Goal</h2>
            <p className="mb-8 text-sm text-[#525252] md:text-base">What are you saving for?</p>

            <div className="mb-8">
              {GOALS.map((goal) => (
                <button
                  key={goal}
                  className={`wiz-chip ${state.savingGoal === goal && !state.noGoal ? "active" : ""}`}
                  onClick={() => patch({ savingGoal: goal, noGoal: false })}
                >
                  {goal}
                </button>
              ))}
              <button
                className={`wiz-chip border-2 border-dashed ${state.noGoal ? "active" : ""}`}
                onClick={() => patch({ noGoal: true, savingGoal: "None", savingGoalAmount: "" })}
              >
                No goal right now
              </button>
            </div>

            {!state.noGoal && (
              <div className="mb-8">
                <label className="mb-4 block text-base font-bold uppercase text-[#171717] md:text-lg">Target Amount</label>
                <div className="wiz-input-line flex items-center border-b-2 pb-2" style={{ borderColor: "var(--wiz-border)" }}>
                  <span className="mr-3 text-2xl font-bold text-[#525252] md:text-3xl">Rs.</span>
                  <input
                    type="number"
                    min={1}
                    placeholder="0"
                    value={state.savingGoalAmount}
                    onChange={(e) => patch({ savingGoalAmount: e.target.value })}
                    className="w-full bg-transparent text-2xl font-bold text-[#171717] outline-none placeholder:text-[rgba(0,0,0,0.25)] md:text-3xl"
                  />
                </div>
              </div>
            )}

            <div className="mt-12 flex items-center justify-between">
              <button className="wiz-btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={14} className="mr-1 inline" /> Back
              </button>
              <button className="wiz-btn-primary" onClick={() => setStep(4)}>
                Continue <ArrowRight size={14} className="ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: CONFIRMATION ─── */}
        {step === 4 && (
          <div className="text-center" style={{ animation: "wiz-fade-up .4s cubic-bezier(.2,.7,.3,1) both" }}>
            <div className="wiz-confirmation-icon mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full">
              <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="mb-4 text-4xl font-bold uppercase text-[#171717] md:text-5xl">You&apos;re all set!</h2>
            <p className="mb-10 text-lg text-[#525252]">Let&apos;s see your money.</p>
            <button className="wiz-btn-primary w-full md:w-auto" onClick={finish}>
              View My Dashboard <ArrowRight size={14} className="ml-1 inline" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
