/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { useAuth } from '../../services/authContext';
import { adminUserService } from '../../services/adminUserService';
import {
  User,
  Shield,
  KeyRound,
  Lock,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Check,
  RefreshCw,
} from 'lucide-react';

export const AdminProfileView: React.FC = () => {
  const { user, isOwner, logout, updateCurrentUser } = useAuth();

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Profile Edit State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    if (!user) return;

    if (!currentPassword) {
      setPassError('لطفاً رمز عبور فعلی خود را وارد کنید.');
      return;
    }
    if (!newPassword || newPassword.length < 5) {
      setPassError('رمز عبور جدید باید حداقل ۵ کاراکتر باشد.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('رمز عبور جدید با تکرار آن یکسان نیست.');
      return;
    }

    try {
      setIsChangingPass(true);
      await adminUserService.changePassword(user.username, currentPassword, newPassword);
      setPassSuccess('رمز عبور با موفقیت تغییر یافت. برای دفعات بعدی از رمز جدید استفاده کنید.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassError(err.message || 'خطا در تغییر رمز عبور.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsUpdatingProfile(true);
      const updated = await adminUserService.updateUser(user.id, {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
      });
      updateCurrentUser(updated);
      setProfileSuccess('اطلاعات کاربری با موفقیت به‌روزرسانی شد.');
      setTimeout(() => setProfileSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || 'خطا در ذخیره تغییرات');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <AdminLayout
      pageTitle="اطلاعات کاربری و امنیت حساب"
      pageSubtitle="مشاهده مشخصات فردی، مدیریت دسترسی، تغییر رمز عبور و خروج از حساب"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* User Profile Card Header */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl border ${
                isOwner
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
              }`}
            >
              {user?.fullName?.slice(0, 1) || 'ک'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-black text-white">{user?.fullName || 'کاربر سیستم'}</h2>
                {isOwner ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Shield className="w-3.5 h-3.5" />
                    مالک و مدیر ارشد
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <KeyRound className="w-3.5 h-3.5" />
                    اپراتور فروشگاه
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                <span>نام کاربری: <span className="text-slate-200 font-bold">{user?.username}</span></span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  حساب فعال
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition shadow-md shadow-rose-500/5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج از حساب کاربری</span>
          </button>
        </div>

        {/* Two Column Grid: Profile Edit & Change Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Change Password */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">تغییر رمز عبور</h3>
                  <p className="text-xs text-slate-400">برای حفظ امنیت، رمز عبور قوی انتخاب کنید</p>
                </div>
              </div>

              {passError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رمز عبور فعلی <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="رمز عبور فعلی خود را وارد کنید"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <div className="text-[10px] text-slate-500 mt-1">
                    (رمز پیش‌فرض مالک: <span className="font-mono text-slate-400">owner123</span>)
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رمز عبور جدید <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="حداقل ۵ کاراکتر"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    تکرار رمز عبور جدید <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="مجدداً رمز جدید را تایپ کنید"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isChangingPass ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>به‌روزرسانی رمز عبور</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Card 2: Personal Information */}
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">مشخصات تماس و پروفایل</h3>
                  <p className="text-xs text-slate-400">اطلاعات نمایش‌داده‌شده در گزارشات و فاکتورها</p>
                </div>
              </div>

              {profileSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    شماره تماس / موبایل
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    پست الکترونیکی (ایمیل)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-lg shadow-blue-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {isUpdatingProfile ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>ذخیره مشخصات کاربری</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
