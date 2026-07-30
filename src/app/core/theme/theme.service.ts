import { Injectable, inject, effect } from '@angular/core';
import { AppStore } from '../store/app.store';

type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly store = inject(AppStore);
  private readonly STORAGE_KEY = 'nv-theme';

  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as ThemeMode | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    this.store.setDarkMode(isDark);

    // React to system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.store.setDarkMode(e.matches);
      }
    });

    // Sync DOM with signal changes
    effect(() => {
      document.documentElement.classList.toggle('dark', this.store.darkMode());
    });
  }

  setTheme(mode: ThemeMode): void {
    if (mode === 'system') {
      localStorage.removeItem(this.STORAGE_KEY);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.store.setDarkMode(prefersDark);
    } else {
      localStorage.setItem(this.STORAGE_KEY, mode);
      this.store.setDarkMode(mode === 'dark');
    }
  }
}
