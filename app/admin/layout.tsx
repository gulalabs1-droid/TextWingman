import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin';
import { AdminSidebar } from '@/components/admin/sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
