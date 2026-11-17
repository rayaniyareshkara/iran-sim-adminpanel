export const NUXT_BLOG_INDEX_CODE = `<template>
  <div class="min-h-screen bg-[#110a14] text-white py-16 px-4 md:px-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-10 border-b border-white/10 pb-8">
        <p class="text-xs text-[#86defe] mb-2 font-medium">مجله تخصصی رایا‌نیک</p>
        <h1 class="text-3xl md:text-4xl font-extrabold text-white mb-3">
          وبلاگ و مقالات آموزشی
        </h1>
        <p class="text-sm md:text-base text-gray-300 max-w-2xl leading-relaxed">
          تازه‌ترین مقالات درباره طراحی وب‌سایت، سئو، بهینه‌سازی نرخ تبدیل و توسعه محصول دیجیتال.
        </p>

        <!-- Search & Category Filters -->
        <div class="mt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <button
              @click="selectCategory('')"
              :class="[
                'px-4 py-2 rounded-lg text-xs font-medium transition-colors',
                selectedCategory === ''
                  ? 'bg-[#6E45E9] text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              ]"
            >
              همه مقالات
            </button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              @click="selectCategory(cat.slug)"
              :class="[
                'px-4 py-2 rounded-lg text-xs font-medium transition-colors',
                selectedCategory === cat.slug
                  ? 'bg-[#6E45E9] text-white'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10'
              ]"
            >
              {{ cat.name }}
            </button>
          </div>

          <div class="w-full md:w-72">
            <input
              v-model="searchQuery"
              @input="debouncedFetch"
              type="search"
              placeholder="جستجو در مقالات..."
              class="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#86defe]"
            />
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="n in 3" :key="n" class="h-80 rounded-2xl bg-white/5 animate-pulse" />
      </div>

      <!-- Empty -->
      <div v-else-if="posts.length === 0" class="text-center py-20 border border-white/10 rounded-2xl bg-white/[0.02]">
        <p class="text-gray-300 text-base">هنوز مقاله‌ای در این بخش منتشر نشده است.</p>
      </div>

      <!-- Posts Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <NuxtLink
          v-for="post in posts"
          :key="post.id"
          :to="\`/blog/\${encodeURIComponent(post.slug)}\`"
          class="group rounded-2xl border border-white/10 bg-[#18111c] overflow-hidden hover:border-[#6E45E9]/70 transition-all flex flex-col"
        >
          <div class="aspect-video bg-black/40 overflow-hidden">
            <img
              v-if="post.featured_image"
              :src="post.featured_image"
              :alt="post.title"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div class="p-5 flex-1 flex flex-col">
            <div class="flex items-center gap-2 text-xs text-gray-400 mb-2">
              <span v-if="post.category_name" class="text-[#86defe]">{{ post.category_name }}</span>
              <span v-if="post.category_name">·</span>
              <span>{{ formatDate(post.published_at || post.created_at) }}</span>
              <span>·</span>
              <span>{{ post.reading_time }} دقیقه مطالعه</span>
            </div>
            <h2 class="text-lg font-bold text-white mb-2 leading-snug group-hover:text-[#86defe] transition-colors">
              {{ post.title }}
            </h2>
            <p class="text-xs text-gray-400 leading-relaxed line-clamp-3 flex-1">
              {{ post.excerpt }}
            </p>
            <div class="mt-4 pt-3 border-t border-white/5 text-xs font-semibold text-[#86defe]">
              مطالعه مقاله ←
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'وبلاگ و مقالات | رایا‌نیک',
  meta: [
    { name: 'description', content: 'مقالات تخصصی طراحی سایت، سئو و توسعه کسب‌وکار اینترنتی در وبلاگ رایا‌نیک' }
  ]
});

const selectedCategory = ref('');
const searchQuery = ref('');
const posts = ref<any[]>([]);
const categories = ref<any[]>([]);
const pending = ref(true);

let timer: ReturnType<typeof setTimeout> | null = null;

async function fetchData() {
  pending.value = true;
  try {
    const params = new URLSearchParams();
    if (selectedCategory.value) params.set('category', selectedCategory.value);
    if (searchQuery.value.trim()) params.set('q', searchQuery.value.trim());
    const [postsRes, catsRes] = await Promise.all([
      $fetch<{ posts: any[] }>(\`/api/posts?\${params.toString()}\`),
      $fetch<{ categories: any[] }>('/api/categories'),
    ]);
    posts.value = postsRes.posts || [];
    categories.value = catsRes.categories || [];
  } finally {
    pending.value = false;
  }
}

function selectCategory(slug: string) {
  selectedCategory.value = slug;
  fetchData();
}

function debouncedFetch() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(fetchData, 300);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
}

onMounted(fetchData);
</script>`;

