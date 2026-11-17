/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { BlogPreview } from './components/BlogPreview';

export default function App() {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/admin');

  useEffect(() => {
    const handlePopState = () => {
      setPathname(window.location.pathname || '/admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  function navigate(path: string) {
    if (path !== window.location.pathname) {
      window.history.pushState({}, '', path);
      setPathname(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  if (pathname === '/blog' || pathname === '/blog/') {
    return <BlogPreview onNavigate={navigate} />;
  }

  if (pathname.startsWith('/blog/')) {
    const slug = pathname.slice('/blog/'.length).replace(/\/+$/, '');
    return <BlogPreview slug={decodeURIComponent(slug)} onNavigate={navigate} />;
  }

  return <AdminDashboard onNavigate={navigate} />;
}
