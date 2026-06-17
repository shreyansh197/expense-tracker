import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – ExpenStream",
  description: "How ExpenStream collects, stores, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen px-6 py-12 max-w-2xl mx-auto"
      style={{ color: "var(--text-primary)" }}
    >
      <Link
        href="/"
        className="text-sm mb-8 inline-block"
        style={{ color: "var(--accent)" }}
      >
        ← Back to app
      </Link>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Effective date: January 1, 2025 · Last updated: January 1, 2025
      </p>

      <section className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            1. Overview
          </h2>
          <p>
            ExpenStream (&quot;we&quot;, &quot;us&quot;, &quot;the app&quot;) is a personal expense tracking Progressive Web App. We take
            your privacy seriously. This policy explains what data we collect, why, and how we protect it.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            2. Data We Collect
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li><strong>Account data</strong> – email address and hashed password used to authenticate you.</li>
            <li><strong>Expense records</strong> – amounts, dates, categories, and optional remarks you enter.</li>
            <li><strong>Settings &amp; preferences</strong> – currency, categories, budget limits, and notification preferences.</li>
            <li><strong>Device identifiers</strong> – a random client ID stored locally to support multi-device sync.</li>
            <li><strong>Push notification tokens</strong> – browser push subscription endpoint and keys (stored encrypted at rest).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            3. Data We Do Not Collect
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>We do not collect payment card numbers or bank credentials.</li>
            <li>We do not sell your data to third parties.</li>
            <li>We do not use third-party advertising SDKs.</li>
            <li>We do not track you across other websites.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            4. How We Use Your Data
          </h2>
          <p>
            Data is used solely to provide the expense tracking service: displaying your records, generating analytics,
            sending push notifications you explicitly opt in to, and enabling multi-device sync within your account.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            5. Data Storage &amp; Security
          </h2>
          <p>
            Expense data is stored in a PostgreSQL database with row-level security ensuring you can only access your
            own records. Sensitive data fields are encrypted at rest using AES-256-GCM. All traffic is encrypted via
            HTTPS/TLS. Passwords are hashed with bcrypt (12 rounds) and never stored in plain text. Authentication
            uses short-lived JWT access tokens (15 minutes) with 30-day refresh tokens.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            6. Local Storage
          </h2>
          <p>
            ExpenStream uses browser IndexedDB (via Dexie.js) to cache your data locally for offline-first access.
            This data stays on your device and is only synced to our servers when you are online and signed in.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            7. Your Rights
          </h2>
          <p>
            You may request a copy of all data associated with your account, or request deletion of your account and
            all associated data, by contacting us at the email below. Data deletion is permanent and irreversible.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            8. Changes to This Policy
          </h2>
          <p>
            We may update this policy from time to time. Material changes will be communicated in-app. Continued use
            of ExpenStream after changes constitutes acceptance of the revised policy.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            9. Contact
          </h2>
          <p>
            Questions about this policy? Email us at{" "}
            <a href="mailto:privacy@expenstream.app" style={{ color: "var(--accent)" }}>
              privacy@expenstream.app
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