export const NUXT_BLOG_SLUG_CODE = `<template>
  <div class="min-h-screen bg-[#110a14] text-white py-14 px-4 md:px-8">
    <div class="max-w-3xl mx-auto">
      <div v-if="pending" class="py-24 text-center text-gray-400">در حال بارگذاری مقاله...</div>

      <div v-else-if="!post" class="py-24 text-center border border-white/10 rounded-2xl">
        <h1 class="text-2xl font-bold mb-3">مقاله پیدا نشد</h1>
        <NuxtLink to="/blog" class="inline-block px-5 py-2.5 rounded-lg bg-[#6E45E9] text-white text-sm">
          بازگشت به وبلاگ
        </NuxtLink>
      </div>

      <article v-else>
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-xs text-gray-400 mb-6">
          <NuxtLink to="/" class="hover:text-white">صفحه اصلی</NuxtLink>
          <span>/</span>
          <NuxtLink to="/blog" class="hover:text-white">وبلاگ</NuxtLink>
          <template v-if="post.category_name">
            <span>/</span>
            <span class="text-[#86defe]">{{ post.category_name }}</span>
          </template>
        </div>

        <h1 class="text-2xl md:text-4xl font-extrabold text-white leading-tight mb-4">
          {{ post.title }}
        </h1>

        <div class="flex flex-wrap items-center gap-3 text-xs text-gray-400 pb-6 border-b border-white/10 mb-8">
          <span>نویسنده: {{ post.author_name }}</span>
          <span>·</span>
          <span>{{ formatDate(post.published_at || post.created_at) }}</span>
          <span>·</span>
          <span>{{ post.reading_time }} دقیقه مطالعه</span>
        </div>

        <img
          v-if="post.featured_image"
          :src="post.featured_image"
          :alt="post.title"
          class="w-full rounded-2xl mb-8 border border-white/10 object-cover max-h-[460px]"
        />

        <!-- Rich Article Body (Headings, Images & Custom CTA Buttons) -->
        <div class="raya-article-content text-gray-200" v-html="post.content_html" />

        <!-- Tags -->
        <div v-if="post.tags" class="mt-10 pt-6 border-t border-white/10 flex flex-wrap gap-2 text-xs text-gray-400">
          <span>برچسب‌ها:</span>
          <span v-for="tag in post.tags.split(',')" :key="tag" class="text-[#86defe]">
            #{{ tag.trim() }}
          </span>
        </div>

        <!-- Related Articles -->
        <div v-if="related.length" class="mt-14 pt-8 border-t border-white/10">
          <h2 class="text-xl font-bold mb-5">مقالات مرتبط</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NuxtLink
              v-for="item in related"
              :key="item.id"
              :to="\`/blog/\${encodeURIComponent(item.slug)}\`"
              class="p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:border-[#6E45E9] transition-colors"
            >
              <div class="text-sm font-bold text-white mb-2 leading-snug">{{ item.title }}</div>
              <div class="text-xs text-[#86defe]">مطالعه ←</div>
            </NuxtLink>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const post = ref<any>(null);
const related = ref<any[]>([]);
const pending = ref(true);

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso));
}

onMounted(async () => {
  try {
    const slug = encodeURIComponent(String(route.params.slug || ''));
    const res = await $fetch<{ post: any; related: any[] }>(\`/api/posts/\${slug}\`);
    post.value = res.post;
    related.value = res.related || [];

    useHead({
      title: res.post.meta_title || res.post.title,
      meta: [
        { name: 'description', content: res.post.meta_description || res.post.excerpt },
        { property: 'og:title', content: res.post.meta_title || res.post.title },
        { property: 'og:description', content: res.post.meta_description || res.post.excerpt },
      ]
    });
  } catch {
    post.value = null;
  } finally {
    pending.value = false;
  }
});
</script>

<style lang="scss">
.raya-article-content {
  line-height: 2;
  font-size: 1rem;
  h2 { font-size: 1.45rem; font-weight: 700; color: #fff; margin: 2rem 0 0.85rem; }
  h3 { font-size: 1.2rem; font-weight: 700; color: #86defe; margin: 1.5rem 0 0.65rem; }
  p { margin-bottom: 1.15rem; font-size: 0.98rem !important; }
  ul { list-style: disc; padding-right: 1.5rem; margin-bottom: 1.15rem; }
  ol { list-style: decimal; padding-right: 1.5rem; margin-bottom: 1.15rem; }
  blockquote { padding: 1rem 1.25rem; border-radius: 0.75rem; border: 1px solid rgba(110,69,233,0.35); background: rgba(110,69,233,0.08); margin: 1.5rem 0; }
  img { max-width: 100%; border-radius: 0.85rem; margin: 1.5rem auto; display: block; }
  figure { margin: 1.5rem 0; text-align: center; }
  figcaption { font-size: 0.82rem; color: #9ca3af; margin-top: 0.5rem; }
}
.raya-btn-wrap { margin: 1.5rem 0; display: flex; flex-wrap: wrap; }
.raya-btn-wrap[data-align="center"] { justify-content: center; }
.raya-btn-wrap[data-align="start"] { justify-content: flex-start; }
.raya-btn-wrap[data-align="end"] { justify-content: flex-end; }
.raya-btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.75rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.95rem; transition: all .2s; }
.raya-btn--primary { background: #6E45E9; color: #fff !important; }
.raya-btn--cyan { background: #86defe; color: #110a14 !important; }
.raya-btn--outline { border: 1.5px solid #6E45E9; color: #86defe !important; }
.raya-btn--dark { background: #1e1b24; border: 1px solid rgba(255,255,255,0.2); color: #fff !important; }
</style>`;

