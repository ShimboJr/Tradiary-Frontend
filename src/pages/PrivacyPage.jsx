/**
 * pages/PrivacyPage.jsx
 * Privacy Policy page.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';

const PrivacyPage = () => (
  <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      <Link to="/" aria-label="Tradiary home"><Logo variant="full" size={28} /></Link>
    </header>

    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold font-display mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>

      <div className="space-y-8 text-[var(--text-muted)] leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">1. Data We Collect</h2>
          <ul className="list-disc ml-5 space-y-1 text-sm">
            <li><strong className="text-[var(--text)]">Account data:</strong> name, email address, hashed password (never plain-text).</li>
            <li><strong className="text-[var(--text)]">Trade data:</strong> symbol, direction, prices, notes, screenshots you upload.</li>
            <li><strong className="text-[var(--text)]">Usage data:</strong> pages visited, feature interactions — aggregated and anonymous only.</li>
            <li><strong className="text-[var(--text)]">Google OAuth:</strong> if you sign in with Google, we receive your name, email, and Google ID.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">2. How We Use Your Data</h2>
          <p className="text-sm">We use your data solely to provide the Tradiary service: displaying your trades, computing analytics, and sending transactional emails (email verification, password reset). We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">3. Data Storage & Security</h2>
          <p className="text-sm">Your data is stored in MongoDB Atlas (EU or US region). Passwords are hashed with bcrypt. All connections use TLS. Screenshots are stored in Cloudinary. We take reasonable technical measures to protect your data, but no system is 100% secure.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">4. Cookies & Tokens</h2>
          <p className="text-sm">We use a single <code className="bg-[var(--surface-100)] px-1 py-0.5 rounded text-xs">httpOnly</code> cookie for your refresh token, which keeps you signed in. We do not use advertising cookies or third-party tracking.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">5. Your Rights (GDPR & global)</h2>
          <p className="text-sm">You have the right to access, correct, or delete all data we hold about you. Use the <strong className="text-[var(--text)]">Settings → Data → Delete Account</strong> feature to permanently remove your account and all associated data. We will comply within 30 days of any request.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">6. Data Retention</h2>
          <p className="text-sm">We retain your data for as long as your account is active. When you delete your account, all personal data is permanently and immediately deleted from our databases.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">7. Third-Party Services</h2>
          <p className="text-sm">Tradiary uses: <strong className="text-[var(--text)]">MongoDB Atlas</strong> (database), <strong className="text-[var(--text)]">Cloudinary</strong> (image storage), <strong className="text-[var(--text)]">Brevo</strong> (transactional email), <strong className="text-[var(--text)]">Google OAuth</strong> (optional sign-in). Each operates under their own privacy policies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">8. Changes to This Policy</h2>
          <p className="text-sm">We may update this Privacy Policy from time to time. We will notify you of significant changes via email.</p>
        </section>

      </div>

      <div className="mt-12 pt-8 border-t border-[var(--border)]">
        <Link to="/" className="text-sm text-[var(--brand-indigo)] hover:underline">← Back to home</Link>
      </div>
    </main>
  </div>
);

export default PrivacyPage;
