import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api/v1',
  appVersion: '0.1.0',
  enableDevTools: true,
  tauri: false,
};
