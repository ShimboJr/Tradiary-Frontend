/**
 * components/onboarding/OnboardingTour.jsx
 * 4-step welcome tour shown on first login (localStorage-gated).
 * Step 1 offers to seed sample trades.
 * Uses a spotlight + tooltip approach with a backdrop overlay.
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ArrowRight, ChevronRight, Sparkles, BarChart2, BookOpen, CalendarDays, BookMarked } from 'lucide-react';
import { selectCurrentUser } from '@/features/auth/authSlice';
import axios from '@/api/axiosInstance';
import { toastSuccess } from '@/features/ui/toastSlice';

const ONBOARDING_KEY = 'tradiary_onboarding_done';

const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    title: 'Welcome to Tradiary!',
    description: "Your trading diary, with analytics. Let's take a quick tour — it'll only take 30 seconds.",
    highlight: null,
    samplePrompt: true,
  },
  {
    id: 'dashboard',
    icon: BarChart2,
    title: 'Your Dashboard',
    description: 'See your equity curve, key metrics like win rate and profit factor, and recent trades — all at a glance.',
    highlight: '/app/dashboard',
  },
  {
    id: 'trades',
    icon: BookOpen,
    title: 'Log Trades',
    description: 'Record every trade with entry/exit prices, screenshots, notes, and tags. Closed trades show your P&L and R-multiple automatically.',
    highlight: '/app/trades',
  },
  {
    id: 'playbooks',
    icon: BookMarked,
    title: 'Playbooks',
    description: 'Document your trading strategies — rules, setups, and examples. Review your edge and track which playbooks perform best.',
    highlight: '/app/playbooks',
  },
];

const OnboardingTour = () => {
  const dispatch = useDispatch();
  const user     = useSelector(selectCurrentUser);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded]   = useState(false);

  useEffect(() => {
    if (!user) return;
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setVisible(true);
  }, [user]);

  const dismiss = () => {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
    }
  };

  const seedSamples = async () => {
    setSeeding(true);
    try {
      await axios.post('/trades/seed-samples');
      setSeeded(true);
      dispatch(toastSuccess('Sample trades added! They\'re labelled "Sample" so you can delete them anytime.'));
    } catch {
      // silently fail — not critical
    } finally {
      setSeeding(false);
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon    = current.icon;
  const isLast  = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Tour card — centred */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_24px_64px_rgba(0,0,0,0.5)] animate-fade-up">
          {/* Progress bar */}
          <div className="h-1 rounded-t-2xl overflow-hidden bg-[var(--surface-100)]">
            <div
              className="h-full bg-gradient-to-r from-[var(--brand-indigo)] to-[var(--brand-cyan)] transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-indigo)] to-[var(--brand-cyan)]">
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Step {step + 1} of {STEPS.length}
                </p>
                <h2 id="onboarding-title" className="text-lg font-bold text-[var(--text)] font-display">
                  {current.title}
                </h2>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="Skip tour"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-100)] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 pb-6">
            <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-5">
              {current.description}
            </p>

            {/* Step 1: sample data prompt */}
            {current.samplePrompt && !seeded && (
              <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
                <p className="text-sm font-medium text-[var(--text)] mb-1">Start with sample trades?</p>
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  We'll add 10 realistic sample trades so your dashboard isn't empty. Clearly labelled — delete anytime.
                </p>
                <button
                  onClick={seedSamples}
                  disabled={seeding}
                  className="flex items-center gap-2 rounded-lg bg-[var(--brand-indigo-subtle)] px-3 py-2 text-sm font-medium text-[var(--brand-indigo)] hover:bg-[var(--brand-indigo)] hover:text-white transition-all disabled:opacity-60"
                >
                  {seeding ? (
                    <span className="animate-pulse">Adding samples…</span>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Add sample data
                    </>
                  )}
                </button>
              </div>
            )}

            {seeded && current.samplePrompt && (
              <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--gain-subtle)] p-3 text-sm text-[var(--gain-text)]">
                ✓ Sample trades added to your dashboard.
              </div>
            )}

            {/* Step dots */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step
                        ? 'w-6 bg-[var(--brand-indigo)]'
                        : i < step
                        ? 'w-1.5 bg-[var(--brand-indigo)] opacity-40'
                        : 'w-1.5 bg-[var(--surface-300)]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={dismiss}
                  className="px-3 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={next}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--brand-indigo)] to-[#6C7FFF] px-4 py-2 text-sm font-semibold text-white shadow-glow transition-opacity hover:opacity-90"
                >
                  {isLast ? 'Get started' : 'Next'}
                  {!isLast && <ChevronRight size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingTour;