export const NGINX_RAYANIK_CONFIG = `server {
    listen 80;
    listen [::]:80;
    server_name rayanik.net www.rayanik.net;

    root /var/www/html;
    index index.html index.htm;

    client_max_body_size 15M;

    # 1. API Backend (rayabackend on port 3000)
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header X-Robots-Tag "noindex, nofollow" always;
    }

    # 2. Uploaded Blog Images
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000/uploads/;
        proxy_set_header Host $host;
        expires 30d;
    }

    # 3. Admin Panel (Strict noindex, nofollow)
    location ^~ /admin {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        add_header X-Robots-Tag "noindex, nofollow" always;
    }

    # Admin static assets served by Vite/Express dist
    location /assets/ {
        proxy_pass http://127.0.0.1:3000/assets/;
        expires 30d;
    }

    # 4. Public Nuxt SPA (/ , /blog , /blog/*)
    location / {
        try_files $uri $uri/ /200.html /index.html;
    }
}`;

export const SERVER_SETUP_COMMANDS = `# 1. نصب Node.js 22 و PM2 روی سرور Ubuntu 22.04
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 2. کلون و اجرای بک‌اند و پنل ادمین (rayabackend)
cd /var/www
git clone https://github.com/rayaniyareshkara/rayabackend.git
cd /var/www/rayabackend
npm install
npm run build
cp .env.example .env
# (در فایل .env حتماً JWT_SECRET و ADMIN_PASSWORD را تغییر دهید)
NODE_ENV=production PORT=3000 pm2 start npm --name "rayabackend" -- start
pm2 save && pm2 startup

# 3. افزودن صفحات بلاگ به فرانت‌اند Nuxt (/var/www/rayanik) و بیلد مجدد
cd /var/www/rayanik
mkdir -p pages/blog
# فایل‌های pages/blog/index.vue و pages/blog/[slug].vue را بسازید
npm install && npm run generate
cp -r .output/public/* /var/www/html/

# 4. فعال‌سازی کانفیگ Nginx برای rayanik.net
sudo nano /etc/nginx/sites-available/rayanik.net
sudo ln -s /etc/nginx/sites-available/rayanik.net /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx`;
