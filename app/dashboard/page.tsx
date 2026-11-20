import { redirect } from 'next/navigation';

// Coach is the signed-in home. This route stays so old links, bookmarks and
// the onboarding check in the proxy keep working.
export default function DashboardPage() {
  redirect('/app');
}
