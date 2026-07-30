import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiBaseUrl: '/api/v1',
  appVersion: '0.1.0',
  enableDevTools: false,
  tauri: false,
};
