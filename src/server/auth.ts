import type { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, type DbUser } from './db.ts';

const COOKIE_NAME = 'raya_admin_token';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'rayanik-blog-dev-secret-change-in-production';
}

export interface AuthPayload {
  id: number;
  username: string;
  display_name: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = decodeURIComponent(part.slice(idx + 1).trim());
    cookies[key] = val;
  }
  return cookies;
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[COOKIE_NAME] || null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'لطفاً ابتدا وارد پنل مدیریت شوید.' });
    return;
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'نشست کاربری منقضی شده یا نامعتبر است.' });
  }
}

export function loginHandler(req: Request, res: Response): void {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    res.status(400).json({ error: 'نام کاربری و رمز عبور الزامی است.' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(username.trim()) as
    | DbUser
    | undefined;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است.' });
    return;
  }

  const payload: AuthPayload = {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    role: user.role,
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({ user: payload, token });
}

export function logoutHandler(_req: Request, res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ ok: true });
}

export function meHandler(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'احراز هویت انجام نشده است.' });
    return;
  }
  const freshUser = db
    .prepare('SELECT id, username, display_name, role FROM users WHERE id = ?')
    .get(req.user.id) as AuthPayload | undefined;
  if (!freshUser) {
    res.status(401).json({ error: 'کاربر یافت نشد.' });
    return;
  }
  res.json({ user: freshUser });
}

export function changePasswordHandler(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'احراز هویت انجام نشده است.' });
    return;
  }
  const { currentPassword, newPassword, displayName } = req.body as {
    currentPassword?: string;
    newPassword?: string;
    displayName?: string;
  };

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id) as DbUser | undefined;
  if (!user) {
    res.status(404).json({ error: 'کاربر یافت نشد.' });
    return;
  }

  if (displayName && displayName.trim()) {
    db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(displayName.trim(), user.id);
  }

  if (newPassword) {
    if (!currentPassword || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      res.status(400).json({ error: 'رمز عبور فعلی صحیح نیست.' });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ error: 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد.' });
      return;
    }
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
  }

  const updated = db
    .prepare('SELECT id, username, display_name, role FROM users WHERE id = ?')
    .get(user.id) as AuthPayload;

  res.json({ ok: true, user: updated });
}
