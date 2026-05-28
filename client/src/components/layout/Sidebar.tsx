'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';
import { LayoutDashboard, LogOut, User } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authService.getMe(),
    retry: false,
  });

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  ];

  return (
    <aside className="w-64 bg-[#0b0f19] border-r border-white/8 flex flex-col justify-between h-screen sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 text-lg">
            TF
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 font-sans tracking-tight">
            TaskFlow
          </span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 font-medium border border-indigo-500/10'
                    : 'text-neutral-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-6 border-t border-white/5">
        {isLoading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
            </div>
          </div>
        ) : me ? (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white uppercase border border-white/10">
              {me.name ? me.name.charAt(0) : <User className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{me.name}</div>
              <div className="text-xs text-neutral-500 truncate">{me.email}</div>
            </div>
          </div>
        ) : null}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/10"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
