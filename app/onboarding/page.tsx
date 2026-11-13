import type { Metadata } from 'next'
import OnboardingFlow from '@/components/OnboardingFlow'

export const metadata: Metadata = {
  title: 'Welcome — Text Wingman',
  robots: { index: false, follow: false },
}

export default function OnboardingPage() {
  return <OnboardingFlow />
}
