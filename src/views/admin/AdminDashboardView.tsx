/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from '../../router';
import { AdminLayout } from '../../layouts/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';
import {
  ShoppingBag,
  Phone,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  ArrowLeft,
  Store,
  Sparkles,
  Users,
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const { navigate } = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const list = await orderService.getOrders();
        setOrders(list);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const totalSales = orders
    .filter((o) => o.payment.status === 'paid')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const pendingCount = orders.filter((o) => o.payment.status === 'pending').length;
  const inProgressCount = orders.filter(
    (o) => o.orderStatus === 'processing' || o.orderStatus === 'packaging' || o.orderStatus === 'shipping'
  ).length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'delivered').length;

  return (
    <AdminLayout
      pageTitle="پیشخوان مدیریت"
      pageSubtitle="گزارش لحظه‌ای فروش سیم‌کارت، آمار سفارش‌ها و گردش مالی"
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">مجموع فروش واریزی</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-white font-mono">
              {totalSales.toLocaleString('fa-IR')}{' '}
              <span className="text-xs font-normal text-slate-400">تومان</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">کل سفارش‌های ثبت‌شده</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-white font-mono">{orders.length}</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">سفارش‌های در حال آماده‌سازی</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-cyan-400 font-mono">
              {inProgressCount}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">تحویل شده نهایی</span>
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-teal-400 font-mono">
              {deliveredCount}
            </div>
          </div>
        </div>

        {/* Quick Access to Orders List Banner */}
        <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-amber-900/30 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <span>مدیریت شماره‌های سیم‌کارت خریداری‌شده</span>
            </h3>
            <p className="text-xs text-slate-400">
              مشاهده و بررسی سریع خطوط ثبت‌شده، وضعیت فعال‌سازی و اطلاعات مشتریان
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/orders')}
            className="px-4 py-2 bg-[#FFBE00] hover:bg-[#E5AA00] text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>ورود به مدیریت سفارش‌ها</span>
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* Recent Orders Section with Purchased Number Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-white text-sm">آخرین سفارش‌های ثبت‌شده</h3>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <span>مشاهده همه</span>
              <ArrowLeft className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-xs font-bold text-slate-400">
                  <th className="py-3 px-4">شماره سفارش</th>
                  <th className="py-3 px-4">مشتری</th>
                  <th className="py-3 px-4 text-amber-400">شماره خریداری‌شده</th>
                  <th className="py-3 px-4">مبلغ</th>
                  <th className="py-3 px-4">پرداخت</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {orders.slice(0, 5).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/admin/orders/${order.id}`)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-400">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{order.customer.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-mono" dir="ltr">
                        {order.customer.mobileNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          dir="ltr"
                          className="font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 text-xs"
                        >
                          {order.item.formattedNumber || order.item.phoneNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({order.item.type === 'permanent' ? 'دائمی' : 'اعتباری'})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200">
                      {order.totalPrice.toLocaleString('fa-IR')} تومان
                    </td>
                    <td className="py-3 px-4">
                      {order.payment.status === 'paid' ? (
                        <span className="text-emerald-400 font-semibold">پرداخت شده</span>
                      ) : (
                        <span className="text-amber-400 font-semibold">در انتظار</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {order.orderStatus === 'delivered'
                        ? 'تحویل شده'
                        : order.orderStatus === 'shipping'
                        ? 'ارسال با پست'
                        : order.orderStatus === 'packaging'
                        ? 'بسته‌بندی'
                        : order.orderStatus === 'processing'
                        ? 'احراز هویت'
                        : 'ثبت اولیه'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/orders/${order.id}`);
                        }}
                        className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-600 rounded transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
