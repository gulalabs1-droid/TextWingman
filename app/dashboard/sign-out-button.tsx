'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="hidden sm:inline-flex min-h-11 items-center px-3.5 bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 text-red-400 text-xs font-bold rounded-2xl transition-all"
    >
      Sign Out
    </button>
  )
}
