/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// STORE & CUSTOMER TYPES
// ==========================================

export interface AvailableNumber {
  id: string;
  phoneNumber: string; // e.g. 09002841435
  formattedNumber: string; // e.g. 0900 284 1435
  type: 'permanent' | 'credit'; // دائمی یا اعتباری
  price: number; // قیمت سیمکارت به تومان
  category: 'golden' | 'silver' | 'bronze' | 'normal';
  hasFreeCallGift: boolean;
  freeCallMinutes: number; // e.g. 900 دقیقه
  hasFreeInternetGift: boolean;
  freeInternetGb: number; // e.g. 90 گیگابایت
  operator: string; // ایرانسل
  isAvailable: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  mobileNumber: string;
  fatherName: string;
  nationalId: string;
  secondaryMobile?: string;
  province?: string;
  city?: string;
  fullAddress: string;
  postalCode?: string;
  buildingNumber?: string; // پلاک
  unit?: string;
}

export type PaymentMethod = 'online' | 'card_to_card' | 'wallet';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type OrderStatus =
  | 'created'
  | 'payment_confirmed'
  | 'processing'
  | 'packaging'
  | 'shipping'
  | 'delivered'
  | 'cancelled';

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId?: string;
  refNumber?: string;
  paidAt?: string;
  gatewayName?: string;
}

export interface OrderItem {
  numberId: string;
  phoneNumber: string;
  formattedNumber: string;
  type: 'permanent' | 'credit';
  price: number;
  category?: 'golden' | 'silver' | 'bronze' | 'normal' | string;
  packageTitle?: string;
  giftInternetGb: number;
  giftCallMinutes: number;
  operator?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  title: string;
  description?: string;
  timestamp: string;
  isCompleted: boolean;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. IRN-98421
  trackingCode: string; // e.g. TRK-481920
  customer: Customer;
  item: OrderItem;
  basePrice: number;
  serviceFee: number;
  shippingPrice: number;
  shippingMethodTitle: string;
  discountAmount: number;
  discountCode?: string;
  totalPrice: number;
  payment: PaymentInfo;
  orderStatus: OrderStatus;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

// ==========================================
// INTERNET PACKAGES
// ==========================================

export type PackageValidity = 'daily' | 'weekly' | 'monthly' | '3months' | '6months' | 'yearly';

export interface InternetPackage {
  id: string;
  title: string; // e.g. "بسته ۳۰ گیگابایت یک‌ماهه"
  volume: number; // e.g. 30
  volumeUnit: 'MB' | 'GB'; // e.g. "GB"
  validityDays: number; // e.g. 30
  validityLabel: string; // e.g. "یک ماهه"
  price: number; // قیمت به تومان
  discountPrice?: number;
  description: string;
  isActive: boolean;
  isPopular?: boolean;
  features?: string[];
  createdAt: string;
}

// ==========================================
// PRICING CONFIGURATION
// ==========================================

export interface PricingConfig {
  id: string;
  baseSimPrice: number; // قیمت پایه سیمکارت
  saleSimPrice: number; // قیمت فروش سیمکارت
  activationFee: number; // هزینه فعال‌سازی (معمولا 0 یا رایگان)
  serviceFee: number; // هزینه خدمات و ارزش افزوده
  defaultDiscountPercent: number; // درصد تخفیف پیش‌فرض
  isServiceFeeActive: boolean;
  isActivationFree: boolean;
  shippingIncluded: boolean;
  updatedAt: string;
}

// ==========================================
// SHIPPING MANAGEMENT
// ==========================================

export interface ShippingMethod {
  id: string;
  title: string; // e.g. "پست پیشتاز سراسری", "ارسال با پیک اکسپرس"
  description: string;
  price: number; // 0 for free/pay-on-delivery
  isPayOnDelivery: boolean; // پس‌کرایه
  estimatedDays: string; // e.g. "۲ تا ۴ روز کاری"
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// DISCOUNT CODES
// ==========================================

export type DiscountType = 'percentage' | 'fixed_amount';

export interface Discount {
  id: string;
  code: string; // e.g. "NOROOZ1404"
  type: DiscountType;
  amount: number; // 20 (%) or 50000 (Toman)
  minOrderAmount: number; // حداقل مبلغ سفارش
  maxUsageCount: number; // سقف کل استفاده
  currentUsageCount: number; // تعداد استفاده شده تاکنون
  startDate: string;
  endDate: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
}

// ==========================================
// STORE SETTINGS & CONTACT
// ==========================================

export interface StoreSettings {
  storeName: string; // "نمایندگی رسمی ایرانسل - خسروییکی"
  storeCode: string; // "۹۳۶۵۶۹۴۲۱۹"
  officialOwner: string; // "خسروییکی"
  supportPhone: string; // "۰۲۱۶۵۱۹۶۰۵۱"
  supportMobile: string; // "۰۹۳۶۵۶۹۴۲۱۹"
  address: string; // "کرج، فردیس، خیابان اصلی، نبش خیابان نهم، نمایندگی ایرانسل"
  workingHours: string; // "شنبه تا پنجشنبه ۹:۰۰ الی ۲۱:۰۰"
  isStoreOnline: boolean;
  deliveryGuaranteeText: string; // "تحویل: تا ۲ تا ۳ روز کاری"
  authenticityGuaranteeText: string; // "ضمانت اصالت ۱۰۰٪ خطوط و نمایندگی رسمی"
  paymentNotice: string; // "در صورت عدم موفقیت در پرداخت از طریق درگاه با شماره های پشتیبانی ما تماس بگیرید"
}

// ==========================================
// CONTENT MANAGEMENT
// ==========================================

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface StoreContent {
  aboutUs: string;
  rules: string;
  faqList: FaqItem[];
  contactUs: {
    address: string;
    phone: string;
    mobile: string;
    email: string;
    postalCode: string;
    googleMapsUrl?: string;
  };
}

// ==========================================
// ADMIN USERS
// ==========================================

export type AdminRole = 'Admin' | 'Manager' | 'Support';

export interface AdminUser {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin: string;
  avatarUrl?: string;
  createdAt: string;
}

// ==========================================
// DASHBOARD & REPORTS
// ==========================================

export interface DashboardMetrics {
  todaySales: number;
  monthSales: number;
  totalSales: number;
  totalOrders: number;
  newOrdersCount: number;
  pendingPaymentCount: number;
  inShippingCount: number;
  deliveredCount: number;
}

export interface SalesChartDataPoint {
  date: string;
  label: string;
  salesAmount: number;
  orderCount: number;
}

export interface OrderStatusDistribution {
  status: OrderStatus;
  statusLabel: string;
  count: number;
  percentage: number;
  color: string;
}

export interface ReportsFilter {
  startDate?: string;
  endDate?: string;
  status?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
}
