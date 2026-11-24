export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin';
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}
