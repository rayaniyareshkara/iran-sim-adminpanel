/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouterProvider, useRouter } from './router';
import { AdminOrdersListView } from './views/admin/AdminOrdersListView';
import { AdminOrderDetailView } from './views/admin/AdminOrderDetailView';
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminGenericView } from './views/admin/AdminGenericView';

const AppContent: React.FC = () => {
  const { path } = useRouter();

  // Admin Routes (this project only ever serves the management panel)
  if (path.startsWith('/admin/orders/') && path !== '/admin/orders') {
    return <AdminOrderDetailView />;
  }

  if (path === '/admin/orders') {
    return <AdminOrdersListView />;
  }

  if (path === '/admin/pricing') {
    return (
      <AdminGenericView
        title="مدیریت قیمت‌ها"
        subtitle="تعرفه سیم‌کارت و خدمات"
        description="تنظیم قیمت پایه و فروش سیم‌کارت، کارمزد خدمات و تخفیف‌های پیش‌فرض"
      />
    );
  }

  if (path === '/admin/packages') {
    return (
      <AdminGenericView
        title="بسته‌های اینترنت"
        subtitle="مدیریت بسته‌های افزایشی"
        description="تنظیم حجم، مدت اعتبار و تعرفه بسته‌های اینترنت همراه"
      />
    );
  }

  if (path === '/admin/shipping') {
    return (
      <AdminGenericView
        title="روش‌های ارسال"
        subtitle="پیک و پست پیشتاز"
        description="تنظیم هزینه ارسال، تحویل اکسپرس و شیوه پس‌کرایه"
      />
    );
  }

  if (path === '/admin/discounts') {
    return (
      <AdminGenericView
        title="کدهای تخفیف"
        subtitle="کوپن‌ها و جشنواره‌ها"
        description="ایجاد و نظارت بر کدهای تخفیف فعال"
      />
    );
  }

  if (path === '/admin/settings') {
    return (
      <AdminGenericView
        title="تنظیمات فروشگاه"
        subtitle="مشخصات نمایندگی رسمی"
        description="ویرایش نام نمایندگی، تلفن‌های پشتیبانی و ساعت کاری"
      />
    );
  }

  if (path === '/admin/content') {
    return (
      <AdminGenericView
        title="مدیریت محتوا"
        subtitle="قوانین، آدرس و تماس"
        description="تنظیم متن قوانین خرید، سوالات متداول و اطلاعات تماس"
      />
    );
  }

  if (path === '/admin/users') {
    return (
      <AdminGenericView
        title="کاربران پنل"
        subtitle="مدیران و اپراتورها"
        description="مدیریت سطوح دسترسی و همکاران پنل مدیریت"
      />
    );
  }

  if (path === '/admin/reports') {
    return (
      <AdminGenericView
        title="گزارش‌ها و آمار"
        subtitle="آمار تفکیکی فروش"
        description="نمودار روند فروش، سفارش‌های موفق و گزارش مالی"
      />
    );
  }

  // Default: dashboard (covers '/', '/admin', and any unknown admin path)
  return <AdminDashboardView />;
};

export default function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}
