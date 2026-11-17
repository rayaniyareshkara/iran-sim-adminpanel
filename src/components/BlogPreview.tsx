import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Search, Settings2 } from 'lucide-react';
import { apiFetch, formatPersianDate } from '../lib/api';
import type { Category, Post } from '../types/blog';

interface BlogPreviewProps {
  slug?: string;
  onNavigate: (path: string) => void;
}

export const BlogPreview: React.FC<BlogPreviewProps> = ({ slug, onNavigate }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activePost, setActivePost] = useState<Post | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const [readProgress, setReadProgress] = useState(0);

  // Ensure public blog pages are indexable (remove noindex when switching away from /admin)
  useEffect(() => {
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) {
      robotsMeta.remove();
    }
  }, []);

  // Reading depth progress bar for single article
  useEffect(() => {
    if (!slug) {
      setReadProgress(0);
      return;
    }
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - doc.clientHeight;
      if (total <= 0) {
        setReadProgress(0);
        return;
      }
      setReadProgress(Math.min(100, Math.max(0, (window.scrollY / total) * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [slug]);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      setError('');
      apiFetch<{ post: Post; related: Post[] }>(`/api/posts/${encodeURIComponent(slug)}`)
        .then((res) => {
          setActivePost(res.post);
          setRelatedPosts(res.related || []);
          document.title = res.post.meta_title || `${res.post.title} | وبلاگ رایا‌نیک`;
        })
        .catch((err: Error) => {
          setActivePost(null);
          setError(err.message);
        })
        .finally(() => setLoading(false));
      return;
    }

    document.title = 'وبلاگ و مقالات | رایا‌نیک';
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (search.trim()) params.set('q', search.trim());

    Promise.all([
      apiFetch<{ posts: Post[] }>(`/api/posts?${params.toString()}`),
      apiFetch<{ categories: Category[] }>('/api/categories'),
    ])
      .then(([postsRes, catsRes]) => {
        setPosts(postsRes.posts || []);
        setCategories(catsRes.categories || []);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug, selectedCategory, search]);

  const leadPost = !slug && posts.length > 0 ? posts[0] : null;
  const secondaryPosts = !slug && posts.length > 1 ? posts.slice(1) : [];

  return (
    <div className="min-h-screen bg-[#110a14] text-slate-100">
      {slug && (
        <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-white/10">
          <div
            className="h-full bg-[#86defe] transition-transform duration-100 origin-right"
            style={{ width: `${readProgress}%` }}
          />
        </div>
      )}

      {/* 3-Zone Top Bar */}
      <header className="border-b border-white/10 bg-[#110a14]/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="/blog"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/blog');
            }}
            className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
          >
            رایا‌نیک
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a
              href="/blog"
              onClick={(e) => {
                e.preventDefault();
                setSelectedCategory('');
                onNavigate('/blog');
              }}
              className="hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              صفحه وبلاگ
            </a>
            {categories.slice(0, 4).map((cat) => (
              <a
                key={cat.id}
                href={`/blog?category=${cat.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedCategory(cat.slug);
                  onNavigate('/blog');
                }}
                className="hover:text-[#86defe] transition-colors whitespace-nowrap shrink-0"
              >
                {cat.name}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('/admin')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6E45E9] text-white text-xs font-semibold hover:bg-[#5c36d1] transition-colors whitespace-nowrap shrink-0"
            >
              <Settings2 className="w-3.5 h-3.5" />
              پنل مدیریت
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        {slug ? (
          loading ? (
            <div className="max-w-3xl mx-auto py-20 space-y-4">
              <div className="h-8 w-2/3 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-72 rounded-2xl bg-white/5 animate-pulse" />
              <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
            </div>
          ) : error || !activePost ? (
            <div className="max-w-xl mx-auto text-center py-20 border border-white/10 rounded-2xl bg-white/[0.02]">
              <h1 className="text-xl font-bold mb-2">مقاله مورد نظر یافت نشد</h1>
              <p className="text-sm text-slate-400 mb-6">{error || 'احتمالاً این نوشته هنوز منتشر نشده یا حذف شده است.'}</p>
              <button
                type="button"
                onClick={() => onNavigate('/blog')}
                className="px-5 py-2.5 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold"
              >
                بازگشت به لیست مقالات
              </button>
            </div>
          ) : (
            <article className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
                <button
                  type="button"
                  onClick={() => onNavigate('/blog')}
                  className="inline-flex items-center gap-1 text-[#86defe] hover:underline"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  همه مقالات
                </button>
                {activePost.category_name && (
                  <>
                    <span aria-hidden="true">/</span>
                    <span>{activePost.category_name}</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-5 text-balance">
                {activePost.title}
              </h1>

              {/* Clean unboxed editorial metadata */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400 pb-6 border-b border-white/10 mb-8">
                <span>{activePost.author_name}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  {formatPersianDate(activePost.published_at || activePost.created_at)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activePost.reading_time} دقیقه مطالعه</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{activePost.views} بازدید</span>
              </div>

              {activePost.featured_image ? (
                <img
                  src={activePost.featured_image}
                  alt={activePost.title}
                  referrerPolicy="no-referrer"
                  className="w-full rounded-2xl mb-9 border border-white/10 object-cover max-h-[460px]"
                />
              ) : (
                <div className="w-full h-56 rounded-2xl mb-9 border border-white/10 bg-gradient-to-br from-[#6E45E9]/20 to-[#86defe]/10 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-[#86defe]/60" />
                </div>
              )}

              {/* Article Rich Content (Images + CTA Buttons) */}
              <div
                className="raya-article-content text-slate-200 max-w-2xl mx-auto"
                dangerouslySetInnerHTML={{ __html: activePost.content_html }}
              />

              {activePost.tags && (
                <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>برچسب‌ها:</span>
                  {activePost.tags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="text-[#86defe]">
                        #{tag}
                      </span>
                    ))}
                </div>
              )}

              {relatedPosts.length > 0 && (
                <section className="mt-14 pt-8 border-t border-white/10">
                  <h2 className="text-xl font-bold text-white mb-5">مقالات مرتبط</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedPosts.map((item) => (
                      <a
                        key={item.id}
                        href={`/blog/${encodeURIComponent(item.slug)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/blog/${encodeURIComponent(item.slug)}`);
                        }}
                        className="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#6E45E9] transition-colors flex flex-col justify-between"
                      >
                        <div>
                          <div className="text-[11px] text-slate-400 mb-1.5">
                            {item.category_name || 'مقاله'} · {item.reading_time} دقیقه
                          </div>
                          <div className="text-sm font-bold text-white leading-snug mb-3">
                            {item.title}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[#86defe]">مطالعه ←</span>
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </article>
          )
        ) : (
          <div>
            {/* Editorial Blog Masthead */}
            <div className="border-b border-white/10 pb-8 mb-10">
              <p className="text-xs font-medium text-[#86defe] mb-2">پیش‌نمایش زنده وبلاگ رایا‌نیک</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 text-balance">
                وبلاگ و مقالات تخصصی
              </h1>
              <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
                هر نوشته‌ای که در پنل مدیریت منتشر کنید، بلافاصله در این بخش و به عنوان یک صفحه مقاله مستقل روی سایت نمایش داده می‌شود.
              </p>

              <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === ''
                        ? 'bg-[#6E45E9] text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    همه مقالات
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat.slug
                          ? 'bg-[#6E45E9] text-white'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="جستجو در عنوان و موضوع..."
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#86defe]"
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-80 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">
                {error}
              </div>
            ) : posts.length === 0 ? (
              <div className="py-20 text-center rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-slate-300 mb-4">هنوز مقاله منتشرشده‌ای با این فیلتر وجود ندارد.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('/admin')}
                  className="px-5 py-2.5 rounded-lg bg-[#6E45E9] text-white text-sm font-semibold"
                >
                  ورود به پنل و نوشتن مقاله
                </button>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Lead Story */}
                {leadPost && (
                  <a
                    href={`/blog/${encodeURIComponent(leadPost.slug)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(`/blog/${encodeURIComponent(leadPost.slug)}`);
                    }}
                    className="group grid grid-cols-1 lg:grid-cols-12 rounded-2xl border border-white/10 bg-[#18111c] overflow-hidden hover:border-[#6E45E9] transition-colors items-stretch"
                  >
                    <div className="lg:col-span-7 bg-black/30 overflow-hidden min-h-[260px]">
                      {leadPost.featured_image ? (
                        <img
                          src={leadPost.featured_image}
                          alt={leadPost.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#6E45E9]/20 to-[#86defe]/10">
                          <BookOpen className="w-12 h-12 text-[#86defe]/60" />
                        </div>
                      )}
                    </div>
                    <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                          <span className="text-[#86defe] font-medium">
                            {leadPost.category_name || 'مقاله ویژه'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            {formatPersianDate(leadPost.published_at || leadPost.created_at)}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{leadPost.reading_time} دقیقه</span>
                        </div>
                        <h2 className="text-2xl font-extrabold text-white mb-3 leading-snug group-hover:text-[#86defe] transition-colors">
                          {leadPost.title}
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-4">
                          {leadPost.excerpt}
                        </p>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/10 text-xs font-semibold text-[#86defe]">
                        ادامه مطلب و مشاهده صفحه مقاله ←
                      </div>
                    </div>
                  </a>
                )}

                {/* Secondary Articles Grid */}
                {secondaryPosts.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {secondaryPosts.map((post) => (
                      <a
                        key={post.id}
                        href={`/blog/${encodeURIComponent(post.slug)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate(`/blog/${encodeURIComponent(post.slug)}`);
                        }}
                        className="group rounded-2xl border border-white/10 bg-[#18111c] overflow-hidden hover:border-[#6E45E9] transition-colors flex flex-col"
                      >
                        <div className="aspect-video bg-black/40 overflow-hidden">
                          {post.featured_image ? (
                            <img
                              src={post.featured_image}
                              alt={post.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#6E45E9]/20 to-[#86defe]/10">
                              <BookOpen className="w-9 h-9 text-[#86defe]/60" />
                            </div>
                          )}
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                            {post.category_name && (
                              <>
                                <span className="text-[#86defe]">{post.category_name}</span>
                                <span aria-hidden="true">·</span>
                              </>
                            )}
                            <span className="tabular-nums">
                              {formatPersianDate(post.published_at || post.created_at)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{post.reading_time} دقیقه</span>
                          </div>
                          <h3 className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-[#86defe] transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 flex-1">
                            {post.excerpt}
                          </p>
                          <div className="mt-4 pt-3 border-t border-white/5 text-xs font-semibold text-[#86defe]">
                            مطالعه مقاله ←
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
