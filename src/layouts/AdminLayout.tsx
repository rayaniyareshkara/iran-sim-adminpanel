/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../router';
import { useAuth } from '../services/authContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  Menu,
  X,
  Store,
  ChevronLeft,
  UserCheck,
  Shield,
  KeyRound,
  LogOut,
  Lock,
  Users,
  User,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

interface NavItem {
  title: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  ownerOnly?: boolean;
}

const adminNavItems: NavItem[] = [
  { title: 'داشبورد', path: '/admin', icon: LayoutDashboard },
  { title: 'مدیریت سفارش‌ها', path: '/admin/orders', icon: ShoppingBag },
  { title: 'تعیین قیمت سیم‌کارت‌ها', path: '/admin/pricing', icon: Tag, ownerOnly: true },
  { title: 'مدیریت کاربران و دسترسی‌ها', path: '/admin/users', icon: Users, ownerOnly: true },
  { title: 'پروفایل و تغییر رمز عبور', path: '/admin/profile', icon: KeyRound },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
}) => {
  const { path, navigate } = useRouter();
  const { user, isOwner, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleNavClick = (destPath: string) => {
    navigate(destPath);
    setMobileDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-['Vazirmatn',sans-serif]">
      {/* Desktop Sidebar (RTL Right side) */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-l border-slate-800 flex-col shrink-0">
        {/* Brand / Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              IR
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">پنل مدیریت فروشگاه</div>
              <div className="text-xs text-slate-400">نمایندگی رسمی ایرانسل</div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isRestricted = item.ownerOnly && !isOwner;
            const isActive =
              item.path === '/admin'
                ? path === '/admin' || path === '/'
                : path.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (isRestricted) return;
                  handleNavClick(item.path);
                }}
                disabled={isRestricted}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right ${
                  isRestricted
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 cursor-pointer'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive && !isRestricted ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1 truncate">{item.title}</span>
                {isRestricted ? (
                  <span className="flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    <Lock className="w-2.5 h-2.5" />
                    مالک
                  </span>
                ) : (
                  isActive && <ChevronLeft className="w-3.5 h-3.5 text-blue-200" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Return to Customer Store button */}
        <div className="p-3 border-t border-slate-800">
          <a
            href="https://iransiim.ir/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 rounded-lg transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            مشاهده سایت مشتری (Store)
          </a>
        </div>
      </aside>

      {/* Mobile Drawer Navigation Backdrop */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer Navigation */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-72 bg-slate-900 border-l border-slate-800 z-50 transform transition-transform duration-200 ease-in-out lg:hidden flex flex-col ${
          mobileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              IR
            </div>
            <span className="font-bold text-sm text-white">پنل مدیریت ایران‌سیم</span>
          </div>
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isRestricted = item.ownerOnly && !isOwner;
            const isActive =
              item.path === '/admin'
                ? path === '/admin' || path === '/'
                : path.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  if (isRestricted) return;
                  handleNavClick(item.path);
                }}
                disabled={isRestricted}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-right ${
                  isRestricted
                    ? 'opacity-40 cursor-not-allowed text-slate-500'
                    : isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </div>
                {isRestricted && (
                  <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    مخصوص مالک
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <a
            href="https://iransiim.ir/"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-amber-400 bg-amber-400/10 rounded-lg"
          >
            <Store className="w-3.5 h-3.5" />
            مشاهده سایت مشتری
          </a>
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white">
                {pageTitle || 'داشبورد مدیریت'}
              </h2>
              {pageSubtitle && (
                <p className="text-xs text-slate-400 hidden sm:block">{pageSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://iransiim.ir/"
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
            >
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>فروشگاه اصلی</span>
            </a>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Current User Badge & Role */}
            <button
              onClick={() => handleNavClick('/admin/profile')}
              title="مشاهده پروفایل و تغییر رمز عبور"
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition cursor-pointer text-right"
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border ${
                  isOwner
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                }`}
              >
                {isOwner ? <Shield className="w-3.5 h-3.5" /> : <KeyRound className="w-3.5 h-3.5" />}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">
                  {user?.fullName || 'کاربر پنل'}
                </div>
                <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <span>نقش:</span>
                  <span className={isOwner ? 'text-amber-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {isOwner ? 'مالک (Owner)' : 'اپراتور (Operator)'}
                  </span>
                </div>
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="خروج از حساب کاربری"
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-rose-500/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
