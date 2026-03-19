'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Kanban' },
    { href: '/orders', label: 'Buyurtmalar' },
    { href: '/customers', label: 'Mijozlar' },
    { href: '/statistics', label: 'Statistika' },
  ];

  return (
    <nav className="bg-slate-900 text-white px-6 py-4 border-b border-slate-800">
      <div className="flex items-center gap-8">
        <h1 className="text-xl font-bold">Korzinka.uz</h1>
        <div className="flex gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                pathname === link.href
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
