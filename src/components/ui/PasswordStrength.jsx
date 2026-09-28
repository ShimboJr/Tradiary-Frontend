/**
 * components/ui/PasswordStrength.jsx
 * Visual password strength meter shown on registration form.
 */

import React, { useMemo } from 'react';

const getStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)               score++;
  if (password.length >= 12)              score++;
  if (/[a-z]/.test(password))            score++;
  if (/[A-Z]/.test(password))            score++;
  if (/\d/.test(password))              score++;
  if (/[^a-zA-Z0-9]/.test(password))    score++;

  if (score <= 2) return { score, label: 'Weak',   color: 'var(--color-loss)' };
  if (score <= 4) return { score, label: 'Fair',   color: 'var(--color-warning)' };
  if (score <= 5) return { score, label: 'Good',   color: 'var(--color-brand)' };
  return             { score, label: 'Strong', color: 'var(--color-gain)' };
};

const PasswordStrength = ({ password }) => {
  const { score, label, color } = useMemo(() => getStrength(password), [password]);
  if (!password) return null;

  const pct = Math.min((score / 6) * 100, 100);

  return (
    <div className="mt-1.5 space-y-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-300)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs" style={{ color }}>
        {label}
      </p>
    </div>
  );
};

export default PasswordStrength;
