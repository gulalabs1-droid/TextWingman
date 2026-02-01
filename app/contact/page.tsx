import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-900 to-purple-600">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/" className="inline-flex items-center text-purple-200 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to home
        </Link>
        
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 md:p-12 shadow-2xl text-center">
          <Logo size="lg" showText={true} className="mb-8 justify-center" />
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-600 mb-8">Got questions, feedback, or just want to say hi? We&apos;d love to hear from you.</p>
          
          <div className="space-y-4">
            <a 
              href="mailto:support@textwingman.com"
              className="flex items-center justify-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-2xl transition-colors group"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Email Us</p>
                <p className="text-purple-600">support@textwingman.com</p>
              </div>
            </a>
            
            <div className="p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center justify-center gap-3 mb-3">
                <MessageCircle className="h-5 w-5 text-gray-400" />
                <p className="text-gray-600 font-medium">We typically respond within 24 hours</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm mb-4">Ready to get perfect replies?</p>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-xl font-bold">
              <Link href="/app">Try Text Wingman Free</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
