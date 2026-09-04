export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
  businessId: string;
}

export type UserRole = 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer';

export interface Business {
  id: number;
  userId: number;
  name: string;
  address: string;
  gstNumber: string;
  contactNumber: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  mobileNo: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  status: string;
  statusMessage: string;
  displayMessage: string;
  token: string;
  userId: number;
  mobileNo: string;
  firstName: string;
  lastName: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  password: string;
  mobileNo?: string;
}

export interface SignupResponse {
  status: string;
  statusMessage: string;
  displayMessage: string;
  userId: number;
  firstName: string;
  lastName: string;
  mobileNo: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  selectedBusiness: Business | null;
}
