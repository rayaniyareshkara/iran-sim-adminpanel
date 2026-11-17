import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
const SAMPLES_UPLOAD_DIR = path.join(UPLOADS_DIR, 'samples');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(SAMPLES_UPLOAD_DIR, { recursive: true });

export const DB_PATH = path.join(DATA_DIR, 'rayablog.db');
export const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export interface DbUser {
  id: number;
  username: string;
  display_name: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface DbCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface DbPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  featured_image: string;
  category_id: number | null;
  tags: string;
  author_name: string;
  status: 'draft' | 'published';
  meta_title: string;
  meta_description: string;
  reading_time: number;
  views: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function copySampleAsset(fileName: string, targetName: string): string {
  const sourcePath = path.resolve(process.cwd(), 'src/assets/images', fileName);
  const destPath = path.join(SAMPLES_UPLOAD_DIR, targetName);
  if (fs.existsSync(sourcePath) && !fs.existsSync(destPath)) {
    fs.copyFileSync(sourcePath, destPath);
  }
  return fs.existsSync(destPath) ? `/uploads/samples/${targetName}` : '';
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content_html TEXT NOT NULL,
      featured_image TEXT NOT NULL DEFAULT '',
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      tags TEXT NOT NULL DEFAULT '',
      author_name TEXT NOT NULL DEFAULT 'تیم تحریریه رایا‌نیک',
      status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      meta_title TEXT NOT NULL DEFAULT '',
      meta_description TEXT NOT NULL DEFAULT '',
      reading_time INTEGER NOT NULL DEFAULT 3,
      views INTEGER NOT NULL DEFAULT 0,
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status_published_at ON posts(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
    CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Rayanik@2026';
    const displayName = process.env.ADMIN_DISPLAY_NAME || 'مدیر رایا‌نیک';
    const hash = bcrypt.hashSync(adminPassword, 10);
    db.prepare(
      'INSERT INTO users (username, display_name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(adminUser, displayName, hash, 'admin', new Date().toISOString());
  }

  const catCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number };
  if (catCount.count === 0) {
    const now = new Date().toISOString();
    const insertCat = db.prepare(
      'INSERT INTO categories (name, slug, description, created_at) VALUES (?, ?, ?, ?)'
    );
    insertCat.run('طراحی سایت', 'web-design', 'اصول معماری وب، رابط کاربری مدرن و سرعت بارگذاری', now);
    insertCat.run('سئو و بهینه‌سازی', 'seo', 'استراتژی‌های سئو تکنیکال، محتوا و رتبه‌بندی گوگل', now);
    insertCat.run('دیجیتال مارکتینگ', 'digital-marketing', 'افزایش نرخ تبدیل و کمپین‌های رشد کسب‌وکار', now);
    insertCat.run('اخبار و راهنماها', 'guides', 'آموزش‌های کاربردی و تازه‌های فناوری', now);
  }

  const postCount = db.prepare('SELECT COUNT(*) AS count FROM posts').get() as { count: number };
  if (postCount.count === 0) {
    const coverWebDesign = copySampleAsset(
      'blog_web_design_cover_1794927891997.jpg',
      'web-design-architecture.jpg'
    );
    const coverSeo = copySampleAsset(
      'blog_seo_strategy_cover_1794927891913.jpg',
      'seo-technical-strategy.jpg'
    );

    const webDesignCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('web-design') as
      | { id: number }
      | undefined;
    const seoCat = db.prepare('SELECT id FROM categories WHERE slug = ?').get('seo') as
      | { id: number }
      | undefined;

    const now = new Date().toISOString();
    const insertPost = db.prepare(`
      INSERT INTO posts (
        title, slug, excerpt, content_html, featured_image, category_id,
        tags, author_name, status, meta_title, meta_description,
        reading_time, views, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertPost.run(
      'اصول طراحی وب‌سایت اختصاصی و سریع برای کسب‌وکارهای مدرن',
      'modern-custom-web-design-principles',
      'چگونه با انتخاب معماری درست در فرانت‌اند و بهینه‌سازی تجربه کاربری، نرخ تبدیل و رتبه سئوی سایت را به شکل چشمگیری افزایش دهیم.',
      `<p>یک وب‌سایت حرفه‌ای تنها ویترین آنلاین برند شما نیست؛ بلکه سریع‌ترین کانال فروش و جذب مشتری در فضای دیجیتال است. انتخاب فناوری مناسب مانند Nuxt و بهینه‌سازی Core Web Vitals تاثیر مستقیمی روی اعتماد کاربران دارد.</p>
<h2>چرا سرعت و معماری تمیز اهمیت دارد؟</h2>
<p>کاربران در کمتر از ۳ ثانیه درباره کیفیت برند شما قضاوت می‌کنند. استفاده از طراحی واکنش‌گرا، فونت‌های خوانای فارسی و ساختار کد سبک باعث می‌شود نرخ پرش به حداقل برسد.</p>
${coverSeo ? `<figure><img src="${coverSeo}" alt="بهینه‌سازی ساختار فنی و سرعت سایت" /><figcaption>ساختار فنی تمیز و سرعت بارگذاری بالا، پایه اصلی رشد ارگانیک است.</figcaption></figure>` : ''}
<ul>
  <li>بهینه‌سازی تصاویر و استفاده از فرمت‌های مدرن</li>
  <li>طراحی مسیر واضح برای دعوت به اقدام (CTA)</li>
  <li>ساختار هدینگ استاندارد برای درک بهتر موتورهای جستجو</li>
</ul>
<div class="raya-btn-wrap" data-align="center"><a class="raya-btn raya-btn--primary" href="https://rayanik.net/design-website" target="_blank" rel="noopener noreferrer">مشاهده تعرفه و سفارش طراحی سایت</a></div>`,
      coverWebDesign,
      webDesignCat?.id ?? null,
      'طراحی سایت, تجربه کاربری, سرعت سایت',
      'تیم تحریریه رایا‌نیک',
      'published',
      'اصول طراحی وب‌سایت اختصاصی و سریع | رایا‌نیک',
      'راهنمای جامع طراحی سایت مدرن، افزایش سرعت بارگذاری و بهبود نرخ تبدیل کسب‌وکارها.',
      4,
      128,
      now,
      now,
      now
    );

    insertPost.run(
      'چک‌لیست سئو تکنیکال برای رتبه‌گیری پایدار در گوگل',
      'technical-seo-checklist-for-growth',
      'مهم‌ترین نکات سئو تکنیکال که پیش از انتشار هر مقاله و صفحه فرود باید بررسی کنید تا بیشترین بازدهی را از گوگل بگیرید.',
      `<p>حتی بهترین محتوای دنیا بدون زیرساخت فنی درست نمی‌تواند جایگاه واقعی خود را در نتایج گوگل پیدا کند. رعایت اصول سئو تکنیکال به ربات‌های جستجو کمک می‌کند ساختار سایت شما را دقیق‌تر درک کنند.</p>
<h2>گام‌های کلیدی سئو تکنیکال</h2>
<p>تنظیم تگ‌های Canonical، ساختار آدرس‌های خوانا (Slug)، متا دیسکریپشن جذاب و استفاده صحیح از تگ‌های noindex در صفحات مدیریتی جزو پایه‌های ضروری هر وب‌سایت است.</p>
<blockquote>بهینه‌سازی فنی یک کار یک‌باره نیست؛ پایش مداوم خطاهای ایندکس و سرعت صفحات، برتری رقابتی شما را حفظ می‌کند.</blockquote>
<div class="raya-btn-wrap" data-align="center"><a class="raya-btn raya-btn--cyan" href="https://rayanik.net/seo-form" target="_blank" rel="noopener noreferrer">درخواست آنالیز رایگان سئو سایت</a></div>`,
      coverSeo,
      seoCat?.id ?? null,
      'سئو تکنیکال, گوگل, بهینه‌سازی',
      'تیم تحریریه رایا‌نیک',
      'published',
      'چک‌لیست سئو تکنیکال | وبلاگ رایا‌نیک',
      'مهم‌ترین اقدامات سئو تکنیکال برای ایندکس صحیح مقالات و افزایش ترافیک ارگانیک.',
      3,
      94,
      now,
      now,
      now
    );
  }
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}
