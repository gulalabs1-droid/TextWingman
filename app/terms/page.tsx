import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/" className="inline-flex items-center text-purple-200 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
        
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 md:p-12 shadow-2xl">
          <Logo size="md" showText={true} className="mb-8" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <p className="text-sm text-gray-500">Last updated: January 2025</p>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1. Acceptance of Terms</h2>
              <p>By using Text Wingman, you agree to these Terms of Service. If you don&apos;t agree, please don&apos;t use our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2. Description of Service</h2>
              <p>Text Wingman is an AI-powered tool that helps you craft text message replies. We provide suggestions based on your input, but you are responsible for the messages you send.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be 18 years or older to use this service</li>
                <li>You are responsible for how you use our suggestions</li>
                <li>Do not use the service for harassment, spam, or illegal purposes</li>
                <li>Keep your account credentials secure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4. Subscriptions & Payments</h2>
              <p>Free users get 3 replies per day. Pro subscriptions provide unlimited access. Subscriptions auto-renew unless cancelled. You can cancel anytime from your account settings.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5. Limitation of Liability</h2>
              <p>Text Wingman provides AI suggestions as-is. We are not responsible for any outcomes from using our suggestions in your conversations.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6. Contact</h2>
              <p>Questions? Email us at <a href="mailto:support@textwingman.com" className="text-purple-600 hover:text-purple-700">support@textwingman.com</a></p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
