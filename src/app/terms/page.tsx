import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – ExpenStream",
  description: "The terms and conditions governing use of ExpenStream.",
};

export default function TermsPage() {
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
      <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Effective date: January 1, 2025 · Last updated: January 1, 2025
      </p>

      <section className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            1. Acceptance
          </h2>
          <p>
            By creating an account or using ExpenStream, you agree to these Terms. If you do not agree, please do not
            use the app.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            2. The Service
          </h2>
          <p>
            ExpenStream is a personal expense tracker. We provide tools to log expenses, set budgets, track goals,
            and analyse spending patterns. The service is provided &quot;as is&quot; and may be updated, modified, or
            discontinued at any time.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            3. Your Account
          </h2>
          <ul className="list-disc list-inside space-y-1">
            <li>You are responsible for keeping your credentials secure.</li>
            <li>You must be at least 13 years old to use ExpenStream.</li>
            <li>You may not share your account with others.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            4. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 mt-1">
            <li>Attempt to reverse-engineer, scrape, or abuse the service.</li>
            <li>Use the service for any unlawful purpose.</li>
            <li>Attempt to access other users&apos; data.</li>
            <li>Introduce malware, denial-of-service attacks, or automated abuse.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            5. Your Data
          </h2>
          <p>
            You own your expense data. By using the service you grant us permission to store and process it solely to
            provide the service to you. We do not claim ownership of your data and will not use it for purposes other
            than operating ExpenStream. See our{" "}
            <Link href="/privacy" style={{ color: "var(--accent)" }}>
              Privacy Policy
            </Link>{" "}
            for full details.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            6. Disclaimers
          </h2>
          <p>
            ExpenStream is not a financial advisor. Data shown in the app is for personal informational purposes only
            and should not be relied upon for financial decisions. We make no warranties about the accuracy of
            currency exchange rates or other third-party data.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            7. Limitation of Liability
          </h2>
          <p>
            To the maximum extent permitted by law, ExpenStream and its operators shall not be liable for any
            indirect, incidental, or consequential damages arising from your use of the service, including data loss.
            We strongly encourage you to use the CSV/JSON export feature to maintain your own backups.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            8. Changes to These Terms
          </h2>
          <p>
            We may update these Terms at any time. Continued use after changes are posted constitutes acceptance.
            Material changes will be communicated in-app.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            9. Governing Law
          </h2>
          <p>
            These Terms are governed by the laws of the jurisdiction in which the operator is based, without regard
            to conflict of law principles.
          </p>
        </div>

        <div>
          <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
            10. Contact
          </h2>
          <p>
            Questions about these Terms?{" "}
            <a href="mailto:legal@expenstream.app" style={{ color: "var(--accent)" }}>
              legal@expenstream.app
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
