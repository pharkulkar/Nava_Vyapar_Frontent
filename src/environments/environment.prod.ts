import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  apiBaseUrl: 'https://api-gateway-91d3.onrender.com/api',
  appVersion: '0.1.0',
  enableDevTools: false,
  tauri: false,
};
