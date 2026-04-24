import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy — Vigil',
  description: 'How Vigil collects, uses, and protects your data.',
}

export default function PrivacyPage() {
  const updated = 'April 2026'
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      <header className="border-b px-6 py-4 flex items-center gap-3"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          <Shield className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold">Vigil</span>
        <div className="flex-1" />
        <Link href="/" className="flex items-center gap-1 text-sm"
          style={{ color: 'var(--text-3)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm mb-10" style={{ color: 'var(--text-3)' }}>Last updated: {updated}</p>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>1. What We Collect</h2>
            <p>When a visitor is registered through Vigil, the following information is collected:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Full name and phone number</li>
              <li>A photo taken at the time of entry (with timestamp overlay)</li>
              <li>Purpose of visit and optional details (host name, apartment/floor, vehicle number)</li>
              <li>Check-in and check-out timestamps</li>
              <li>The email address of the security guard who registered the entry</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>2. How We Use It</h2>
            <p>Collected data is used solely for building security purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Maintaining a real-time log of who is inside the premises</li>
              <li>Allowing authorised administrators to review visitor history</li>
              <li>Alerting security staff if a visitor matches the blocklist</li>
            </ul>
            <p className="mt-2">We do not sell, share, or use visitor data for marketing or advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>3. Data Storage</h2>
            <p>All data is stored securely on Google Firebase (Firestore and Cloud Storage), hosted in Google&apos;s data centres. Data is encrypted at rest and in transit. Access is restricted to authenticated administrators and security personnel of your building.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>4. Data Retention</h2>
            <p>Visitor records and photos are retained for as long as the building administrator requires them for security purposes. Administrators may delete individual records at any time from the admin dashboard. We recommend reviewing and purging records older than 90 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>5. Your Rights</h2>
            <p>Visitors whose data has been collected may request:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>A copy of their personal data held in the system</li>
              <li>Deletion of their records</li>
              <li>Correction of inaccurate information</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact the building administrator directly.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>6. Security</h2>
            <p>Vigil enforces authentication for all access. Role-based access control ensures security guards can only register visitors, while only designated administrators can view full logs, export data, or manage the blocklist. Photos are stored with access-controlled URLs.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--text-1)' }}>7. Contact</h2>
            <p>For privacy-related questions, contact the building or facility administrator who deployed this system.</p>
          </section>
        </div>
      </main>
    </div>
  )
}
