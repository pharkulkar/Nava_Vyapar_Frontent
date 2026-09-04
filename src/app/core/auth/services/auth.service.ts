import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import type { Observable } from 'rxjs';
import { of, tap, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { AppStore } from '../../store/app.store';
import type { LoginRequest, LoginResponse, SignupRequest, SignupResponse, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly store = inject(AppStore);

  private readonly TOKEN_KEY = 'nv_access_token';

  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.store.setAuthLoading(true);

    return this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/signin`, {
        mobileNo: credentials.mobileNo,
        password: credentials.password,
      })
      .pipe(
        tap(res => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          const user: User = {
            id: String(res.userId),
            name: `${res.firstName} ${res.lastName}`.trim(),
            role: 'owner',
            businessId: '',
          };
          this.store.setAuthSuccess(user, null);
          this.router.navigate(['/select-business']);
        }),
        catchError(err => {
          const body = err?.error;

          // Guard against backends that return non-2xx even on success
          if (body?.status === 'success') {
            const user: User = {
              id: String(body.userId),
              name: `${body.firstName} ${body.lastName}`.trim(),
              role: 'owner',
              businessId: '',
            };
            localStorage.setItem(this.TOKEN_KEY, body.token);
            this.store.setAuthSuccess(user, null);
            this.router.navigate(['/select-business']);
            return of(body as LoginResponse);
          }

          const errorMessage =
            body?.displayMessage ?? body?.message ?? 'Login failed';
          this.store.setAuthError(errorMessage);
          return throwError(() => err);
        }),
      );
  }

  signup(payload: SignupRequest): Observable<SignupResponse> {
    this.store.setAuthLoading(true);

    // ── DEV MOCK — remove when real backend is available ──────────────────
    // if (!environment.production) {
    //   const mockResponse: LoginResponse = {
    //     user: {
    //       id: String(Date.now()),
    //       name: `${payload.firstName} ${payload.lastName}`.trim(),
    //       role: 'owner',
    //       businessId: `biz-${Date.now()}`,
    //     },
    //     tokens: {
    //       accessToken: 'mock-access-token',
    //       refreshToken: 'mock-refresh-token',
    //       expiresIn: 3600,
    //     },
    //   };
    //   this._persistTokens(mockResponse.tokens);
    //   this.store.setAuthSuccess(mockResponse.user, mockResponse.tokens);
    //   this.router.navigate(['/dashboard']);
    //   return of(mockResponse);
    // }
    // ─────────────────────────────────────────────────────────────────────

    return this.http.post<SignupResponse>(`${environment.apiBaseUrl}/auth/signup`, payload).pipe(
      tap(res => {
        this.store.setSignupSuccess(res.displayMessage);
        this.router.navigate(['/auth/login']);
      }),
      catchError(err => {
        const body = err?.error;

        // Some backends return non-2xx HTTP status even on logical success.
        // If the body explicitly says success, treat it as such.
        if (body?.status === 'success') {
          const message = body.displayMessage ?? 'Registration completed successfully';
          this.store.setSignupSuccess(message);
          this.router.navigate(['/auth/login']);
          return of(body as SignupResponse);
        }

        let errorMessage = 'Signup failed';
        if (err?.status === 409 && body?.displayMessage) {
          errorMessage = body.displayMessage;
        } else if (body?.message) {
          errorMessage = body.message;
        }

        this.store.setAuthError(errorMessage);
        return throwError(() => err);
      }),
    );
  }

  logout(): void {
    this._clearTokens();
    this.store.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isTokenValid(): boolean {
    return !!this.getAccessToken();
  }

  private _clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
