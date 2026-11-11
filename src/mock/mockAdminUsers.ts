/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AdminUser } from '../types';

export const initialAdminUsers: AdminUser[] = [
  {
    id: 'user-1',
    username: 'owner',
    fullName: 'مالک و مدیریت ایران‌سیم',
    mobile: '09365694219',
    email: 'owner@iransiim.ir',
    role: 'Owner',
    isActive: true,
    lastLogin: '۱۴۰۴/۱۲/۱۶ ۱۰:۳۰',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'user-2',
    username: 'operator',
    fullName: 'سارا رضایی (اپراتور سفارشات)',
    mobile: '09123456789',
    email: 'operator@iransiim.ir',
    role: 'Operator',
    isActive: true,
    lastLogin: '۱۴۰۴/۱۲/۱۶ ۰۹:۱۵',
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'user-3',
    username: 'support',
    fullName: 'امیرحسین عباسی (پشتیبانی)',
    mobile: '09359876543',
    email: 'support@iransiim.ir',
    role: 'Operator',
    isActive: true,
    lastLogin: '۱۴۰۴/۱۲/۱۵ ۱۸:۴۵',
    createdAt: '2024-06-15T11:30:00Z',
  },
];
