/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initialAdminUsers } from '../mock/mockAdminUsers';
import { AdminUser, AdminRole } from '../types';

const STORAGE_USERS_KEY = 'iransiim_admin_users_list';
const STORAGE_PASSWORDS_KEY = 'iransiim_admin_users_passwords';

const defaultPasswords: Record<string, string> = {
  owner: 'owner123',
  operator: 'operator123',
  support: 'support123',
};

function getStoredUsers(): AdminUser[] {
  try {
    const saved = localStorage.getItem(STORAGE_USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [...initialAdminUsers];
}

function saveStoredUsers(users: AdminUser[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

function getStoredPasswords(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_PASSWORDS_KEY);
    if (saved) {
      return { ...defaultPasswords, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return { ...defaultPasswords };
}

function saveStoredPasswords(passwords: Record<string, string>): void {
  try {
    localStorage.setItem(STORAGE_PASSWORDS_KEY, JSON.stringify(passwords));
  } catch {
    // ignore
  }
}

export const adminUserService = {
  /**
   * Get all admin panel users
   */
  async getUsers(): Promise<AdminUser[]> {
    await new Promise((res) => setTimeout(res, 80));
    return getStoredUsers();
  },

  /**
   * Create an admin panel user with password
   */
  async createUser(
    userData: {
      username: string;
      fullName: string;
      mobile: string;
      email: string;
      role: AdminRole;
      password?: string;
    }
  ): Promise<AdminUser> {
    await new Promise((res) => setTimeout(res, 150));
    const users = getStoredUsers();
    const cleanUsername = userData.username.trim().toLowerCase();

    if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      throw new Error('کاربری با این نام کاربری قبلاً ثبت شده است.');
    }

    const created: AdminUser = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      fullName: userData.fullName.trim(),
      mobile: userData.mobile.trim(),
      email: userData.email.trim(),
      role: userData.role,
      isActive: true,
      lastLogin: 'هنوز وارد نشده',
      createdAt: new Date().toISOString(),
    };

    users.push(created);
    saveStoredUsers(users);

    // Save password
    if (userData.password) {
      const passwords = getStoredPasswords();
      passwords[cleanUsername] = userData.password;
      saveStoredPasswords(passwords);
    }

    return created;
  },

  /**
   * Update admin user details or role
   */
  async updateUser(
    id: string,
    updates: Partial<AdminUser>
  ): Promise<AdminUser> {
    await new Promise((res) => setTimeout(res, 120));
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`کاربر با شناسه ${id} یافت نشد.`);
    }
    users[index] = { ...users[index], ...updates };
    saveStoredUsers(users);
    return { ...users[index] };
  },

  /**
   * Delete admin user
   */
  async deleteUser(id: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 120));
    let users = getStoredUsers();
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return false;

    if (targetUser.username.toLowerCase() === 'owner') {
      throw new Error('حذف کاربر اصلی و مالک سیستم امکان‌پذیر نیست.');
    }

    users = users.filter((u) => u.id !== id);
    saveStoredUsers(users);

    const passwords = getStoredPasswords();
    delete passwords[targetUser.username.toLowerCase()];
    saveStoredPasswords(passwords);

    return true;
  },

  /**
   * Toggle user active status
   */
  async toggleUserStatus(id: string): Promise<AdminUser> {
    await new Promise((res) => setTimeout(res, 100));
    const users = getStoredUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) {
      throw new Error(`کاربر با شناسه ${id} یافت نشد.`);
    }

    if (users[index].username.toLowerCase() === 'owner') {
      throw new Error('غیرفعال کردن مالک اصلی سیستم مجاز نیست.');
    }

    users[index].isActive = !users[index].isActive;
    saveStoredUsers(users);
    return { ...users[index] };
  },

  /**
   * Change user password
   */
  async changePassword(username: string, currentPass: string, newPass: string): Promise<boolean> {
    await new Promise((res) => setTimeout(res, 150));
    const cleanUser = username.trim().toLowerCase();
    const passwords = getStoredPasswords();

    const storedPass = passwords[cleanUser] || (cleanUser === 'owner' ? 'owner123' : 'operator123');
    if (storedPass !== currentPass) {
      throw new Error('رمز عبور فعلی واردشده نادرست است.');
    }

    if (!newPass || newPass.length < 5) {
      throw new Error('رمز عبور جدید باید حداقل ۵ کاراکتر باشد.');
    }

    passwords[cleanUser] = newPass;
    saveStoredPasswords(passwords);
    return true;
  },

  /**
   * Verify credentials for login
   */
  verifyCredentials(username: string, password: string): AdminUser | null {
    const cleanUser = username.trim().toLowerCase();
    const users = getStoredUsers();
    const passwords = getStoredPasswords();

    const matchedUser = users.find((u) => u.username.toLowerCase() === cleanUser);
    if (!matchedUser || !matchedUser.isActive) return null;

    const expectedPass = passwords[cleanUser] || (cleanUser === 'owner' ? 'owner123' : 'operator123');
    if (expectedPass === password) {
      return matchedUser;
    }
    return null;
  },
};

