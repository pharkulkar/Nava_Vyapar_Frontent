import { Injectable, inject } from '@angular/core';
import { AppStore } from '../store/app.store';

@Injectable({ providedIn: 'root' })
export class TauriService {
  private readonly store = inject(AppStore);

  get isDesktop(): boolean {
    return this.store.isTauriApp();
  }

  async invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (!this.isDesktop) {
      throw new Error(`Tauri command "${command}" called in non-desktop context`);
    }
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(command, args);
  }

  async openUrl(url: string): Promise<void> {
    if (this.isDesktop) {
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  async getAppVersion(): Promise<string> {
    if (this.isDesktop) {
      const { getVersion } = await import('@tauri-apps/api/app');
      return getVersion();
    }
    return '0.1.0';
  }

  async minimize(): Promise<void> {
    if (this.isDesktop) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    }
  }

  async maximize(): Promise<void> {
    if (this.isDesktop) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    }
  }

  async closeWindow(): Promise<void> {
    if (this.isDesktop) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    }
  }
}
