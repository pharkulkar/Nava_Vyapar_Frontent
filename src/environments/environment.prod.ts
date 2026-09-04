import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://api-gateway-fyeg.onrender.com/api',
  appVersion: '0.1.0',
  enableDevTools: false,
  tauri: false,
};
