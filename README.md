# Nava Vyapar — Enterprise Business Management Platform

A production-ready ERP foundation built with Angular 19, Tauri v2, Angular Material, and Tailwind CSS.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 19 (Standalone, Signals, OnPush) |
| Desktop | Tauri v2 (Rust backend) |
| UI Library | Angular Material 19 |
| Styling | Tailwind CSS 3 + SCSS |
| Language | TypeScript 5.6 (strict) |
| State | Angular Signals (no NgRx) |
| PWA | @angular/service-worker |
| Linting | ESLint 9 (flat config) |
| Formatting | Prettier 3 |
| Git Hooks | Husky 9 + lint-staged |

---

## Prerequisites

- Node.js >= 20
- Rust (stable) — [rustup.rs](https://rustup.rs)
- Tauri CLI v2: `cargo install tauri-cli --version "^2.0"`

---

## Quick Start

```bash
# Install dependencies
npm install

# Web development server
npm start                  # http://localhost:4200

# Desktop (Tauri) development
npm run tauri:dev

# Production web build
npm run build:prod

# Desktop production build
npm run tauri:build
```

---

## Project Structure

```
src/
├── app/
│   ├── core/                    # Singleton services, guards, interceptors
│   │   ├── auth/
│   │   │   ├── guards/          # authGuard, guestGuard, roleGuard
│   │   │   ├── interceptors/    # authInterceptor, loadingInterceptor
│   │   │   ├── models/          # User, AuthState, AuthTokens
│   │   │   └── services/        # AuthService
│   │   ├── services/            # LoadingService, ToastService
│   │   ├── store/               # AppStore (Signals-based global state)
│   │   ├── tauri/               # TauriService (desktop abstraction)
│   │   └── theme/               # ThemeService (dark/light/system)
│   │
│   ├── layout/                  # App shell components
│   │   ├── shell/               # ShellComponent (main frame)
│   │   ├── sidebar/             # SidebarComponent + nav-items
│   │   ├── header/              # HeaderComponent
│   │   └── footer/              # FooterComponent
│   │
│   ├── shared/                  # Reusable across features
│   │   ├── components/          # PageHeader, StatCard, Toast, Unauthorized
│   │   ├── directives/          # (extend here)
│   │   ├── pipes/               # (extend here)
│   │   ├── models/              # ApiResponse, Pagination
│   │   └── utils/               # (extend here)
│   │
│   ├── features/                # Feature-first modules (lazy loaded)
│   │   ├── auth/                # Login, forgot password
│   │   ├── dashboard/           # KPI overview
│   │   ├── sales/               # Invoices, quotations, customers
│   │   ├── purchases/           # Purchase orders, vendors
│   │   ├── inventory/           # Products, stock management
│   │   ├── accounting/          # Ledger, reports
│   │   └── settings/            # App & profile settings
│   │
│   ├── app.component.ts         # Root component
│   ├── app.config.ts            # provideRouter, provideHttpClient, etc.
│   └── app.routes.ts            # Top-level lazy routes
│
├── environments/                # environment.ts / .dev.ts / .prod.ts
├── styles.scss                  # Tailwind + Material theme
├── index.html                   # PWA meta, fonts
├── manifest.webmanifest         # PWA manifest
└── ngsw-config.json             # Service worker caching

src-tauri/                       # Rust/Tauri desktop layer
├── src/
│   ├── main.rs
│   └── lib.rs                   # Tauri commands
├── tauri.conf.json
└── Cargo.toml
```

---

## Architecture Principles

### Clean Architecture
- **Core** — framework-agnostic business logic (services, models, guards)
- **Features** — self-contained vertical slices, lazy loaded
- **Shared** — pure presentational components with no business logic
- **Layout** — structural shell, never imports from features

### SOLID
- **S** — Each service/component has one responsibility
- **O** — Features extend via routes without modifying core
- **L** — Guards and interceptors are substitutable via DI
- **I** — Interfaces in `models/` are minimal and focused
- **D** — Components depend on abstractions (services), not implementations

### State Management (Signals)
```typescript
// Read state
store.isAuthenticated()       // computed signal
store.currentUser()           // computed signal
store.sidebarCollapsed()      // computed signal

// Mutate state
store.toggleSidebar()
store.setAuthSuccess(user, tokens)
store.toggleDarkMode()
```

### Adding a New Feature
```bash
# 1. Create feature directory
mkdir src/app/features/my-feature

# 2. Create routes file
# src/app/features/my-feature/my-feature.routes.ts

# 3. Register in app.routes.ts
{
  path: 'my-feature',
  loadChildren: () => import('./features/my-feature/my-feature.routes')
    .then(m => m.MY_FEATURE_ROUTES),
}

# 4. Add nav item in layout/sidebar/nav-items.ts
```

---

## PWA

The app registers a service worker in production with:
- **App shell** prefetched on install
- **API responses** cached with freshness strategy (3-day TTL)
- **Offline fallback** to cached index.html

---

## Desktop (Tauri)

The `TauriService` abstracts all desktop APIs:
```typescript
// Works in both web and desktop
await tauriService.openUrl('https://example.com');
await tauriService.getAppVersion();

// Desktop only (guarded internally)
await tauriService.minimize();
await tauriService.maximize();
```

---

## Code Quality

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
```

Commit messages must follow **Conventional Commits**:
```
feat(sales): add invoice PDF export
fix(auth): handle token expiry edge case
chore(deps): update angular to 19.1
```

---

## Environment Configuration

| File | Purpose |
|---|---|
| `environment.ts` | Default (replaced at build) |
| `environment.dev.ts` | Local development |
| `environment.prod.ts` | Production build |

---

## License

Proprietary — All rights reserved.
