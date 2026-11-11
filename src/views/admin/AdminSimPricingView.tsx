/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../layouts/AdminLayout';
import { pricingService } from '../../services/pricingService';
import { numberService } from '../../services/numberService';
import { useAuth } from '../../services/authContext';
import { PricingConfig } from '../../types';
import {
  CheckCircle2,
  RefreshCw,
  Save,
  ShieldCheck,
  Zap,
  Tag,
  AlertCircle,
  Eye,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export const AdminSimPricingView: React.FC = () => {
  const { isOwner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Permanent SIM Form State
  const [permanentPrice, setPermanentPrice] = useState<number>(2850000);
  const [permanentSalePrice, setPermanentSalePrice] = useState<number>(2686000);
  const [hasPermanentSale, setHasPermanentSale] = useState<boolean>(true);
  const [isPermanentActive, setIsPermanentActive] = useState<boolean>(true);

  // Credit SIM Form State
  const [creditPrice, setCreditPrice] = useState<number>(1500000);
  const [creditSalePrice, setCreditSalePrice] = useState<number>(1350000);
  const [hasCreditSale, setHasCreditSale] = useState<boolean>(true);
  const [isCreditActive, setIsCreditActive] = useState<boolean>(true);

  // Option to cascade price updates to existing catalog numbers
  const [syncCatalogNumbers, setSyncCatalogNumbers] = useState<boolean>(true);

  useEffect(() => {
    loadPricingData();
  }, []);

  const loadPricingData = async () => {
    try {
      setLoading(true);
      const data: PricingConfig = await pricingService.getPricing();
      setPermanentPrice(data.permanentSimPrice || data.baseSimPrice || 2850000);
      setPermanentSalePrice(data.permanentSimSalePrice || data.saleSimPrice || 2686000);
      setHasPermanentSale(
        data.permanentSimSalePrice != null &&
          data.permanentSimSalePrice > 0 &&
          data.permanentSimSalePrice < (data.permanentSimPrice || 2850000)
      );
      setIsPermanentActive(data.isPermanentAvailable !== false);

      setCreditPrice(data.creditSimPrice || 1500000);
      setCreditSalePrice(data.creditSimSalePrice || 1350000);
      setHasCreditSale(
        data.creditSimSalePrice != null &&
          data.creditSimSalePrice > 0 &&
          data.creditSimSalePrice < (data.creditSimPrice || 1500000)
      );
      setIsCreditActive(data.isCreditAvailable !== false);

      if (data.updatedAt) {
        const d = new Date(data.updatedAt);
        setLastUpdated(
          d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) +
            ' - ' +
            d.toLocaleDateString('fa-IR')
        );
      } else {
        setLastUpdated('لحظاتی پیش');
      }
    } catch {
      setErrorMessage('خطا در دریافت اطلاعات تعرفه قیمت');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (permanentPrice <= 0 || creditPrice <= 0) {
      setErrorMessage('لطفاً مبالغ معتبر بزرگتر از صفر وارد نمایید.');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage(null);

      const permSaleFinal = hasPermanentSale && permanentSalePrice > 0 ? permanentSalePrice : permanentPrice;
      const credSaleFinal = hasCreditSale && creditSalePrice > 0 ? creditSalePrice : creditPrice;

      await pricingService.updatePricing({
        permanentSimPrice: permanentPrice,
        permanentSimSalePrice: permSaleFinal,
        isPermanentAvailable: isPermanentActive,
        creditSimPrice: creditPrice,
        creditSimSalePrice: credSaleFinal,
        isCreditAvailable: isCreditActive,
        baseSimPrice: permanentPrice,
        saleSimPrice: permSaleFinal,
      });

      if (syncCatalogNumbers) {
        await numberService.updatePricesByType('permanent', permSaleFinal);
        await numberService.updatePricesByType('credit', credSaleFinal);
      }

      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) +
          ' - ' +
          now.toLocaleDateString('fa-IR')
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch {
      setErrorMessage('ذخیره‌سازی اطلاعات با خطا مواجه شد. دوباره تلاش کنید.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setPermanentPrice(2850000);
    setPermanentSalePrice(2686000);
    setHasPermanentSale(true);
    setIsPermanentActive(true);

    setCreditPrice(1500000);
    setCreditSalePrice(1350000);
    setHasCreditSale(true);
    setIsCreditActive(true);
  };

  const calculateDiscountPercent = (base: number, sale: number): number => {
    if (!base || !sale || base <= sale) return 0;
    return Math.round(((base - sale) / base) * 100);
  };

  const permanentDiscount = calculateDiscountPercent(permanentPrice, permanentSalePrice);
  const creditDiscount = calculateDiscountPercent(creditPrice, creditSalePrice);

  if (!isOwner) {
    return (
      <AdminLayout
        pageTitle="دسترسی غیرمجاز"
        pageSubtitle="تنظیم قیمت سیم‌کارت‌ها فقط مختص مالک سیستم است"
      >
        <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-amber-500/30 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">سطح دسترسی شما کافی نیست</h3>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            تغییر تعرفه و قیمت سیم‌کارت‌های دائمی و اعتباری تنها در اختیار کاربر با نقش <span className="text-amber-400 font-bold">مالک (Owner)</span> قرار دارد. شما با نقش اپراتور وارد شده‌اید.
          </p>
          <a
            href="/admin/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors"
          >
            بازگشت به مدیریت سفارش‌ها
          </a>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      pageTitle="تغییر قیمت سیم‌کارت‌ها"
      pageSubtitle="تنظیم قیمت پایه و تعرفه فروش سیم‌کارت‌های دائمی و اعتباری فروشگاه"
    >
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>تعرفه فعال سیم‌کارت‌های ایران‌سیم</span>
                {lastUpdated && (
                  <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                    آخرین تغییر: {lastUpdated}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                قیمت‌های تنظیم‌شده بلافاصله در محاسبه سبد خرید و صدور فاکتور اعمال می‌شوند
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              id="reset-pricing-btn"
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بازنشانی پیش‌فرض</span>
            </button>

            <button
              id="save-pricing-btn"
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/10"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>در حال ذخیره...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات قیمت</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {savedSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">
                تغییرات قیمت سیم‌کارت‌های دائمی و اعتباری با موفقیت ذخیره و در سامانه اعمال شد.
              </span>
            </div>
            <span className="text-[11px] text-emerald-400/80">همگام‌سازی کامل</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-950/60 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main 2-Column Pricing Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Permanent SIM Card Pricing */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <h3 className="text-base font-bold text-white">سیم‌کارت‌های دائمی</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-slate-400">
                  {isPermanentActive ? 'فعال برای فروش' : 'غیرفعال'}
                </span>
                <input
                  type="checkbox"
                  checked={isPermanentActive}
                  onChange={(e) => setIsPermanentActive(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Base Price Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>قیمت پایه سیم‌کارت دائمی (تومان)</span>
                <span className="text-amber-400 font-mono text-xs">
                  {permanentPrice.toLocaleString('fa-IR')} تومان
                </span>
              </label>
              <div className="relative">
                <input
                  id="permanent-price-input"
                  type="number"
                  min="0"
                  step="10000"
                  value={permanentPrice}
                  onChange={(e) => setPermanentPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500">تومان</span>
              </div>
              {/* Quick Preset Adjustments */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setPermanentPrice((p) => p + 100000)}
                  className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  +۱۰۰,۰۰۰
                </button>
                <button
                  type="button"
                  onClick={() => setPermanentPrice((p) => p + 500000)}
                  className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  +۵۰۰,۰۰۰
                </button>
                <button
                  type="button"
                  onClick={() => setPermanentPrice((p) => Math.max(0, p - 100000))}
                  className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  -۱۰۰,۰۰۰
                </button>
                <button
                  type="button"
                  onClick={() => setPermanentPrice(2850000)}
                  className="px-2 py-0.5 text-[11px] bg-slate-800/60 hover:bg-slate-700 text-slate-400 rounded border border-slate-700/60"
                >
                  ۲,۸۵۰,۰۰۰
                </button>
              </div>
            </div>

            {/* Discount / Sale Price Section */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasPermanentSale}
                    onChange={(e) => setHasPermanentSale(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>اعمال تخفیف فروش سیم‌کارت دائمی</span>
                  </span>
                </label>

                {hasPermanentSale && permanentDiscount > 0 && (
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                    {permanentDiscount}% تخفیف
                  </span>
                )}
              </div>

              {hasPermanentSale && (
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>قیمت نهایی با تخفیف (تومان)</span>
                    <span className="text-emerald-400 font-mono text-xs">
                      {permanentSalePrice.toLocaleString('fa-IR')} تومان
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="permanent-sale-price-input"
                      type="number"
                      min="0"
                      step="10000"
                      value={permanentSalePrice}
                      onChange={(e) => setPermanentSalePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500">تومان</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    این قیمت به عنوان مبلغ قابل پرداخت در فاکتور برای سیم‌کارت‌های دائمی نمایش داده می‌شود.
                  </p>
                </div>
              )}
            </div>

            {/* Permanent Info Badge */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white">مزایای تعریف‌شده سیم‌کارت دائمی:</span>
                <p className="text-slate-400 text-[11px]">
                  ۹۰۰ دقیقه مکالمه رایگان، ۹۰ گیگابایت اینترنت هدیه ۶ ماهه، عدم نیاز به شارژ دوره‌ای و سقف اعتبار بالا.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Credit SIM Card Pricing */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <h3 className="text-base font-bold text-white">سیم‌کارت‌های اعتباری</h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs text-slate-400">
                  {isCreditActive ? 'فعال برای فروش' : 'غیرفعال'}
                </span>
                <input
                  type="checkbox"
                  checked={isCreditActive}
                  onChange={(e) => setIsCreditActive(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Base Price Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                <span>قیمت پایه سیم‌کارت اعتباری (تومان)</span>
                <span className="text-cyan-400 font-mono text-xs">
                  {creditPrice.toLocaleString('fa-IR')} تومان
                </span>
              </label>
              <div className="relative">
                <input
                  id="credit-price-input"
                  type="number"
                  min="0"
                  step="10000"
                  value={creditPrice}
                  onChange={(e) => setCreditPrice(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                />
                <span className="absolute left-3 top-2.5 text-xs text-slate-500">تومان</span>
              </div>
              {/* Quick Preset Adjustments */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setCreditPrice((p) => p + 50000)}
                  className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  +۵۰,۰۰۰
                </button>
                <button
                  type="button"
                  onClick={() => setCreditPrice((p) => p + 200000)}
                  className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  +۲۰۰,۰۰۰
                </button>
                <button
                  type="button"
                  onClick={() => setCreditPrice((p) => Math.max(0, p - 50000))}
                  className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  -۵۰,۰۰۰
                </button>
                <button
                  type="button"
                  onClick={() => setCreditPrice(1500000)}
                  className="px-2 py-0.5 text-[11px] bg-slate-800/60 hover:bg-slate-700 text-slate-400 rounded border border-slate-700/60"
                >
                  ۱,۵۰۰,۰۰۰
                </button>
              </div>
            </div>

            {/* Discount / Sale Price Section */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasCreditSale}
                    onChange={(e) => setHasCreditSale(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />
                    <span>اعمال تخفیف فروش سیم‌کارت اعتباری</span>
                  </span>
                </label>

                {hasCreditSale && creditDiscount > 0 && (
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    {creditDiscount}% تخفیف
                  </span>
                )}
              </div>

              {hasCreditSale && (
                <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>قیمت نهایی با تخفیف (تومان)</span>
                    <span className="text-emerald-400 font-mono text-xs">
                      {creditSalePrice.toLocaleString('fa-IR')} تومان
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="credit-sale-price-input"
                      type="number"
                      min="0"
                      step="10000"
                      value={creditSalePrice}
                      onChange={(e) => setCreditSalePrice(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none transition-colors"
                    />
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500">تومان</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    این قیمت به عنوان مبلغ قابل پرداخت در فاکتور برای سیم‌کارت‌های اعتباری نمایش داده می‌شود.
                  </p>
                </div>
              )}
            </div>

            {/* Credit Info Badge */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-white">مزایای تعریف‌شده سیم‌کارت اعتباری:</span>
                <p className="text-slate-400 text-[11px]">
                  ۵۰۰ دقیقه مکالمه رایگان، ۴۵ گیگابایت اینترنت هدیه ۳ ماهه، قابلیت فعال‌سازی بسته‌های اقتصادی و شارژ آنلاین.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Catalog Checkbox Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              id="sync-catalog-checkbox"
              type="checkbox"
              checked={syncCatalogNumbers}
              onChange={(e) => setSyncCatalogNumbers(e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-white">
                همگام‌سازی و به‌روزرسانی قیمت شماره‌های موجود در سامانه
              </span>
              <p className="text-[11px] text-slate-400">
                در صورت فعال بودن، قیمت تمام شماره‌های موجود در بانک شماره‌ها متناسب با نوع (دائمی یا اعتباری) فوراً بروزرسانی می‌شود.
              </p>
            </div>
          </label>

          <span className="text-[11px] text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md shrink-0">
            توصیه شده جهت یکپارچگی قیمت‌ها
          </span>
        </div>

        {/* Live Customer Preview Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400" />
              <span>پیش‌نمایش قیمت‌ها</span>
            </h4>
            <span className="text-xs text-slate-500">مشاهده زنده تغییرات اعمالی</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Preview: Permanent SIM */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-amber-300"></div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      سیم‌کارت دائمی
                    </span>
                    <span className="text-xs text-slate-400">اپراتور ایرانسل</span>
                  </div>
                  <div className="mt-2 text-lg font-black text-white font-mono" dir="ltr">
                    0900 284 1435
                  </div>
                </div>

                <div className="text-left">
                  {hasPermanentSale && permanentDiscount > 0 ? (
                    <div>
                      <div className="text-xs text-slate-500 line-through font-mono">
                        {permanentPrice.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-xl font-black text-amber-400 font-mono">
                        {permanentSalePrice.toLocaleString('fa-IR')}{' '}
                        <span className="text-xs text-slate-400 font-normal">تومان</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl font-black text-amber-400 font-mono">
                      {permanentPrice.toLocaleString('fa-IR')}{' '}
                      <span className="text-xs text-slate-400 font-normal">تومان</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>۹۰ گیگ اینترنت هدیه + ۹۰۰ دقیقه مکالمه</span>
                </span>
                <span className="text-slate-500 text-[11px]">فعال‌سازی آنی</span>
              </div>
            </div>

            {/* Preview: Credit SIM */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-cyan-500 to-cyan-300"></div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      سیم‌کارت اعتباری
                    </span>
                    <span className="text-xs text-slate-400">اپراتور ایرانسل</span>
                  </div>
                  <div className="mt-2 text-lg font-black text-white font-mono" dir="ltr">
                    0935 789 4512
                  </div>
                </div>

                <div className="text-left">
                  {hasCreditSale && creditDiscount > 0 ? (
                    <div>
                      <div className="text-xs text-slate-500 line-through font-mono">
                        {creditPrice.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-xl font-black text-cyan-400 font-mono">
                        {creditSalePrice.toLocaleString('fa-IR')}{' '}
                        <span className="text-xs text-slate-400 font-normal">تومان</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xl font-black text-cyan-400 font-mono">
                      {creditPrice.toLocaleString('fa-IR')}{' '}
                      <span className="text-xs text-slate-400 font-normal">تومان</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>۴۵ گیگ اینترنت هدیه + ۵۰۰ دقیقه مکالمه</span>
                </span>
                <span className="text-slate-500 text-[11px]">فعال‌سازی آنی</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
