/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth, DEFAULT_ACCOUNTS } from '../../services/authContext';
import { Shield, KeyRound, User, Lock, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const AdminLoginView: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'خطا در ورود به سیستم.');
    }
  };

  const handleQuickLogin = (userType: 'owner' | 'operator') => {
    const acc = DEFAULT_ACCOUNTS.find((a) => a.username === userType);
    if (acc) {
      setUsername(acc.username);
      setPassword(acc.password);
      setErrorMsg(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 font-['Vazirmatn',sans-serif] text-slate-100">
      {/* Background ambient glow */}
      <div className="absolute w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -top-20 -right-20 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -bottom-20 -left-20 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-2xl shadow-xl shadow-blue-500/20 mb-4 ring-4 ring-blue-500/20">
            IR
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ورود به پنل مدیریت ایران‌سیم</h1>
          <p className="text-sm text-slate-400 mt-2">سامانه کنترل دسترسی و نظارت بر فروش سیم‌کارت</p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: owner یا operator"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  dir="ltr"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  dir="ltr"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>در حال بررسی اطلاعات...</span>
              ) : (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Role selection quick test buttons */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 mb-3 text-center">
              ورود سریع آزمایشی بر اساس سطح دسترسی:
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('owner')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 hover:border-amber-500/60 rounded-xl transition-all text-right group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>مالک سیستم</span>
                </div>
                <span className="text-[10px] text-slate-400">دسترسی کامل + تغییر قیمت</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-cyan-500/30 hover:border-cyan-500/60 rounded-xl transition-all text-right group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold mb-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>اپراتور (کارمند)</span>
                </div>
                <span className="text-[10px] text-slate-400">مشاهده و ارسال سفارشات</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>ارتباط امن با سامانه مدیریت ایران‌سیم</span>
        </div>
      </div>
    </div>
  );
};
