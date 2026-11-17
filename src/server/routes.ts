import express, { type Request, type Response } from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, getUploadsDir, type DbCategory, type DbPost } from './db.ts';
import {
  changePasswordHandler,
  loginHandler,
  logoutHandler,
  meHandler,
  requireAuth,
} from './auth.ts';

export const apiRouter = express.Router();

// Prevent search engines from indexing API responses
apiRouter.use((_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

export function slugifyPersian(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200d]/g, '-')
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || `post-${Date.now()}`;
}

function ensureUniquePostSlug(desiredSlug: string, excludeId?: number): string {
  let base = slugifyPersian(desiredSlug);
  let candidate = base;
  let counter = 2;
  while (true) {
    const existing = excludeId
      ? (db.prepare('SELECT id FROM posts WHERE slug = ? AND id != ?').get(candidate, excludeId) as
          | { id: number }
          | undefined)
      : (db.prepare('SELECT id FROM posts WHERE slug = ?').get(candidate) as
          | { id: number }
          | undefined);
    if (!existing) return candidate;
    candidate = `${base}-${counter++}`;
  }
}

function ensureUniqueCategorySlug(desiredSlug: string, excludeId?: number): string {
  let base = slugifyPersian(desiredSlug);
  let candidate = base;
  let counter = 2;
  while (true) {
    const existing = excludeId
      ? (db.prepare('SELECT id FROM categories WHERE slug = ? AND id != ?').get(candidate, excludeId) as
          | { id: number }
          | undefined)
      : (db.prepare('SELECT id FROM categories WHERE slug = ?').get(candidate) as
          | { id: number }
          | undefined);
    if (!existing) return candidate;
    candidate = `${base}-${counter++}`;
  }
}

function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').length : 0;
  return Math.max(1, Math.ceil(words / 180));
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dir = path.join(getUploadsDir(), year, month);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const base = path
      .basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 36);
    const unique = crypto.randomBytes(4).toString('hex');
    cb(null, `${base || 'img'}-${Date.now()}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('فرمت فایل مجاز نیست. فقط تصاویر JPG، PNG، WebP، GIF یا SVG مجاز هستند.'));
    }
  },
});

// Health & Auth routes
apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'rayabackend' });
});

apiRouter.post('/auth/login', loginHandler);
apiRouter.post('/auth/logout', logoutHandler);
apiRouter.get('/auth/me', requireAuth, meHandler);
apiRouter.post('/auth/change-password', requireAuth, changePasswordHandler);

// Public Blog Endpoints (used by rayanik.net/blog and rayanik.net/blog/[slug])
apiRouter.get('/categories', (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.*, COUNT(p.id) AS post_count
       FROM categories c
       LEFT JOIN posts p ON p.category_id = c.id AND p.status = 'published'
       GROUP BY c.id
       ORDER BY c.id ASC`
    )
    .all();
  res.json({ categories });
});

apiRouter.get('/posts', (req: Request, res: Response) => {
  const categorySlug = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const offset = (page - 1) * limit;

  const conditions: string[] = ["p.status = 'published'"];
  const params: unknown[] = [];

  if (categorySlug) {
    conditions.push('c.slug = ?');
    params.push(categorySlug);
  }
  if (search) {
    conditions.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.tags LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const totalRow = db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereClause}`
    )
    .get(...params) as { total: number };

  const posts = db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.category_id,
              p.tags, p.author_name, p.status, p.meta_title, p.meta_description,
              p.reading_time, p.views, p.published_at, p.created_at, p.updated_at,
              c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY COALESCE(p.published_at, p.created_at) DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, limit, offset);

  res.json({
    posts,
    pagination: {
      page,
      limit,
      total: totalRow.total,
      totalPages: Math.max(1, Math.ceil(totalRow.total / limit)),
    },
  });
});

apiRouter.get('/posts/:slug', (req: Request, res: Response) => {
  const rawSlug = req.params.slug;
  const slug = decodeURIComponent(rawSlug);
  const post = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.status = 'published'`
    )
    .get(slug) as (DbPost & { category_name?: string; category_slug?: string }) | undefined;

  if (!post) {
    res.status(404).json({ error: 'مقاله مورد نظر یافت نشد.' });
    return;
  }

  db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(post.id);

  const related = db
    .prepare(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.reading_time,
              p.published_at, p.created_at, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.status = 'published' AND p.id != ?
       ORDER BY (CASE WHEN p.category_id = ? THEN 0 ELSE 1 END), COALESCE(p.published_at, p.created_at) DESC
       LIMIT 3`
    )
    .all(post.id, post.category_id);

  res.json({ post: { ...post, views: post.views + 1 }, related });
});

// Protected Admin Endpoints
function listMediaFiles(): Array<{ url: string; name: string; size: number; createdAt: string }> {
  const baseDir = getUploadsDir();
  const items: Array<{ url: string; name: string; size: number; createdAt: string; mtimeMs: number }> = [];

  function walk(dir: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(entry.name)) {
        const stat = fs.statSync(fullPath);
        const rel = path.relative(baseDir, fullPath).split(path.sep).join('/');
        items.push({
          url: `/uploads/${rel}`,
          name: entry.name,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
          mtimeMs: stat.mtimeMs,
        });
      }
    }
  }

  walk(baseDir);
  items.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return items.map(({ mtimeMs: _m, ...rest }) => rest);
}

apiRouter.get('/admin/stats', requireAuth, (_req, res) => {
  const counts = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts,
         COALESCE(SUM(views), 0) AS views
       FROM posts`
    )
    .get() as { total: number; published: number | null; drafts: number | null; views: number };
  const catCount = (db.prepare('SELECT COUNT(*) AS count FROM categories').get() as { count: number })
    .count;
  const mediaCount = listMediaFiles().length;

  res.json({
    totalPosts: counts.total || 0,
    publishedPosts: counts.published || 0,
    draftPosts: counts.drafts || 0,
    totalViews: counts.views || 0,
    categoriesCount: catCount,
    mediaCount,
  });
});

