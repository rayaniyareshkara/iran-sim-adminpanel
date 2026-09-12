/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from '../../router';
import { AdminLayout } from '../../layouts/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertCircle,
  Copy,
  Check,
  Phone,
  Gift,
  Wifi,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

export const AdminOrdersListView: React.FC = () => {
  const { navigate } = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders in admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCopyNumber = (phoneNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phoneNumber);
    setCopiedNumber(phoneNumber);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Search query (matches orderNumber, customer name, mobile, or purchased SIM number)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesNumber = order.item.phoneNumber.toLowerCase().includes(q);
        const matchesFormatted = order.item.formattedNumber.replace(/\s+/g, '').includes(q);
        const matchesOrder = order.orderNumber.toLowerCase().includes(q);
        const matchesTrack = order.trackingCode.toLowerCase().includes(q);
        const matchesName = order.customer.fullName.toLowerCase().includes(q);
        const matchesCustMobile = order.customer.mobileNumber.includes(q);

        if (!matchesNumber && !matchesFormatted && !matchesOrder && !matchesTrack && !matchesName && !matchesCustMobile) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter !== 'all' && order.orderStatus !== statusFilter) {
        return false;
      }

      // 3. Payment filter
      if (paymentFilter !== 'all' && order.payment.status !== paymentFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Status label & color helper
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'created':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            ثبت اولیه
          </span>
        );
      case 'payment_confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            تأیید پرداخت
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Sparkles className="w-3 h-3" />
            احراز هویت و فعال‌سازی
          </span>
        );
      case 'packaging':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <Package className="w-3 h-3" />
            بسته‌بندی
          </span>
        );
      case 'shipping':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            <Truck className="w-3 h-3" />
            ارسال شده
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <CheckCircle2 className="w-3 h-3" />
            تحویل داده شده
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertCircle className="w-3 h-3" />
            لغو شده
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            پرداخت شده
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Clock className="w-3 h-3" />
            در انتظار
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertCircle className="w-3 h-3" />
            ناموفق
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) return null;
    switch (category) {
      case 'golden':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
            طلایی
          </span>
        );
      case 'silver':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-400/20 text-slate-200 border border-slate-400/40">
            نقره‌ای
          </span>
        );
      case 'bronze':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-500/20 text-orange-300 border border-orange-500/40">
            برنزی
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-700 text-slate-300">
            معمولی
          </span>
        );
    }
  };

  return (
    <AdminLayout
      pageTitle="مدیریت سفارش‌ها"
      pageSubtitle="فهرست کامل سفارش‌ها و اطلاعات سیم‌کارت‌های خریداری‌شده"
    >
      <div className="space-y-5">
        {/* Top Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="text-xs text-slate-400 mb-1 font-medium">کل سفارش‌ها</div>
            <div className="text-xl font-black text-white font-mono">{orders.length}</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="text-xs text-slate-400 mb-1 font-medium">سیم‌کارت‌های پرداخت‌شده</div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {orders.filter((o) => o.payment.status === 'paid').length}
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="text-xs text-slate-400 mb-1 font-medium">در حال پردازش و ارسال</div>
            <div className="text-xl font-black text-blue-400 font-mono">
              {
                orders.filter(
                  (o) =>
                    o.orderStatus === 'processing' ||
                    o.orderStatus === 'packaging' ||
                    o.orderStatus === 'shipping'
                ).length
              }
            </div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
            <div className="text-xs text-slate-400 mb-1 font-medium">مجموع مبالغ واریزی</div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {orders
                .filter((o) => o.payment.status === 'paid')
                .reduce((acc, curr) => acc + curr.totalPrice, 0)
                .toLocaleString('fa-IR')}{' '}
              <span className="text-[11px] font-normal text-slate-400">تومان</span>
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با شماره خریداری‌شده (0912...)، شماره سفارش، یا نام مشتری..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-10 pl-4 py-2 text-xs md:text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">همه وضعیت‌های سفارش</option>
              <option value="created">ثبت اولیه</option>
              <option value="payment_confirmed">تأیید پرداخت</option>
              <option value="processing">احراز هویت</option>
              <option value="packaging">بسته‌بندی</option>
              <option value="shipping">در حال ارسال</option>
              <option value="delivered">تحویل شده</option>
              <option value="cancelled">لغو شده</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">همه وضعیت‌های پرداخت</option>
              <option value="paid">پرداخت موفق</option>
              <option value="pending">در انتظار پرداخت</option>
              <option value="failed">پرداخت ناموفق</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={fetchOrders}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
              title="بروزرسانی داده‌ها"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-950/70 border-b border-slate-800 text-[13px] font-bold text-slate-400">
                  <th className="py-3.5 px-4">شماره سفارش</th>
                  <th className="py-3.5 px-4">مشتری</th>
                  {/* CRITICAL COLUMN SPECIFIED IN PROMPT */}
                  <th className="py-3.5 px-4 text-[#FFBE00]">
                    <div className="flex items-center gap-1.5 font-black text-amber-400">
                      <Phone className="w-4 h-4" />
                      <span>شماره خریداری‌شده</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4">مبلغ</th>
                  <th className="py-3.5 px-4">پرداخت</th>
                  <th className="py-3.5 px-4">وضعیت</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>در حال بارگذاری اطلاعات سفارش‌ها...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 text-slate-600" />
                        <span className="font-medium">سفارشی با معیارهای جستجو یافت نشد.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isCopied = copiedNumber === order.item.phoneNumber;
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                        className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                      >
                        {/* 1. شماره سفارش */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-white font-mono flex items-center gap-1.5">
                            <span className="text-blue-400 group-hover:underline">
                              {order.orderNumber}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            کد رهگیری: {order.trackingCode}
                          </div>
                        </td>

                        {/* 2. مشتری */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">
                            {order.customer.fullName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5" dir="ltr">
                            {order.customer.mobileNumber}
                          </div>
                        </td>

                        {/* 3. شماره خریداری‌شده (CORE REQUIREMENT) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {/* Large prominent purchased phone number */}
                              <span
                                dir="ltr"
                                className="font-black text-sm sm:text-base text-amber-300 font-mono tracking-wider bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/30"
                              >
                                {order.item.formattedNumber || order.item.phoneNumber}
                              </span>

                              {/* Instant Copy Button */}
                              <button
                                type="button"
                                onClick={(e) => handleCopyNumber(order.item.phoneNumber, e)}
                                className="p-1 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
                                title="کپی شماره سیم‌کارت"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Tags: نوع سیمکارت (دائمی/اعتباری) + دسته‌بندی */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {/* SIM Type badge */}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  order.item.type === 'permanent'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                }`}
                              >
                                {order.item.type === 'permanent' ? 'دائمی' : 'اعتباری'}
                              </span>

                              {/* Category tag */}
                              {getCategoryBadge(order.item.category)}

                              {/* Gift benefits summary badge */}
                              {(order.item.giftInternetGb > 0 || order.item.giftCallMinutes > 0) && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Gift className="w-2.5 h-2.5 text-amber-400" />
                                  <span>{order.item.giftInternetGb}GB</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 4. مبلغ */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                          <div className="font-bold text-slate-100">
                            {order.totalPrice.toLocaleString('fa-IR')}
                          </div>
                          <div className="text-[10px] text-slate-400">تومان</div>
                        </td>

                        {/* 5. پرداخت */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getPaymentBadge(order.payment.status)}
                          {order.payment.gatewayName && (
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[110px]">
                              {order.payment.gatewayName}
                            </div>
                          )}
                        </td>

                        {/* 6. وضعیت */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(order.orderStatus)}
                        </td>

                        {/* 7. عملیات */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/orders/${order.id}`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 border border-blue-500/30 hover:border-blue-600 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              نمایش <span className="font-bold text-white">{filteredOrders.length}</span> از{' '}
              <span className="font-bold text-white">{orders.length}</span> سفارش ثبت‌شده
            </div>
            <div className="text-[11px] text-slate-500">
              منبع اصلی داده‌ها: پایگاه داده سفارش‌های سرور (Backend Source of Truth)
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
