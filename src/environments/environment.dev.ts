import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  apiBaseUrl: 'https://api-gateway-91d3.onrender.com/api',
  appVersion: '0.1.0',
  enableDevTools: true,
  tauri: false,
};
