import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { AppStore } from '../../store/app.store';
import type { AuthTokens, LoginRequest, User } from '../models/auth.model';

interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(AppStore);

  private readonly TOKEN_KEY = 'nv_access_token';
  private readonly REFRESH_KEY = 'nv_refresh_token';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.store.setAuthLoading(true);

    // ── DEV MOCK — remove when real backend is available ──────────────────
    if (!environment.production) {
      const mockResponse: LoginResponse = {
        user: {
          id: '1',
          email: credentials.email,
          name: 'Demo User',
          role: 'owner',
          businessId: 'biz-001',
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        },
      };
      this._persistTokens(mockResponse.tokens);
      this.store.setAuthSuccess(mockResponse.user, mockResponse.tokens);
      this.router.navigate(['/dashboard']);
      return of(mockResponse);
    }
    // ─────────────────────────────────────────────────────────────────────

    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, credentials).pipe(
      tap(res => {
        this._persistTokens(res.tokens);
        this.store.setAuthSuccess(res.user, res.tokens);
        this.router.navigate(['/dashboard']);
      }),
      catchError(err => {
        this.store.setAuthError(err?.error?.message ?? 'Login failed');
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    this._clearTokens();
    this.store.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthTokens> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.http
      .post<AuthTokens>(`${environment.apiBaseUrl}/auth/refresh`, { refreshToken })
      .pipe(tap(tokens => this._persistTokens(tokens)));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isTokenValid(): boolean {
    return !!this.getAccessToken();
  }

  private _persistTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_KEY, tokens.refreshToken);
  }

  private _clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }
}
