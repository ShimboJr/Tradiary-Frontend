/**
 * pages/NotFoundPage.jsx
 * 404 page with Logo and a friendly message.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import Button from '@/components/ui/Button';

const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-6 text-center">
    {/* Logo */}
    <div className="mb-12">
      <Logo variant="full" size={36} />
    </div>

    {/* Illustration */}
    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <SearchX size={40} className="text-[var(--text-muted)]" />
    </div>

    {/* 404 display */}
    <p className="text-7xl font-extrabold font-display gradient-text mb-4">404</p>

    <h1 className="text-2xl font-bold text-[var(--text)] mb-3">Page not found</h1>
    <p className="mb-8 max-w-sm text-sm text-[var(--text-muted)] leading-relaxed">
      This page doesn't exist or may have been moved. Let's get you back on track.
    </p>

    <div className="flex flex-wrap gap-3 justify-center">
      <Link to="/">
        <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
          Back to home
        </Button>
      </Link>
      <Link to="/app/dashboard">
        <Button>Go to dashboard</Button>
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
