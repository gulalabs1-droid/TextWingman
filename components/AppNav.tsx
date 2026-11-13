'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Clock, Home, MessageCircle, User } from 'lucide-react';

const items = [
  { href: '/app', label: 'Coach', icon: MessageCircle },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/profile', label: 'Account', icon: User },
];

// Bottom navigation for signed-in pages on phones. Pages that use it need bottom padding (pb-24).
// Hidden while the on-screen keyboard is open so it never sits on top of a text field.
export default function AppNav() {
  const pathname = usePathname();
  return (
    <nav data-app-nav aria-label="App navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0a0a0f]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden [html[data-keyboard='open']_&]:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${active ? 'text-violet-300' : 'text-white/55 hover:text-white/85'}`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