apiRouter.get('/admin/posts', requireAuth, (req: Request, res: Response) => {
  const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
  const search = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const categoryId = req.query.category_id ? Number(req.query.category_id) : 0;

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status === 'published' || status === 'draft') {
    conditions.push('p.status = ?');
    params.push(status);
  }
  if (categoryId > 0) {
    conditions.push('p.category_id = ?');
    params.push(categoryId);
  }
  if (search) {
    conditions.push('(p.title LIKE ? OR p.slug LIKE ? OR p.tags LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const posts = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereClause}
       ORDER BY p.updated_at DESC`
    )
    .all(...params);

  res.json({ posts });
});

apiRouter.get('/admin/posts/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const post = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`
    )
    .get(id);

  if (!post) {
    res.status(404).json({ error: 'نوشته یافت نشد.' });
    return;
  }
  res.json({ post });
});

apiRouter.post('/admin/posts', requireAuth, (req: Request, res: Response) => {
  const body = req.body as Partial<DbPost>;
  const title = (body.title || '').trim();
  const contentHtml = (body.content_html || '').trim();

  if (!title) {
    res.status(400).json({ error: 'عنوان نوشته نمی‌تواند خالی باشد.' });
    return;
  }
  if (!contentHtml) {
    res.status(400).json({ error: 'متن مقاله نمی‌تواند خالی باشد.' });
    return;
  }

  const status: 'draft' | 'published' = body.status === 'published' ? 'published' : 'draft';
  const slug = ensureUniquePostSlug(body.slug?.trim() || title);
  const now = new Date().toISOString();
  const publishedAt = status === 'published' ? body.published_at || now : null;
  const readingTime = estimateReadingTime(contentHtml);
  const categoryId = body.category_id ? Number(body.category_id) : null;

  const info = db
    .prepare(
      `INSERT INTO posts (
        title, slug, excerpt, content_html, featured_image, category_id,
        tags, author_name, status, meta_title, meta_description,
        reading_time, views, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`
    )
    .run(
      title,
      slug,
      (body.excerpt || '').trim(),
      contentHtml,
      (body.featured_image || '').trim(),
      categoryId,
      (body.tags || '').trim(),
      (body.author_name || 'تیم تحریریه رایا‌نیک').trim(),
      status,
      (body.meta_title || '').trim(),
      (body.meta_description || '').trim(),
      readingTime,
      publishedAt,
      now,
      now
    );

  const created = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(info.lastInsertRowid);

  res.status(201).json({ post: created });
});

