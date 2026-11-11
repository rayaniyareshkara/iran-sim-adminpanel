/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { adminUserService } from '../../services/adminUserService';
import { useAuth } from '../../services/authContext';
import { AdminUser, AdminRole } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Search,
  CheckCircle2,
  XCircle,
  Trash2,
  Lock,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Check,
  X,
  RefreshCw,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const { user: currentUser, isOwner } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<AdminRole | 'all'>('all');

  // Modal State for New User
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    role: 'Operator' as AdminRole,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminUserService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.mobile.includes(searchQuery) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleToggleStatus = async (user: AdminUser) => {
    if (user.username.toLowerCase() === 'owner') return;
    try {
      const updated = await adminUserService.toggleUserStatus(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'خطا در تغییر وضعیت کاربر');
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (user.username.toLowerCase() === 'owner') return;
    const confirmDelete = window.confirm(
      `آیا از حذف کاربر «${user.fullName}» با نام کاربری «${user.username}» اطمینان دارید؟`
    );
    if (!confirmDelete) return;

    try {
      await adminUserService.deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err: any) {
      alert(err.message || 'خطا در حذف کاربر');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setAddSuccess(null);

    if (!formData.username.trim()) {
      setAddError('لطفاً نام کاربری را وارد کنید.');
      return;
    }
    if (!formData.fullName.trim()) {
      setAddError('لطفاً نام و نام خانوادگی را وارد کنید.');
      return;
    }
    if (!formData.password || formData.password.length < 5) {
      setAddError('رمز عبور باید حداقل ۵ کاراکتر باشد.');
      return;
    }

    try {
      setSubmitting(true);
      const newUser = await adminUserService.createUser({
        username: formData.username,
        fullName: formData.fullName,
        mobile: formData.mobile || '—',
        email: formData.email || `${formData.username}@iransiim.ir`,
        role: formData.role,
        password: formData.password,
      });

      setUsers((prev) => [...prev, newUser]);
      setAddSuccess(`کاربر «${newUser.fullName}» با موفقیت اضافه شد.`);
      setFormData({
        username: '',
        fullName: '',
        mobile: '',
        email: '',
        password: '',
        role: 'Operator',
      });

      setTimeout(() => {
        setIsAddModalOpen(false);
        setAddSuccess(null);
      }, 1500);
    } catch (err: any) {
      setAddError(err.message || 'خطا در ثبت کاربر جدید.');
    } finally {
      setSubmitting(false);
    }
  };

  // Stats calculation
  const totalUsers = users.length;
  const ownerCount = users.filter((u) => u.role === 'Owner').length;
  const operatorCount = users.filter((u) => u.role === 'Operator').length;
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <AdminLayout
      pageTitle="مدیریت کاربران و دسترسی‌ها"
      pageSubtitle="مشاهده، افزودن، ویرایش و تخصیص نقش به اپراتورها و مدیران سیستم"
    >
      <div className="space-y-6">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{totalUsers}</div>
              <div className="text-xs text-slate-400">کل کاربران پنل</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{ownerCount}</div>
              <div className="text-xs text-slate-400">مدیر ارشد (Owner)</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{operatorCount}</div>
              <div className="text-xs text-slate-400">کارشناسان اپراتور</div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{activeCount}</div>
              <div className="text-xs text-slate-400">حساب‌های فعال</div>
            </div>
          </div>
        </div>

        {/* Action Header & Search Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام، نام کاربری یا موبایل..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pr-9 pl-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="all">همه نقش‌ها</option>
                <option value="Owner">مدیر ارشد (Owner)</option>
                <option value="Operator">اپراتور (Operator)</option>
              </select>

              <button
                onClick={fetchUsers}
                title="تازه‌سازی لیست"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>افزودن کاربر جدید</span>
            </button>
          </div>
        </div>

        {/* Users List Table / Cards */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-400" />
              در حال بارگذاری اطلاعات کاربران...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              کاربری با این مشخصات یافت نشد.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs md:text-sm">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs">
                  <tr>
                    <th className="p-4 font-semibold">مشخصات کاربر</th>
                    <th className="p-4 font-semibold">نام کاربری</th>
                    <th className="p-4 font-semibold">سطح دسترسی</th>
                    <th className="p-4 font-semibold">اطلاعات تماس</th>
                    <th className="p-4 font-semibold">وضعیت</th>
                    <th className="p-4 font-semibold text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map((u) => {
                    const isSystemOwner = u.username.toLowerCase() === 'owner';
                    const isSelf = currentUser?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        {/* Name & Avatar */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${
                                u.role === 'Owner'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                              }`}
                            >
                              {u.fullName.slice(0, 1) || 'ک'}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-2">
                                {u.fullName}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    شما
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>عضویت: {u.createdAt?.slice(0, 10) || '۱۴۰۳'}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Username */}
                        <td className="p-4">
                          <span className="font-mono text-slate-200 font-semibold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                            {u.username}
                          </span>
                        </td>

                        {/* Role Badge */}
                        <td className="p-4">
                          {u.role === 'Owner' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Shield className="w-3.5 h-3.5" />
                              مدیر ارشد (Owner)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                              <KeyRound className="w-3.5 h-3.5" />
                              اپراتور (Operator)
                            </span>
                          )}
                        </td>

                        {/* Contact Info */}
                        <td className="p-4">
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-300">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span className="font-mono">{u.mobile}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSystemOwner}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                              isSystemOwner
                                ? 'cursor-not-allowed opacity-80'
                                : 'cursor-pointer hover:opacity-90'
                            } ${
                              u.isActive
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {u.isActive ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>فعال</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>غیرفعال</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-left">
                          <div className="flex items-center justify-end gap-2">
                            {!isSystemOwner ? (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                title="حذف کاربر"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                غیرقابل‌حذف
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add New User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">افزودن کاربر جدید به پنل</h3>
                  <p className="text-xs text-slate-400">ثبت حساب کاربری جدید برای کارمند یا اپراتور</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{addSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    نام و نام خانوادگی <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="مثلاً: علی محمدی"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    نام کاربری (لاتین) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="مثلاً: ali_m"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    رمز عبور <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="حداقل ۵ کاراکتر"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    سطح دسترسی / نقش <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as AdminRole })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Operator">اپراتور (ثبت و مدیریت سفارشات)</option>
                    <option value="Owner">مدیر ارشد (دسترسی به همه بخش‌ها)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    شماره تماس / موبایل
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="0912xxxxxxx"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    ایمیل (اختیاری)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@iransiim.ir"
                    dir="ltr"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>ثبت و فعال‌سازی کاربر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
