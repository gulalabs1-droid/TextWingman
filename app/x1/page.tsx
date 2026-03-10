'use client';

import Link from 'next/link';
import { ArrowLeft, Moon, Sun } from 'lucide-react';

export default function X1Page() {
  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] text-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">X1 Sandbox</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Light Mode Preview</h1>
          <p className="text-sm text-white/40 leading-relaxed">
            Pick a mode. The light version opens the real app with an isolated color filter — your actual data, your actual UI.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Link
            href="/app?lm=1"
            className="flex items-center justify-between w-full px-5 py-4 rounded-2xl bg-white text-gray-900 font-semibold hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg shadow-white/10 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                <Sun className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">Open in Light Mode</p>
                <p className="text-xs text-gray-500">/app?lm=1 — flip the whole UI</p>
              </div>
            </div>
            <span className="text-gray-400 group-hover:text-gray-700 transition-colors text-lg">→</span>
          </Link>

          <Link
            href="/app"
            className="flex items-center justify-between w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/[0.10] font-semibold hover:bg-white/[0.10] active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/[0.08] flex items-center justify-center">
                <Moon className="h-4 w-4 text-white/60" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white/80">Open in Dark Mode</p>
                <p className="text-xs text-white/30">/app — original experience</p>
              </div>
            </div>
            <span className="text-white/20 group-hover:text-white/60 transition-colors text-lg">→</span>
          </Link>
        </div>

        {/* Note */}
        <p className="text-center text-[11px] text-white/20 leading-relaxed">
          Light mode is isolated to <code className="text-white/30">?lm=1</code> only. The real app and X2 are unaffected.
        </p>

        {/* Back */}
        <div className="flex justify-center pt-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-white/20 hover:text-white/50 transition-colors">
            <ArrowLeft className="h-3 w-3" />
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