apiRouter.put('/admin/posts/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as DbPost | undefined;
  if (!existing) {
    res.status(404).json({ error: 'نوشته یافت نشد.' });
    return;
  }

  const body = req.body as Partial<DbPost>;
  const title = (body.title ?? existing.title).trim();
  const contentHtml = (body.content_html ?? existing.content_html).trim();

  if (!title || !contentHtml) {
    res.status(400).json({ error: 'عنوان و متن مقاله الزامی است.' });
    return;
  }

  const status: 'draft' | 'published' =
    body.status === 'published' || body.status === 'draft' ? body.status : existing.status;
  const slug = ensureUniquePostSlug((body.slug ?? existing.slug).trim() || title, id);
  const now = new Date().toISOString();
  const publishedAt =
    status === 'published' ? body.published_at || existing.published_at || now : null;
  const readingTime = estimateReadingTime(contentHtml);
  const categoryId =
    body.category_id === null ? null : body.category_id ? Number(body.category_id) : existing.category_id;

  db.prepare(
    `UPDATE posts SET
       title = ?, slug = ?, excerpt = ?, content_html = ?, featured_image = ?,
       category_id = ?, tags = ?, author_name = ?, status = ?,
       meta_title = ?, meta_description = ?, reading_time = ?,
       published_at = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    title,
    slug,
    (body.excerpt ?? existing.excerpt).trim(),
    contentHtml,
    (body.featured_image ?? existing.featured_image).trim(),
    categoryId,
    (body.tags ?? existing.tags).trim(),
    (body.author_name ?? existing.author_name).trim(),
    status,
    (body.meta_title ?? existing.meta_title).trim(),
    (body.meta_description ?? existing.meta_description).trim(),
    readingTime,
    publishedAt,
    now,
    id
  );

  const updated = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM posts p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?`
    )
    .get(id);

  res.json({ post: updated });
});

apiRouter.delete('/admin/posts/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'نوشته یافت نشد.' });
    return;
  }
  res.json({ ok: true });
});

// Admin Category CRUD
apiRouter.get('/admin/categories', requireAuth, (_req, res) => {
  const categories = db
    .prepare(
      `SELECT c.*, COUNT(p.id) AS post_count
       FROM categories c
       LEFT JOIN posts p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.id ASC`
    )
    .all();
  res.json({ categories });
});

apiRouter.post('/admin/categories', requireAuth, (req: Request, res: Response) => {
  const { name, slug, description } = req.body as Partial<DbCategory>;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'نام دسته‌بندی الزامی است.' });
    return;
  }
  const cleanSlug = ensureUniqueCategorySlug(slug?.trim() || name.trim());
  const now = new Date().toISOString();
  const info = db
    .prepare('INSERT INTO categories (name, slug, description, created_at) VALUES (?, ?, ?, ?)')
    .run(name.trim(), cleanSlug, (description || '').trim(), now);
  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ category: created });
});

apiRouter.put('/admin/categories/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as
    | DbCategory
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'دسته‌بندی یافت نشد.' });
    return;
  }
  const { name, slug, description } = req.body as Partial<DbCategory>;
  const nextName = (name ?? existing.name).trim();
  if (!nextName) {
    res.status(400).json({ error: 'نام دسته‌بندی الزامی است.' });
    return;
  }
  const nextSlug = ensureUniqueCategorySlug((slug ?? existing.slug).trim() || nextName, id);
  db.prepare('UPDATE categories SET name = ?, slug = ?, description = ? WHERE id = ?').run(
    nextName,
    nextSlug,
    (description ?? existing.description).trim(),
    id
  );
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ category: updated });
});

apiRouter.delete('/admin/categories/:id', requireAuth, (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'دسته‌بندی یافت نشد.' });
    return;
  }
  res.json({ ok: true });
});

// Media Upload & Library
apiRouter.post('/admin/upload', requireAuth, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'خطا در آپلود فایل.';
      res.status(400).json({ error: msg });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'فایلی انتخاب نشده است.' });
      return;
    }
    const rel = path.relative(getUploadsDir(), req.file.path).split(path.sep).join('/');
    res.status(201).json({
      url: `/uploads/${rel}`,
      name: req.file.filename,
      size: req.file.size,
    });
  });
});

apiRouter.get('/admin/media', requireAuth, (_req, res) => {
  res.json({ files: listMediaFiles() });
});

apiRouter.delete('/admin/media', requireAuth, (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url || !url.startsWith('/uploads/')) {
    res.status(400).json({ error: 'مسیر فایل نامعتبر است.' });
    return;
  }
  const rel = url.replace(/^\/uploads\//, '');
  const baseDir = getUploadsDir();
  const target = path.resolve(baseDir, rel);
  if (!target.startsWith(baseDir + path.sep)) {
    res.status(403).json({ error: 'دسترسی غیرمجاز.' });
    return;
  }
  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
  }
  res.json({ ok: true });
});
