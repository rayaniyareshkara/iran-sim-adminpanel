export interface AuthUser {
  id: number;
  username: string;
  display_name: string;
  role: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  post_count?: number;
  created_at?: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content_html: string;
  featured_image: string;
  category_id: number | null;
  category_name?: string | null;
  category_slug?: string | null;
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

export interface MediaFile {
  url: string;
  name: string;
  size: number;
  createdAt: string;
}

export interface AdminStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  categoriesCount: number;
  mediaCount: number;
}
