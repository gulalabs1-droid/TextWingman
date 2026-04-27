import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/" className="inline-flex items-center text-purple-200 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
        
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 md:p-12 shadow-2xl">
          <Logo size="md" showText={true} className="mb-8" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <p className="text-sm text-gray-500">Last updated: April 2026</p>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">What We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account info:</strong> Email and password (hashed) when you sign up</li>
                <li><strong>Conversation content you paste or upload:</strong> Messages, screenshots, and OCR-extracted text are sent to OpenAI for processing. Saved threads and coach sessions are stored in our database so you can resume them later.</li>
                <li><strong>Generated content:</strong> AI replies, drafts, and strategy outputs are saved to your account history.</li>
                <li><strong>Usage data:</strong> Daily limits, copy events, and feature interactions for product analytics and abuse prevention.</li>
                <li><strong>Billing info:</strong> Handled by Stripe — we never see your card number.</li>
                <li><strong>Anonymous analytics:</strong> Page views and performance metrics via Vercel Analytics (no third-party cookies).</li>
                <li><strong>Error logs:</strong> Crash reports via Sentry (text masked, media blocked) to fix bugs.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Generate AI-powered reply suggestions and strategy</li>
                <li>Save your sessions so you can pick up where you left off</li>
                <li>Manage your account, plan, and subscription</li>
                <li>Improve product quality (aggregated usage patterns only)</li>
                <li>Send important account or billing updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">What We Don&apos;t Do</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We don&apos;t sell your data to third parties</li>
                <li>We don&apos;t use your conversations to train public AI models</li>
                <li>We don&apos;t spam you with marketing emails</li>
                <li>We don&apos;t connect to your messaging apps or read texts directly — you choose what to share</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Data Retention</h2>
              <p>Saved threads, coach sessions, and reply history persist on your account until you delete them. Usage logs are retained for up to 90 days for abuse prevention. You can delete your account at any time, which removes all associated data within 30 days.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Subprocessors</h2>
              <p>We rely on these vetted third-party services to operate Text Wingman:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Supabase</strong> — database + authentication</li>
                <li><strong>Vercel</strong> — hosting + analytics</li>
                <li><strong>OpenAI</strong> — AI inference (per OpenAI&apos;s API policy, your data is not used to train their models)</li>
                <li><strong>Stripe</strong> — payments</li>
                <li><strong>Sentry</strong> — error monitoring</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Data Security</h2>
              <p>All data is encrypted in transit (TLS) and at rest. Row-level security policies in Supabase ensure your data is never accessible to other users. Production secrets are stored only in our hosting platform and never exposed in client code.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Your Rights</h2>
              <p>You can delete your account and all associated data at any time. Contact us to request data export or deletion.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Contact</h2>
              <p>Privacy questions? Email <a href="mailto:privacy@textwingman.com" className="text-purple-600 hover:text-purple-700">privacy@textwingman.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
