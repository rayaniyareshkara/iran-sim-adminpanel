/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../../router';
import { AdminLayout } from '../../layouts/AdminLayout';
import { ShoppingBag, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface AdminGenericViewProps {
  title: string;
  subtitle: string;
  description: string;
}

export const AdminGenericView: React.FC<AdminGenericViewProps> = ({
  title,
  subtitle,
  description,
}) => {
  const { navigate } = useRouter();

  return (
    <AdminLayout pageTitle={title} pageSubtitle={subtitle}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 max-w-4xl mx-auto text-right">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          </div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 rounded-lg transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>مشاهده سفارش‌ها و شماره‌های خریداری‌شده</span>
          </button>
        </div>

        <div className="p-6 bg-slate-950/60 rounded-xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">پیکربندی بخش {title} فعال است</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            تمامی تنظیمات و تعرفه‌های مربوط به این بخش فعال و با سامانه فروش یکپارچه شده است. برای
            مشاهده سفارش‌ها و خطوط واگذار شده به مشتریان، به بخش سفارش‌ها مراجعه فرمایید.
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/admin/orders')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all"
            >
              <span>رفتن به مدیریت سفارش‌ها</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
