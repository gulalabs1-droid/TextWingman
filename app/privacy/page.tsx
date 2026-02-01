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
            <p className="text-sm text-gray-500">Last updated: January 2025</p>
            
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">What We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account info:</strong> Email and password when you sign up</li>
                <li><strong>Usage data:</strong> Messages you paste (processed by AI, not stored long-term)</li>
                <li><strong>Analytics:</strong> Basic usage metrics to improve the service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Generate AI-powered reply suggestions</li>
                <li>Manage your account and subscription</li>
                <li>Improve our service</li>
                <li>Send important account updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">What We Don&apos;t Do</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>We don&apos;t sell your data to third parties</li>
                <li>We don&apos;t store your messages permanently</li>
                <li>We don&apos;t spam you with marketing emails</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Data Security</h2>
              <p>We use industry-standard encryption and security practices. Your data is processed through secure AI providers (OpenAI) and stored with Supabase.</p>
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
