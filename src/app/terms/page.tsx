import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata = { title: 'Terms of Service — Vigil' }

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-1)' }}>
      <header className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold">Vigil</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>Last updated: May 2026</p>
        </div>

        <Section title="1. Acceptance of Terms">
          By accessing or using Vigil ("the App"), you agree to be bound by these Terms of Service. If
          you do not agree to these terms, do not use the App. These terms apply to all users including
          security guards and administrators.
        </Section>

        <Section title="2. Description of Service">
          Vigil is a visitor management system that allows authorised building staff to record visitor
          check-ins and check-outs, capture visitor photographs, and maintain a visitor log. The service
          is provided as a Progressive Web App backed by Firebase cloud infrastructure.
        </Section>

        <Section title="3. Authorised Use">
          <p className="mb-2">You may use Vigil only for lawful visitor management purposes within your
          organisation. You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Record individuals without legitimate security or operational need</li>
            <li>Share login credentials with unauthorised persons</li>
            <li>Attempt to access visitor records beyond your assigned role</li>
            <li>Use exported data for any purpose other than internal security records</li>
            <li>Attempt to reverse-engineer, hack, or disrupt the service</li>
          </ul>
        </Section>

        <Section title="4. Data and Privacy">
          Your use of the App is also governed by our{' '}
          <Link href="/privacy" className="underline" style={{ color: '#60A5FA' }}>Privacy Policy</Link>,
          which describes how visitor data is collected, stored, and processed. By using Vigil, you
          accept responsibility for ensuring visitors are informed that their information is being
          recorded, in accordance with applicable local laws.
        </Section>

        <Section title="5. Account Responsibility">
          You are responsible for maintaining the security of your account credentials. Administrators
          are responsible for managing guard accounts within their organisation. Notify us immediately
          at the contact address below if you suspect unauthorised access to your account.
        </Section>

        <Section title="6. Data Retention and Deletion">
          Visitor records are stored in Firebase Firestore. Administrators may export or delete records
          at any time through the Admin Console. We do not guarantee data retention beyond what is
          configured in your Firebase project settings.
        </Section>

        <Section title="7. Service Availability">
          We aim for high availability but do not guarantee uninterrupted access. The App depends on
          Firebase and Vercel infrastructure. Scheduled maintenance, outages, or force majeure events
          may cause temporary unavailability without notice.
        </Section>

        <Section title="8. Disclaimers">
          Vigil is provided &ldquo;as is&rdquo; without warranty of any kind. We do not warrant that the App
          will meet all your requirements or that it will be error-free. Your use of visitor data and
          decisions made based on it are entirely your responsibility.
        </Section>

        <Section title="9. Limitation of Liability">
          To the fullest extent permitted by law, Vigil and its operators shall not be liable for any
          indirect, incidental, or consequential damages arising from your use of the App or from any
          visitor management decisions made using it.
        </Section>

        <Section title="10. Changes to Terms">
          We may update these Terms from time to time. Continued use of the App after changes are
          posted constitutes your acceptance of the revised terms. We will update the &ldquo;Last updated&rdquo;
          date at the top of this page.
        </Section>

        <Section title="11. Contact">
          For questions about these Terms, contact us through the Vigil admin panel or reach out to
          your account administrator.
        </Section>

        <div className="pt-4 border-t text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text-3)' }}>
          <div className="flex gap-4 flex-wrap">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/login" className="hover:underline">Sign In</Link>
          </div>
          <p className="mt-3">© {new Date().getFullYear()} Vigil. All rights reserved.</p>
        </div>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{children}</div>
    </section>
  )
}
