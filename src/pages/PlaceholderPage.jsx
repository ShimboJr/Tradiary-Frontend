/**
 * Shared placeholder page component for app skeleton pages.
 */
import React from 'react';

const PlaceholderPage = ({ title, description }) => (
  <div className="flex flex-col gap-2 animate-fade-in">
    <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{title}</h1>
    <p className="text-sm text-[var(--color-text-muted)]">
      {description ?? 'This section is coming soon. Check back in the next prompt.'}
    </p>
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-32 rounded-xl border border-[var(--color-border)] skeleton"
        />
      ))}
    </div>
  </div>
);

export default PlaceholderPage;
