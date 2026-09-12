/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from '../../router';
import { AdminLayout } from '../../layouts/AdminLayout';
import { orderService } from '../../services/orderService';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import {
  ArrowRight,
  Phone,
  CreditCard,
  User,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Package,
  Copy,
  Check,
  Gift,
  Wifi,
  Sparkles,
  DollarSign,
  Tag,
  ShieldCheck,
  FileText,
  Calendar,
  Save,
} from 'lucide-react';

export const AdminOrderDetailView: React.FC = () => {
  const { params, navigate } = useRouter();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<boolean>(false);
  const [copiedCustomerPhone, setCopiedCustomerPhone] = useState<boolean>(false);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  const [adminNote, setAdminNote] = useState<string>('');
  const [savingStatus, setSavingStatus] = useState<boolean>(false);
  const [statusSuccessMessage, setStatusSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setError('شناسه سفارش نامعتبر است.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await orderService.getOrderById(orderId);
        if (data) {
          setOrder(data);
          setSelectedStatus(data.orderStatus);
          setAdminNote(data.notes || '');
        } else {
          setError(`سفارشی با شناسه یا شماره ${orderId} یافت نشد.`);
        }
      } catch (err) {
        console.error('Failed to load order:', err);
        setError('خطا در دریافت اطلاعات سفارش از سرور.');
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  const handleCopy = (text: string, type: 'sim' | 'customer') => {
    navigator.clipboard.writeText(text);
    if (type === 'sim') {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    } else {
      setCopiedCustomerPhone(true);
      setTimeout(() => setCopiedCustomerPhone(false), 2000);
    }
  };

  const handleUpdateStatus = async () => {
    if (!order || !selectedStatus) return;

    try {
      setSavingStatus(true);
      setStatusSuccessMessage(null);
      const updated = await orderService.updateOrderStatus(order.id, selectedStatus, adminNote);
      setOrder(updated);
      setStatusSuccessMessage('وضعیت سفارش با موفقیت بروزرسانی شد.');
      setTimeout(() => setStatusSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSavingStatus(false);
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'golden':
        return 'طلایی';
      case 'silver':
        return 'نقره‌ای';
      case 'bronze':
        return 'برنزی';
      case 'normal':
        return 'معمولی';
      default:
        return category || 'طلایی';
    }
  };

  const getSimTypeLabel = (type: string) => {
    return type === 'permanent' ? 'دائمی' : 'اعتباری';
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="جزئیات سفارش">
        <div className="min-h-[400px] flex flex-col items-center justify-center text-slate-400 gap-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">در حال فراخوانی داده‌های سفارش از سرور...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout pageTitle="خطا در سفارش">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto my-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">سفارش یافت نشد</h3>
          <p className="text-sm text-slate-400">{error || 'اطلاعات این سفارش موجود نیست.'}</p>
          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به فهرست سفارش‌ها</span>
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle={`سفارش ${order.orderNumber}`}
      pageSubtitle={`کد رهگیری: ${order.trackingCode} | ثبت شده در تاریخ ${order.timeline[0]?.timestamp || 'اخیر'}`}
    >
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Navigation Breadcrumb & Back Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400">
            <button
              onClick={() => navigate('/admin')}
              className="hover:text-white transition-colors"
            >
              داشبورد
            </button>
            <span>/</span>
            <button
              onClick={() => navigate('/admin/orders')}
              className="hover:text-white transition-colors"
            >
              سفارش‌ها
            </button>
            <span>/</span>
            <span className="text-amber-400 font-mono font-bold">{order.orderNumber}</span>
          </div>

          <button
            onClick={() => navigate('/admin/orders')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به لیست سفارش‌ها</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 🌟 CRITICAL MANDATE: اطلاعات سیم‌کارت خریداری‌شده (PURCHASED SIM SECTION) 🌟 */}
        {/* ========================================================================= */}
        <section
          id="purchased-sim-section"
          className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-[#191d24] border-2 border-[#FFBE00] rounded-2xl p-5 md:p-7 shadow-[0_10px_35px_rgba(255,190,0,0.12)] overflow-hidden"
        >
          {/* Subtle top-right decorative Irancell yellow badge */}
          <div className="absolute top-0 right-0 bg-[#FFBE00] text-black font-black text-[11px] px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>اطلاعات اصلی خط خریداری‌شده</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFBE00]/15 border border-[#FFBE00]/40 flex items-center justify-center text-[#FFBE00] shrink-0">
                <Phone className="w-6 h-6 stroke-[2.4]" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                  <span>اطلاعات سیم‌کارت خریداری‌شده</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  منبع داده: سرور فروشگاه (استخراج مستقیم از فیلدهای ثبت‌شده این سفارش)
                </p>
              </div>
            </div>

            {/* Quick status pill of purchased number */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                تخصیص‌یافته به مشتری
              </span>
              <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded-lg">
                اپراتور: {order.item.operator || 'ایرانسل'}
              </span>
            </div>
          </div>

          {/* Grid of the Exact Fields Specified in the Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {/* 1. شماره سیمکارت خریداری‌شده (0912XXXXXXX) */}
            <div className="bg-slate-950/80 border border-amber-400/30 rounded-xl p-4 flex flex-col justify-between hover:border-amber-400/60 transition-colors">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1.5">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Phone className="w-3.5 h-3.5" />
                  شماره سیم‌کارت:
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  مهم‌ترین مشخصه
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span
                  dir="ltr"
                  className="font-black text-xl sm:text-2xl text-amber-300 font-mono tracking-wider"
                >
                  {order.item.formattedNumber || order.item.phoneNumber}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(order.item.phoneNumber, 'sim')}
                  className="p-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/20 transition-all flex items-center gap-1 text-xs"
                  title="کپی شماره سیم‌کارت"
                >
                  {copiedNumber ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400 font-bold">کپی شد</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">کپی</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. نوع سیمکارت (دائمی / اعتباری) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium mb-1.5">نوع سیم‌کارت:</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-black text-white">
                  {getSimTypeLabel(order.item.type)}
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                    order.item.type === 'permanent'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  }`}
                >
                  {order.item.type === 'permanent' ? 'سیم‌کارت دائمی' : 'سیم‌کارت اعتباری'}
                </span>
              </div>
            </div>

            {/* 3. قیمت سیمکارت */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium mb-1.5">قیمت سیم‌کارت:</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-amber-400 font-mono tracking-tight">
                  {(order.item.price || order.basePrice).toLocaleString('fa-IR')}
                </span>
                <span className="text-xs text-slate-400 font-medium">تومان</span>
              </div>
            </div>

            {/* 4. دسته‌بندی شماره (طلایی / نقره‌ای / برنزی / معمولی) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium mb-1.5">دسته‌بندی شماره:</div>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-slate-200">
                  {getCategoryLabel(order.item.category)}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <Sparkles className="w-3 h-3" />
                  {getCategoryLabel(order.item.category)}
                </span>
              </div>
            </div>

            {/* 5. اینترنت هدیه */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                <span>اینترنت هدیه:</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-cyan-300 font-mono">
                  {order.item.giftInternetGb}
                </span>
                <span className="text-xs font-bold text-slate-300">GB (گیگابایت)</span>
                <span className="text-[10px] text-slate-500 mr-auto">فعال‌سازی با تحویل خط</span>
              </div>
            </div>

            {/* 6. مکالمه هدیه */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div className="text-xs text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>مکالمه هدیه:</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-300 font-mono">
                  {order.item.giftCallMinutes}
                </span>
                <span className="text-xs font-bold text-slate-300">دقیقه رایگان</span>
                <span className="text-[10px] text-slate-500 mr-auto">درون و برون‌شبکه</span>
              </div>
            </div>
          </div>

          {/* 7. بسته یا مزایای همراه */}
          <div className="mt-4 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-slate-300">بسته یا مزایای همراه:</span>
              <span className="text-xs font-bold text-white">
                {order.item.packageTitle ||
                  'بسته آغازین ویژه ایرانسل شامل ۹۰ گیگابایت اینترنت + ۹۰۰ دقیقه مکالمه رایگان'}
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20 font-medium">
              شامل تخفیف ۱۰۰٪ فعال‌سازی اولیه
            </span>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* OTHER ORDER SECTIONS: CUSTOMER, PAYMENT, STATUS UPDATE, TIMELINE           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 spans): Customer Details + Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Details Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">مشخصات خریدار (مشتری)</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">نام و نام خانوادگی:</div>
                  <div className="font-bold text-white">{order.customer.fullName}</div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">کد ملی خریدار:</div>
                  <div className="font-bold text-white font-mono">{order.customer.nationalId}</div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">نام پدر:</div>
                  <div className="font-bold text-white">{order.customer.fatherName}</div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">شماره همراه تماس مشتری:</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white font-mono" dir="ltr">
                      {order.customer.mobileNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.customer.mobileNumber, 'customer')}
                      className="text-slate-400 hover:text-white"
                      title="کپی شماره"
                    >
                      {copiedCustomerPhone ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {order.customer.secondaryMobile && (
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                    <div className="text-slate-400 text-xs mb-1">شماره تماس دوم:</div>
                    <div className="font-bold text-white font-mono" dir="ltr">
                      {order.customer.secondaryMobile}
                    </div>
                  </div>
                )}

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">پلاک:</div>
                  <div className="font-bold text-white font-mono">
                    {order.customer.buildingNumber || '-'}
                  </div>
                </div>
              </div>

              {/* Full Address */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-400 text-xs mb-1">نشانی پستی محل تحویل:</div>
                  <div className="font-medium text-slate-200 leading-relaxed text-xs sm:text-sm">
                    {order.customer.fullAddress}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Financial Details Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">اطلاعات مالی و پرداخت بانکی</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">وضعیت پرداخت:</div>
                  <div className="font-bold">
                    {order.payment.status === 'paid' ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        پرداخت موفق
                      </span>
                    ) : order.payment.status === 'pending' ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        در انتظار پرداخت
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        ناموفق
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">درگاه پرداخت:</div>
                  <div className="font-bold text-white">
                    {order.payment.gatewayName || 'درگاه بانکی شاپرک'}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 text-xs mb-1">روش پرداخت:</div>
                  <div className="font-bold text-white">
                    {order.payment.method === 'online' ? 'آنلاین (اینترنتی)' : 'کارت به کارت'}
                  </div>
                </div>
              </div>

              {/* Transaction Codes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 mb-1">شناسه تراکنش بانکی (TXN):</div>
                  <div className="font-mono text-slate-200 font-semibold">
                    {order.payment.transactionId || 'در انتظار تایید'}
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850">
                  <div className="text-slate-400 mb-1">شماره مرجع بانکی (Ref Number):</div>
                  <div className="font-mono text-slate-200 font-semibold">
                    {order.payment.refNumber || '-'}
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>مبلغ سیم‌کارت:</span>
                  <span className="font-mono text-slate-200">
                    {(order.item.price || order.basePrice).toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                {order.shippingPrice > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>هزینه ارسال ({order.shippingMethodTitle}):</span>
                    <span className="font-mono text-slate-200">
                      {order.shippingPrice.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                )}
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>تخفیف اعمال شده:</span>
                    <span className="font-mono">
                      -{order.discountAmount.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-base text-white">
                  <span>جمع کل پرداخت‌شده:</span>
                  <span className="text-amber-400 font-mono">
                    {order.totalPrice.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (1 span): Order Management, Status Changer, and Timeline */}
          <div className="space-y-6">
            {/* Status Management & Admin Notes Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Save className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-bold text-white">مدیریت وضعیت سفارش</h3>
              </div>

              {/* Change Status Dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  وضعیت جاری سفارش:
                </label>
                <select
                  value={selectedStatus || order.orderStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-hidden focus:border-amber-400"
                >
                  <option value="created">ثبت اولیه سفارش</option>
                  <option value="payment_confirmed">تأیید پرداخت اینترنتی</option>
                  <option value="processing">بررسی مدارک و احراز هویت</option>
                  <option value="packaging">آماده‌سازی و بسته‌بندی</option>
                  <option value="shipping">تحویل به مامور ارسال / پست</option>
                  <option value="delivered">تحویل نهایی به خریدار</option>
                  <option value="cancelled">لغو سفارش</option>
                </select>
              </div>

              {/* Admin Note */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  یادداشت داخلی ادمین:
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="توضیحات اضافه جهت پیگیری سفارش..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-400 resize-none"
                />
              </div>

              {statusSuccessMessage && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{statusSuccessMessage}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={savingStatus}
                className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {savingStatus ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال ذخیره تغییرات...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>ذخیره وضعیت سفارش</span>
                  </>
                )}
              </button>
            </div>

            {/* Shipping & Delivery Info */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-white">اطلاعات ارسال و توزیع</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>روش ارسال:</span>
                  <span className="font-semibold text-slate-200">
                    {order.shippingMethodTitle || 'پست پیشتاز'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>کد پیگیری بسته:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {order.trackingCode}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <h4 className="font-bold text-white text-xs">مراحل و تایم‌لاین سفارش</h4>
              </div>

              <div className="space-y-4 pt-1">
                {order.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 relative">
                    {/* Step Icon */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs z-10 ${
                        step.isCompleted
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {step.isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs">
                        <span
                          className={`font-bold ${
                            step.isCompleted ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          {step.title}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {step.timestamp}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
