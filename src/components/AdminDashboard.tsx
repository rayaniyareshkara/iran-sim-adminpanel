import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Lock,
  LogOut,
  Plus,
  Search,
  Server,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  apiFetch,
  formatFileSize,
  formatPersianDate,
  setStoredToken,
  slugifyPersian,
  uploadImageFile,
} from '../lib/api';
import {
  NGINX_RAYANIK_CONFIG,
  NUXT_BLOG_INDEX_CODE,
  NUXT_BLOG_SLUG_CODE,
  SERVER_SETUP_COMMANDS,
} from '../lib/deploySnippets';
import type { AdminStats, AuthUser, Category, MediaFile, Post } from '../types/blog';
import { MediaPickerModal } from './MediaPickerModal';
import { RichArticleEditor } from './RichArticleEditor';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

type AdminTab = 'posts' | 'editor' | 'categories' | 'media' | 'deploy' | 'settings';

interface EditorFormState {
  id: number | null;
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
}

function emptyEditorForm(defaultAuthor = 'تیم تحریریه رایا‌نیک'): EditorFormState {
  return {
    id: null,
    title: '',
    slug: '',
    excerpt: '',
    content_html: '<p>محتوای مقاله خود را اینجا بنویسید...</p>',
    featured_image: '',
    category_id: null,
    tags: '',
    author_name: defaultAuthor,
    status: 'published',
    meta_title: '',
    meta_description: '',
  };
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login State
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Workspace Navigation
  const [activeTab, setActiveTab] = useState<AdminTab>('posts');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Data State
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Editor State
  const [form, setForm] = useState<EditorFormState>(emptyEditorForm());
  const [slugTouched, setSlugTouched] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [featuredModalOpen, setFeaturedModalOpen] = useState(false);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCatId, setEditingCatId] = useState<number | null>(null);

  // Media Upload State
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Settings State
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // Enforce <meta name="robots" content="noindex, nofollow"> on /admin
  useEffect(() => {
    document.title = 'پنل مدیریت وبلاگ رایا‌نیک';
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
  }, []);

  useEffect(() => {
    apiFetch<{ user: AuthUser }>('/api/auth/me')
      .then((res) => {
        setUser(res.user);
        setDisplayNameInput(res.user.display_name);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  async function refreshDashboardData() {
    setLoadingPosts(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter > 0) params.set('category_id', String(categoryFilter));
      if (searchQuery.trim()) params.set('q', searchQuery.trim());

      const [statsRes, postsRes, catsRes, mediaRes] = await Promise.all([
        apiFetch<AdminStats>('/api/admin/stats'),
        apiFetch<{ posts: Post[] }>(`/api/admin/posts?${params.toString()}`),
        apiFetch<{ categories: Category[] }>('/api/admin/categories'),
        apiFetch<{ files: MediaFile[] }>('/api/admin/media'),
      ]);
      setStats(statsRes);
      setPosts(postsRes.posts || []);
      setCategories(catsRes.categories || []);
      setMediaFiles(mediaRes.files || []);
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در دریافت اطلاعات.');
    } finally {
      setLoadingPosts(false);
    }
  }

  useEffect(() => {
    if (user) {
      refreshDashboardData();
    }
  }, [user, statusFilter, categoryFilter, searchQuery]);

  function showNotice(type: 'success' | 'error', text: string) {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 5000);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await apiFetch<{ user: AuthUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: loginUser, password: loginPass }),
      });
      setStoredToken(res.token);
      setUser(res.user);
      setDisplayNameInput(res.user.display_name);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'ورود ناموفق بود.');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setStoredToken(null);
    setUser(null);
  }

  function startNewPost() {
    setForm(emptyEditorForm(user?.display_name || 'تیم تحریریه رایا‌نیک'));
    setSlugTouched(false);
    setActiveTab('editor');
  }

  async function startEditPost(postId: number) {
    try {
      const res = await apiFetch<{ post: Post }>(`/api/admin/posts/${postId}`);
      const p = res.post;
      setForm({
        id: p.id,
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt || '',
        content_html: p.content_html || '',
        featured_image: p.featured_image || '',
        category_id: p.category_id,
        tags: p.tags || '',
        author_name: p.author_name || 'تیم تحریریه رایا‌نیک',
        status: p.status,
        meta_title: p.meta_title || '',
        meta_description: p.meta_description || '',
      });
      setSlugTouched(true);
      setActiveTab('editor');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در باز کردن نوشته.');
    }
  }

  async function handleSavePost(targetStatus?: 'draft' | 'published') {
    if (!form.title.trim()) {
      showNotice('error', 'عنوان مقاله را وارد کنید.');
      return;
    }
    setSavingPost(true);
    const payload = {
      ...form,
      status: targetStatus || form.status,
      slug: form.slug.trim() || slugifyPersian(form.title),
    };
    try {
      if (form.id) {
        const res = await apiFetch<{ post: Post }>(`/api/admin/posts/${form.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setForm((prev) => ({ ...prev, id: res.post.id, slug: res.post.slug, status: res.post.status }));
        showNotice('success', 'تغییرات مقاله با موفقیت ذخیره شد.');
      } else {
        const res = await apiFetch<{ post: Post }>('/api/admin/posts', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setForm((prev) => ({ ...prev, id: res.post.id, slug: res.post.slug, status: res.post.status }));
        setSlugTouched(true);
        showNotice('success', 'مقاله جدید با موفقیت ایجاد شد.');
      }
      await refreshDashboardData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در ذخیره مقاله.');
    } finally {
      setSavingPost(false);
    }
  }

  async function handleDeletePost(id: number, title: string) {
    if (!window.confirm(`آیا از حذف نوشته «${title}» مطمئن هستید؟`)) return;
    try {
      await apiFetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      showNotice('success', 'نوشته حذف شد.');
      await refreshDashboardData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در حذف نوشته.');
    }
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      if (editingCatId) {
        await apiFetch(`/api/admin/categories/${editingCatId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: newCatName, slug: newCatSlug, description: newCatDesc }),
        });
        showNotice('success', 'دسته‌بندی ویرایش شد.');
      } else {
        await apiFetch('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify({ name: newCatName, slug: newCatSlug, description: newCatDesc }),
        });
        showNotice('success', 'دسته‌بندی جدید اضافه شد.');
      }
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setEditingCatId(null);
      await refreshDashboardData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در ذخیره دسته‌بندی.');
    }
  }

  async function handleDeleteCategory(id: number, name: string) {
    if (!window.confirm(`دسته‌بندی «${name}» حذف شود؟`)) return;
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      showNotice('success', 'دسته‌بندی حذف شد.');
      await refreshDashboardData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در حذف دسته‌بندی.');
    }
  }

  async function handleDirectMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    try {
      await uploadImageFile(file);
      showNotice('success', 'تصویر با موفقیت آپلود شد.');
      await refreshDashboardData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در آپلود تصویر.');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  }

  async function handleDeleteMedia(url: string) {
    if (!window.confirm('آیا این فایل تصویر حذف شود؟')) return;
    try {
      await apiFetch('/api/admin/media', { method: 'DELETE', body: JSON.stringify({ url }) });
      showNotice('success', 'فایل حذف شد.');
      await refreshDashboardData();
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در حذف فایل.');
    }
  }

  async function handleUpdateSettings(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await apiFetch<{ user: AuthUser }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          displayName: displayNameInput,
          currentPassword: currentPassInput || undefined,
          newPassword: newPassInput || undefined,
        }),
      });
      setUser(res.user);
      setCurrentPassInput('');
      setNewPassInput('');
      showNotice('success', 'تنظیمات حساب مدیریت به‌روزرسانی شد.');
    } catch (err) {
      showNotice('error', err instanceof Error ? err.message : 'خطا در ذخیره تنظیمات.');
    }
  }

  function copySnippet(key: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(''), 2000);
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm">
        در حال بررسی نشست کاربری...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <Shield className="w-4 h-4 text-[#6E45E9]" />
              <span>محیط مدیریت غیرقابل ایندکس (noindex)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">ورود به پنل وبلاگ رایا‌نیک</h1>
            <p className="text-xs text-slate-500 mt-1">
              برای ایجاد و ویرایش مقالات، تصاویر و دکمه‌های سایت وارد شوید.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">نام کاربری</label>
              <input
                type="text"
                required
                dir="ltr"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono-ltr focus:outline-none focus:border-[#6E45E9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">رمز عبور</label>
              <div className="relative">
                <input
                  type={showLoginPass ? 'text' : 'password'}
                  required
                  dir="ltr"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pl-10 rounded-lg border border-slate-300 text-sm font-mono-ltr focus:outline-none focus:border-[#6E45E9]"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass((v) => !v)}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  aria-label={showLoginPass ? 'مخفی کردن رمز' : 'نمایش رمز'}
                >
                  {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-2.5 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold hover:bg-[#5c36d1] transition-colors disabled:opacity-50"
            >
              {loggingIn ? 'در حال ورود...' : 'ورود به پیشخوان'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2.5 text-xs text-slate-500">
            <div className="flex items-center justify-between gap-2">
              <span>نام کاربری اولیه:</span>
              <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono-ltr select-all" dir="ltr">
                admin
              </code>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>رمز عبور اولیه:</span>
              <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono-ltr select-all" dir="ltr">
                Rayanik@2026
              </code>
            </div>
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setLoginUser('admin');
                  setLoginPass('Rayanik@2026');
                  setLoginError('');
                }}
                className="text-slate-600 hover:text-slate-900 underline"
              >
                پر کردن خودکار اطلاعات اولیه
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/blog')}
                className="text-[#6E45E9] font-semibold hover:underline"
              >
                مشاهده وبلاگ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-l border-slate-200 bg-white hidden lg:flex flex-col justify-between">
        <div>
          <div className="h-16 px-5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-base font-extrabold text-slate-900">پنل وبلاگ رایا‌نیک</span>
            <span className="text-[11px] text-slate-400 font-mono-ltr">/admin</span>
          </div>

          <nav className="p-3 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'bg-[#6E45E9]/10 text-[#6E45E9]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              همه نوشته‌ها
            </button>

            <button
              type="button"
              onClick={startNewPost}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'editor'
                  ? 'bg-[#6E45E9]/10 text-[#6E45E9]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              افزودن نوشته جدید
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-[#6E45E9]/10 text-[#6E45E9]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              دسته‌بندی‌ها
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'media'
                  ? 'bg-[#6E45E9]/10 text-[#6E45E9]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              کتابخانه رسانه
            </button>

            <div className="my-2 border-t border-slate-200" />

            <button
              type="button"
              onClick={() => setActiveTab('deploy')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'deploy'
                  ? 'bg-[#6E45E9]/10 text-[#6E45E9]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Server className="w-4 h-4" />
              نصب روی سرور و Nuxt
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#6E45E9]/10 text-[#6E45E9]'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Lock className="w-4 h-4" />
              تنظیمات امنیتی
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="text-xs text-slate-500">
            وارد شده با: <span className="font-semibold text-slate-800">{user.display_name}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <LogOut className="w-3.5 h-3.5" />
            خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
            <span className="font-semibold text-slate-900 truncate">
              {activeTab === 'posts' && 'مدیریت نوشته‌ها'}
              {activeTab === 'editor' && (form.id ? 'ویرایش نوشته' : 'افزودن نوشته جدید')}
              {activeTab === 'categories' && 'دسته‌بندی‌های وبلاگ'}
              {activeTab === 'media' && 'رسانه و تصاویر آپلودشده'}
              {activeTab === 'deploy' && 'کدهای استقرار روی سرور rayanik.net'}
              {activeTab === 'settings' && 'تنظیمات حساب و رمز عبور'}
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <span className="text-xs text-slate-400 hidden sm:inline">noindex, nofollow فعال</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/blog')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              مشاهده صفحه وبلاگ
            </button>

            {activeTab !== 'editor' && (
              <button
                type="button"
                onClick={startNewPost}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6E45E9] text-white text-xs font-semibold hover:bg-[#5c36d1] whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                نوشته جدید
              </button>
            )}
          </div>
        </header>

        {/* Mobile Nav Bar */}
        <div className="lg:hidden px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto">
          {(
            [
              ['posts', 'نوشته‌ها'],
              ['editor', 'ویرایشگر'],
              ['categories', 'دسته‌ها'],
              ['media', 'رسانه'],
              ['deploy', 'نصب سرور'],
              ['settings', 'امنیت'],
            ] as Array<[AdminTab, string]>
          ).map(([tabId, label]) => (
            <button
              key={tabId}
              type="button"
              onClick={() => (tabId === 'editor' ? startNewPost() : setActiveTab(tabId))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                activeTab === tabId ? 'bg-[#6E45E9] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Toast Notice */}
        {notice && (
          <div className="px-4 md:px-8 pt-4">
            <div
              className={`px-4 py-3 rounded-xl border text-sm font-medium ${
                notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {notice.text}
            </div>
          </div>
        )}

        <main className="p-4 md:p-8 flex-1">
          {/* TAB: POSTS */}
          {activeTab === 'posts' && (
            <div className="space-y-6 max-w-6xl">
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 mb-1">منتشرشده</div>
                    <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {stats.publishedPosts}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 mb-1">پیش‌نویس</div>
                    <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {stats.draftPosts}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 mb-1">کل بازدید مقالات</div>
                    <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {stats.totalViews}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-white">
                    <div className="text-xs text-slate-500 mb-1">تصاویر آپلودشده</div>
                    <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                      {stats.mediaCount}
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-200/70">
                    {(
                      [
                        ['all', 'همه'],
                        ['published', 'منتشرشده'],
                        ['draft', 'پیش‌نویس'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStatusFilter(key)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                          statusFilter === key
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-700"
                  >
                    <option value={0}>همه دسته‌بندی‌ها</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در نوشته‌ها..."
                    className="w-full pr-9 pl-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#6E45E9]"
                  />
                </div>
              </div>

              {/* Posts Table */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {loadingPosts ? (
                  <div className="p-8 text-center text-sm text-slate-500">در حال بارگذاری...</div>
                ) : posts.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-slate-600 mb-4">هنوز نوشته‌ای با این مشخصات ثبت نشده است.</p>
                    <button
                      type="button"
                      onClick={startNewPost}
                      className="px-4 py-2 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold"
                    >
                      ایجاد اولین مقاله
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                          <th className="py-3 px-4">عنوان و آدرس</th>
                          <th className="py-3 px-4">دسته‌بندی</th>
                          <th className="py-3 px-4">وضعیت</th>
                          <th className="py-3 px-4">بازدید</th>
                          <th className="py-3 px-4">تاریخ</th>
                          <th className="py-3 px-4 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-sm">
                        {posts.map((post) => (
                          <tr key={post.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900 mb-0.5">{post.title}</div>
                              <div className="text-xs text-slate-400 font-mono-ltr" dir="ltr">
                                /blog/{post.slug}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600">
                              {post.category_name || 'بدون دسته'}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold">
                              {post.status === 'published' ? (
                                <span className="text-emerald-700">منتشرشده</span>
                              ) : (
                                <span className="text-amber-700">پیش‌نویس</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums">
                              {post.views}
                            </td>
                            <td className="py-3.5 px-4 text-xs text-slate-600 tabular-nums whitespace-nowrap">
                              {formatPersianDate(post.published_at || post.updated_at)}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-end gap-2">
                                {post.status === 'published' && (
                                  <button
                                    type="button"
                                    onClick={() => onNavigate(`/blog/${encodeURIComponent(post.slug)}`)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-[#6E45E9]"
                                    title="مشاهده مقاله در سایت"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => startEditPost(post.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                  title="ویرایش"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id, post.title)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: WORDPRESS-LIKE EDITOR */}
          {activeTab === 'editor' && (
            <div className="max-w-7xl grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Main Editor Column */}
              <div className="xl:col-span-8 space-y-5">
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      عنوان مقاله (H1 صفحه)
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((prev) => ({
                          ...prev,
                          title: val,
                          slug: slugTouched ? prev.slug : slugifyPersian(val),
                        }));
                      }}
                      placeholder="تیتر جذاب مقاله را بنویسید..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:border-[#6E45E9]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      نامک / آدرس یکتا (Slug در آدرس مقاله)
                    </label>
                    <div className="flex items-center rounded-lg border border-slate-300 bg-slate-50 overflow-hidden" dir="ltr">
                      <span className="px-3 py-2 text-xs text-slate-500 bg-slate-100 border-r border-slate-300 font-mono-ltr">
                        https://rayanik.net/blog/
                      </span>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setForm((prev) => ({ ...prev, slug: e.target.value }));
                        }}
                        placeholder="article-slug"
                        className="flex-1 px-3 py-2 text-sm bg-white font-mono-ltr focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Rich Text Editor with Image & Button Insertion */}
                <RichArticleEditor
                  value={form.content_html}
                  onChange={(html) => setForm((prev) => ({ ...prev, content_html: html }))}
                />

                {/* Excerpt */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    خلاصه مقاله (نمایش در کارت‌های صفحه وبلاگ)
                  </label>
                  <textarea
                    rows={3}
                    value={form.excerpt}
                    onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="چکیده ۲ تا ۳ خطی از موضوع مقاله..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#6E45E9]"
                  />
                </div>
              </div>

              {/* WordPress-Style Settings Sidebar */}
              <div className="xl:col-span-4 space-y-5">
                {/* Publish Box */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-200">
                    انتشار و وضعیت
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">وضعیت</label>
                    <select
                      value={form.status}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, status: e.target.value as 'draft' | 'published' }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#6E45E9]"
                    >
                      <option value="published">منتشرشده (نمایش در سایت)</option>
                      <option value="draft">پیش‌نویس (مخفی از کاربران)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={savingPost}
                      onClick={() => handleSavePost('draft')}
                      className="flex-1 py-2.5 px-3 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      ذخیره پیش‌نویس
                    </button>
                    <button
                      type="button"
                      disabled={savingPost}
                      onClick={() => handleSavePost('published')}
                      className="flex-1 py-2.5 px-3 rounded-lg bg-[#6E45E9] text-white text-xs font-semibold hover:bg-[#5c36d1] disabled:opacity-50"
                    >
                      {savingPost ? 'در حال ذخیره...' : form.id ? 'به‌روزرسانی و انتشار' : 'انتشار مقاله'}
                    </button>
                  </div>

                  {form.id && form.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => onNavigate(`/blog/${encodeURIComponent(form.slug)}`)}
                      className="w-full py-2 rounded-lg bg-slate-100 text-xs font-semibold text-slate-800 hover:bg-slate-200 inline-flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      باز کردن صفحه مقاله
                    </button>
                  )}
                </div>

                {/* Featured Image */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">
                    تصویر شاخص مقاله
                  </h3>
                  {form.featured_image ? (
                    <div className="space-y-2">
                      <img
                        src={form.featured_image}
                        alt="تصویر شاخص"
                        referrerPolicy="no-referrer"
                        className="w-full aspect-video object-cover rounded-lg border border-slate-200"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setFeaturedModalOpen(true)}
                          className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          تغییر تصویر
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, featured_image: '' }))}
                          className="py-2 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFeaturedModalOpen(true)}
                      className="w-full py-8 rounded-xl border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-600 hover:border-[#6E45E9] hover:text-[#6E45E9] flex flex-col items-center gap-2"
                    >
                      <ImageIcon className="w-6 h-6" />
                      انتخاب یا آپلود تصویر شاخص
                    </button>
                  )}
                </div>

                {/* Category & Metadata */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">
                    دسته‌بندی و اطلاعات
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">دسته‌بندی</label>
                    <select
                      value={form.category_id ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category_id: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
                    >
                      <option value="">بدون دسته‌بندی</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      برچسب‌ها (با کاما جدا کنید)
                    </label>
                    <input
                      type="text"
                      value={form.tags}
                      onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                      placeholder="طراحی سایت, سئو, فروشگاه اینترنتی"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">نام نویسنده</label>
                    <input
                      type="text"
                      value={form.author_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, author_name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>

                {/* SEO Settings */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-200">
                    تنظیمات سئو (SEO)
                  </h3>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      عنوان سئو (Meta Title)
                    </label>
                    <input
                      type="text"
                      value={form.meta_title}
                      onChange={(e) => setForm((prev) => ({ ...prev, meta_title: e.target.value }))}
                      placeholder={form.title || 'عنوان نمایشی در گوگل'}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      توضیحات متا (Meta Description)
                    </label>
                    <textarea
                      rows={3}
                      value={form.meta_description}
                      onChange={(e) => setForm((prev) => ({ ...prev, meta_description: e.target.value }))}
                      placeholder="توضیح کوتاه و جذاب برای نتایج گوگل..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[11px] text-emerald-700 font-mono-ltr truncate" dir="ltr">
                      https://rayanik.net/blog/{form.slug || 'post-slug'}
                    </div>
                    <div className="text-sm font-semibold text-blue-700 truncate">
                      {form.meta_title || form.title || 'عنوان مقاله در گوگل'}
                    </div>
                    <div className="text-xs text-slate-600 line-clamp-2">
                      {form.meta_description || form.excerpt || 'توضیحات متا مقاله اینجا نمایش داده می‌شود.'}
                    </div>
                  </div>
                </div>
              </div>

              <MediaPickerModal
                isOpen={featuredModalOpen}
                mode="featured"
                onClose={() => setFeaturedModalOpen(false)}
                onSelect={(payload) => setForm((prev) => ({ ...prev, featured_image: payload.url }))}
              />
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleSaveCategory}
                className="md:col-span-5 p-5 rounded-xl border border-slate-200 bg-white space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-900">
                  {editingCatId ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نام دسته‌بندی</label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      if (!editingCatId) setNewCatSlug(slugifyPersian(e.target.value));
                    }}
                    placeholder="مثلاً: هوش مصنوعی"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">نامک (Slug)</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    placeholder="ai-articles"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono-ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">توضیحات</label>
                  <textarea
                    rows={2}
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#6E45E9] text-white text-xs font-semibold hover:bg-[#5c36d1]"
                  >
                    {editingCatId ? 'ذخیره تغییرات' : 'افزودن دسته‌بندی'}
                  </button>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(null);
                        setNewCatName('');
                        setNewCatSlug('');
                        setNewCatDesc('');
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-xs text-slate-700"
                    >
                      انصراف
                    </button>
                  )}
                </div>
              </form>

              <div className="md:col-span-7 rounded-xl border border-slate-200 bg-white overflow-hidden">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">نام</th>
                      <th className="py-3 px-4">اسلاگ</th>
                      <th className="py-3 px-4">تعداد نوشته</th>
                      <th className="py-3 px-4 text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {categories.map((cat) => (
                      <tr key={cat.id}>
                        <td className="py-3 px-4 font-semibold text-slate-900">{cat.name}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-mono-ltr" dir="ltr">
                          {cat.slug}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 tabular-nums">
                          {cat.post_count ?? 0}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setNewCatName(cat.name);
                                setNewCatSlug(cat.slug);
                                setNewCatDesc(cat.description);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <div className="max-w-6xl space-y-5">
              <div className="p-5 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">کتابخانه تصاویر و فایل‌ها</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تصاویر آپلودشده در پوشه uploads ذخیره می‌شوند و در مقالات قابل استفاده هستند.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#6E45E9] text-white text-xs font-semibold cursor-pointer hover:bg-[#5c36d1]">
                  <Upload className="w-4 h-4" />
                  {uploadingMedia ? 'در حال آپلود...' : 'آپلود تصویر جدید'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleDirectMediaUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaFiles.map((file) => (
                  <div
                    key={file.url}
                    className="rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col"
                  >
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img
                        src={file.url}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-800 truncate" dir="ltr">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-400 tabular-nums">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => copySnippet(file.url, file.url)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#6E45E9]"
                        >
                          {copiedKey === file.url ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              کپی شد
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              کپی لینک
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMedia(file.url)}
                          className="p-1 rounded text-slate-400 hover:text-red-600"
                          title="حذف تصویر"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SERVER & NUXT DEPLOYMENT */}
          {activeTab === 'deploy' && (
            <div className="max-w-5xl space-y-6">
              <div className="p-5 rounded-xl border border-slate-200 bg-white">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  راهنمای اتصال کامل به سرور Ubuntu (`87.107.165.253`) و Nuxt 3
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  کدهای زیر دقیقاً مطابق ساختار `/var/www/rayanik` (دارای تم تیره `#110a14`، بنفش `#6E45E9` و فیروزه‌ای `#86defe`) و Nginx سرور شما آماده شده‌اند و هدر `X-Robots-Tag: noindex, nofollow` روی `/admin` و `/api` اعمال شده است.
                </p>
              </div>

              {(
                [
                  ['setup', '۱. دستورات نصب Node 22، PM2 و اجرای بک‌اند روی سرور', SERVER_SETUP_COMMANDS],
                  ['nginx', '۲. فایل کانفیگ Nginx (/etc/nginx/sites-available/rayanik.net)', NGINX_RAYANIK_CONFIG],
                  ['nuxt-index', '۳. صفحه لیست وبلاگ در Nuxt (/var/www/rayanik/pages/blog/index.vue)', NUXT_BLOG_INDEX_CODE],
                  ['nuxt-slug', '۴. صفحه نمایش مقاله در Nuxt (/var/www/rayanik/pages/blog/[slug].vue)', NUXT_BLOG_SLUG_CODE],
                ] as const
              ).map(([key, title, code]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
                    <span className="text-sm font-bold text-slate-800">{title}</span>
                    <button
                      type="button"
                      onClick={() => copySnippet(key, code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
                    >
                      {copiedKey === key ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          کپی شد
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          کپی کد
                        </>
                      )}
                    </button>
                  </div>
                  <pre
                    dir="ltr"
                    className="p-4 text-xs font-mono-ltr bg-slate-950 text-slate-200 overflow-x-auto leading-relaxed max-h-80"
                  >
                    {code}
                  </pre>
                </div>
              ))}
            </div>
          )}

          {/* TAB: SECURITY SETTINGS */}
          {activeTab === 'settings' && (
            <form
              onSubmit={handleUpdateSettings}
              className="max-w-lg p-6 rounded-xl border border-slate-200 bg-white space-y-4"
            >
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200">
                تنظیمات حساب مدیر و تغییر رمز عبور
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">نام نمایشی نویسنده</label>
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رمز عبور فعلی</label>
                <input
                  type="password"
                  dir="ltr"
                  value={currentPassInput}
                  onChange={(e) => setCurrentPassInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono-ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">رمز عبور جدید (حداقل ۶ کاراکتر)</label>
                <input
                  type="password"
                  dir="ltr"
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono-ltr"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold hover:bg-[#5c36d1]"
              >
                ذخیره تنظیمات
              </button>
            </form>
          )}
        </main>
      </div>
    </div>
  );
};
