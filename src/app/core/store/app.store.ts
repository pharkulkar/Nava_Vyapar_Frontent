import { Injectable, computed, signal } from '@angular/core';
import type { AuthState, User } from '../auth/models/auth.model';

export interface AppState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  isMobile: boolean;
  isOnline: boolean;
  isTauriApp: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppStore {
  // ── UI State ──────────────────────────────────────────────────────────────
  private readonly _ui = signal<AppState>({
    sidebarCollapsed: false,
    darkMode: false,
    isMobile: false,
    isOnline: navigator.onLine,
    isTauriApp: typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window,
  });

  readonly ui = this._ui.asReadonly();
  readonly sidebarCollapsed = computed(() => this._ui().sidebarCollapsed);
  readonly darkMode = computed(() => this._ui().darkMode);
  readonly isTauriApp = computed(() => this._ui().isTauriApp);

  // ── Auth State ────────────────────────────────────────────────────────────
  private readonly _auth = signal<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  readonly auth = this._auth.asReadonly();
  readonly currentUser = computed(() => this._auth().user);
  readonly isAuthenticated = computed(() => this._auth().isAuthenticated);
  readonly authLoading = computed(() => this._auth().isLoading);

  // ── UI Mutations ──────────────────────────────────────────────────────────
  toggleSidebar(): void {
    this._ui.update(s => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }));
  }

  setSidebarCollapsed(collapsed: boolean): void {
    this._ui.update(s => ({ ...s, sidebarCollapsed: collapsed }));
  }

  toggleDarkMode(): void {
    this._ui.update(s => ({ ...s, darkMode: !s.darkMode }));
    this._applyTheme();
  }

  setDarkMode(dark: boolean): void {
    this._ui.update(s => ({ ...s, darkMode: dark }));
    this._applyTheme();
  }

  setMobile(isMobile: boolean): void {
    this._ui.update(s => ({ ...s, sidebarCollapsed: isMobile, isMobile }));
  }

  setOnline(isOnline: boolean): void {
    this._ui.update(s => ({ ...s, isOnline }));
  }

  // ── Auth Mutations ────────────────────────────────────────────────────────
  setAuthLoading(isLoading: boolean): void {
    this._auth.update(s => ({ ...s, isLoading, error: null }));
  }

  setAuthSuccess(user: User, tokens: AuthState['tokens']): void {
    this._auth.set({ user, tokens, isAuthenticated: true, isLoading: false, error: null });
  }

  setAuthError(error: string): void {
    this._auth.update(s => ({ ...s, isLoading: false, error }));
  }

  clearAuth(): void {
    this._auth.set({ user: null, tokens: null, isAuthenticated: false, isLoading: false, error: null });
  }

  private _applyTheme(): void {
    const isDark = this._ui().darkMode;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('nv-theme', isDark ? 'dark' : 'light');
  }
}
