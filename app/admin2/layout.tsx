import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import Link from 'next/link';

export default async function Admin2Layout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-[#06060a] text-white">
      <div className="border-b border-white/[0.06] bg-[#0a0a12]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-xs font-bold">A2</div>
              <span className="font-bold text-sm tracking-tight">Admin <span className="text-white/40">/ Live</span></span>
            </div>
            <span className="text-[10px] text-white/30 hidden md:inline">Real-time site activity</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/admin" className="text-white/40 hover:text-white/80 transition">← Classic Admin</Link>
          </div>
        </div>
      </div>
      <main className="max-w-[1600px] mx-auto px-5 py-5">{children}</main>
    </div>
  );
}
