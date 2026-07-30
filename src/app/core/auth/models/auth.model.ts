export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  businessId: string;
}

export type UserRole = 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
