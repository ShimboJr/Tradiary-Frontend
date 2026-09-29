/**
 * pages/TermsPage.jsx
 * Terms of Service — placeholder content for launch.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';

const TermsPage = () => (
  <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
    <header className="border-b border-[var(--border)] bg-[var(--surface)] px-6 py-4">
      <Link to="/" aria-label="Tradiary home"><Logo variant="full" size={28} /></Link>
    </header>

    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-extrabold font-display mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--text-muted)] mb-10">Last updated: {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>

      <div className="prose prose-sm max-w-none space-y-8 text-[var(--text-muted)] leading-relaxed">

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using Tradiary ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">2. Description of Service</h2>
          <p>Tradiary is a trading journal and analytics tool for educational and record-keeping purposes. It is provided free of charge as a personal project. The Service is not a financial adviser, broker, or investment platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">3. Not Financial Advice</h2>
          <p><strong className="text-[var(--text)]">Nothing on Tradiary constitutes financial advice, investment advice, or a recommendation to buy or sell any financial instrument.</strong> Trading involves significant risk of loss. Always conduct your own research and consult a qualified financial professional before making trading decisions.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">4. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. We reserve the right to terminate accounts that violate these Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">5. Acceptable Use</h2>
          <p>You agree not to: attempt to gain unauthorised access to the Service or other users' accounts; use the Service to store or transmit malicious code; reverse-engineer or copy any part of the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">6. Availability</h2>
          <p>Tradiary is provided "as is" without any warranty of availability, accuracy, or fitness for a particular purpose. We may suspend, modify, or discontinue the Service at any time without notice.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">7. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, Tradiary and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service, including but not limited to trading losses.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">8. Changes to Terms</h2>
          <p>We reserve the right to update these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-2">9. Contact</h2>
          <p>Questions about these Terms? Please reach out via the contact details on our website.</p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-[var(--border)]">
        <Link to="/" className="text-sm text-[var(--brand-indigo)] hover:underline">← Back to home</Link>
      </div>
    </main>
  </div>
);

export default TermsPage;
