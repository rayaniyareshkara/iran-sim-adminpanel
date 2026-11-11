/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouterProvider, useRouter } from './router';
import { AuthProvider, useAuth } from './services/authContext';
import { AdminOrdersListView } from './views/admin/AdminOrdersListView';
import { AdminOrderDetailView } from './views/admin/AdminOrderDetailView';
import { AdminDashboardView } from './views/admin/AdminDashboardView';
import { AdminSimPricingView } from './views/admin/AdminSimPricingView';
import { AdminUsersView } from './views/admin/AdminUsersView';
import { AdminProfileView } from './views/admin/AdminProfileView';
import { AdminLoginView } from './views/admin/AdminLoginView';

const AppContent: React.FC = () => {
  const { path } = useRouter();
  const { isAuthenticated, isOwner } = useAuth();

  // If user is not logged in, show secure login view
  if (!isAuthenticated) {
    return <AdminLoginView />;
  }

  // Admin Routes: Orders, SIM Pricing, Users, Profile and Dashboard
  if (path.startsWith('/admin/orders/') && path !== '/admin/orders') {
    return <AdminOrderDetailView />;
  }

  if (path === '/admin/orders') {
    return <AdminOrdersListView />;
  }

  if (path === '/admin/pricing') {
    return <AdminSimPricingView />;
  }

  if (path === '/admin/users') {
    // Only owner can access user management
    return isOwner ? <AdminUsersView /> : <AdminDashboardView />;
  }

  if (path === '/admin/profile') {
    return <AdminProfileView />;
  }

  // Default: dashboard (covers '/', '/admin', and any unknown path)
  return <AdminDashboardView />;
};

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}
