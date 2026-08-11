# Nava Vyapar — Enterprise Business Management Platform

A production-ready ERP foundation built with Angular 19, Tauri v2, Angular Material, and Tailwind CSS.
Runs as a native desktop app on macOS, Windows, and Linux — and also as a Progressive Web App (PWA) in any browser.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Project Structure](#project-structure)
5. [Architecture](#architecture)
6. [State Management](#state-management)
7. [Routing & Lazy Loading](#routing--lazy-loading)
8. [Authentication](#authentication)
9. [Theme System](#theme-system)
10. [Styling — Tailwind + Material](#styling--tailwind--material)
11. [PWA Setup](#pwa-setup)
12. [Tauri Desktop Setup](#tauri-desktop-setup)
13. [Cross-Platform Builds](#cross-platform-builds)
14. [CI/CD — GitHub Actions](#cicd--github-actions)
15. [Code Quality](#code-quality)
16. [Environment Configuration](#environment-configuration)
17. [NPM Scripts Reference](#npm-scripts-reference)
18. [Troubleshooting](#troubleshooting)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Angular (Standalone, Signals, OnPush) | 19.x |
| Desktop Runtime | Tauri v2 (Rust backend) | 2.x |
| UI Component Library | Angular Material (M3) | 19.x |
| Utility CSS | Tailwind CSS | 3.4.x |
| Language | TypeScript (strict mode) | 5.6.x |
| State Management | Angular Signals (no NgRx) | built-in |
| Reactive Programming | RxJS | 7.8.x |
| PWA | @angular/service-worker | 19.x |
| Linting | ESLint 9 (flat config) | 9.x |
| Formatting | Prettier | 3.x |
| Git Hooks | Husky + lint-staged | 9.x / 15.x |
| Build Tool | Angular CLI + esbuild | 19.x |
| Rust Toolchain | rustc + cargo | 1.97.x (stable) |
| Package Manager | npm | 10.x |

---

## Prerequisites

### Web Development
| Tool | Version | Install |
|---|---|---|
| Node.js | >= 20 | [nodejs.org](https://nodejs.org) |
| npm | >= 10 | bundled with Node |

### Desktop Development (Tauri)
| Tool | Version | Install |
|---|---|---|
| Rust (stable) | >= 1.77 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Tauri CLI | ^2.0 | `cargo install tauri-cli --version "^2.0" --locked` |
| Xcode CLT (macOS) | latest | `xcode-select --install` |
| Visual Studio C++ (Windows) | 2022 | [visualstudio.microsoft.com](https://visualstudio.microsoft.com) |
| Linux system libs | — | see [Linux deps](#linux-system-dependencies) |

### Linux System Dependencies
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev
```

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Web development server — http://localhost:4200
npm start

# 3. Desktop development (requires Rust)
source "$HOME/.cargo/env"
npm run tauri:dev
```

---

## Project Structure

```
Nava_Vyapar_Frontend/
│
├── src/
│   ├── app/
│   │   ├── core/                        # Singleton services — provided in root
│   │   │   ├── auth/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── auth.guard.ts    # authGuard, guestGuard (functional)
│   │   │   │   │   └── role.guard.ts    # roleGuard(allowedRoles[]) factory
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── auth.interceptor.ts     # Attaches Bearer token, handles 401 refresh
│   │   │   │   │   └── loading.interceptor.ts  # Tracks in-flight HTTP requests
│   │   │   │   ├── models/
│   │   │   │   │   └── auth.model.ts    # User, AuthState, AuthTokens, LoginRequest
│   │   │   │   └── services/
│   │   │   │       └── auth.service.ts  # Login, logout, token refresh
│   │   │   ├── services/
│   │   │   │   ├── loading.service.ts   # Signal-based HTTP loading counter
│   │   │   │   └── toast.service.ts     # Signal-based toast notifications
│   │   │   ├── store/
│   │   │   │   └── app.store.ts         # AppStore — global Signals state (UI + Auth)
│   │   │   ├── tauri/
│   │   │   │   └── tauri.service.ts     # Desktop abstraction (web + Tauri safe)
│   │   │   └── theme/
│   │   │       └── theme.service.ts     # Dark / light / system theme management
│   │   │
│   │   ├── layout/                      # App shell — never imports from features
│   │   │   ├── shell/
│   │   │   │   ├── shell.component.ts   # Main frame — sidebar + header + router-outlet
│   │   │   │   └── shell.component.scss
│   │   │   ├── sidebar/
│   │   │   │   ├── sidebar.component.ts
│   │   │   │   ├── sidebar.component.scss
│   │   │   │   └── nav-items.ts         # Navigation tree definition
│   │   │   ├── header/
│   │   │   │   ├── header.component.ts  # Sidebar toggle, theme, notifications, user menu
│   │   │   │   └── header.component.scss
│   │   │   └── footer/
│   │   │       └── footer.component.ts
│   │   │
│   │   ├── shared/                      # Pure presentational — no business logic
│   │   │   ├── components/
│   │   │   │   ├── page-header.component.ts       # Reusable page title + actions slot
│   │   │   │   ├── stat-card.component.ts          # KPI metric card
│   │   │   │   ├── toast-container.component.ts    # Renders ToastService toasts
│   │   │   │   ├── feature-placeholder.component.ts# Coming-soon stub for unbuilt modules
│   │   │   │   └── unauthorized.component.ts       # 403 access denied page
│   │   │   ├── directives/              # Custom directives (extend here)
│   │   │   ├── pipes/                   # Custom pipes (extend here)
│   │   │   ├── models/
│   │   │   │   └── api.model.ts         # ApiResponse<T>, PaginatedResponse<T>, PaginationParams
│   │   │   └── utils/                   # Pure utility functions (extend here)
│   │   │
│   │   ├── features/                    # Feature-first vertical slices — all lazy loaded
│   │   │   ├── auth/
│   │   │   │   ├── login.component.ts   # Reactive login form
│   │   │   │   ├── login.component.scss
│   │   │   │   └── auth.routes.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts  # KPI overview with stat cards
│   │   │   │   └── dashboard.routes.ts
│   │   │   ├── sales/
│   │   │   │   └── sales.routes.ts      # Invoices, Quotations, Customers
│   │   │   ├── purchases/
│   │   │   │   └── purchases.routes.ts  # Purchase Orders, Vendors
│   │   │   ├── inventory/
│   │   │   │   └── inventory.routes.ts  # Products, Stock
│   │   │   ├── accounting/
│   │   │   │   └── accounting.routes.ts # Ledger, Reports
│   │   │   └── settings/
│   │   │       └── settings.routes.ts   # App settings, Profile
│   │   │
│   │   ├── app.component.ts             # Root component — global loader + toast container
│   │   ├── app.config.ts                # ApplicationConfig — all providers
│   │   └── app.routes.ts                # Top-level lazy routes
│   │
│   ├── environments/
│   │   ├── environment.model.ts         # Environment interface
│   │   ├── environment.ts               # Default (replaced at build time)
│   │   ├── environment.dev.ts           # Local development
│   │   └── environment.prod.ts          # Production
│   │
│   ├── styles.scss                      # Global styles — Material theme + Tailwind
│   ├── index.html                       # PWA meta, Inter font, Material Icons
│   ├── main.ts                          # bootstrapApplication entry point
│   ├── manifest.webmanifest             # PWA manifest
│   └── ngsw-config.json                 # Service worker caching config
│
├── src-tauri/                           # Rust / Tauri desktop layer
│   ├── src/
│   │   ├── main.rs                      # Desktop entry point
│   │   └── lib.rs                       # Tauri commands + app setup
│   ├── icons/                           # App icons (RGBA PNG, .icns, .ico)
│   │   ├── 32x32.png
│   │   ├── 128x128.png
│   │   ├── 128x128@2x.png
│   │   ├── 256x256.png
│   │   ├── 512x512.png
│   │   ├── icon.icns                    # macOS
│   │   └── icon.ico                     # Windows
│   ├── build.rs                         # Tauri build script
│   ├── Cargo.toml                       # Rust dependencies
│   └── tauri.conf.json                  # Tauri configuration
│
├── .github/
│   └── workflows/
│       └── release.yml                  # Cross-platform CI/CD build matrix
│
├── .husky/
│   ├── pre-commit                       # Runs lint-staged
│   └── commit-msg                       # Enforces Conventional Commits
│
├── angular.json                         # Angular workspace config
├── tailwind.config.js                   # Tailwind design tokens
├── postcss.config.js                    # PostCSS (Tailwind + Autoprefixer)
├── tsconfig.json                        # TypeScript strict config + path aliases
├── tsconfig.spec.json                   # TypeScript config for tests
├── eslint.config.js                     # ESLint 9 flat config
├── .prettierrc                          # Prettier formatting rules
├── .prettierignore
├── .gitignore
└── package.json                         # Scripts + dependencies
```

---

## Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│              Features (UI)              │  ← Lazy loaded vertical slices
├─────────────────────────────────────────┤
│               Layout                    │  ← Shell, Sidebar, Header, Footer
├─────────────────────────────────────────┤
│               Shared                    │  ← Pure presentational components
├─────────────────────────────────────────┤
│                Core                     │  ← Services, Guards, Store, Interceptors
└─────────────────────────────────────────┘
```

**Rules:**
- `core` — never imports from `features`, `layout`, or `shared`
- `layout` — never imports from `features`
- `shared` — never imports from `core`, `layout`, or `features`
- `features` — imports from `core` and `shared` only

### SOLID Principles Applied

| Principle | Implementation |
|---|---|
| Single Responsibility | Each service/component has exactly one job |
| Open/Closed | New features added via routes without touching core |
| Liskov Substitution | Guards and interceptors substitutable via DI |
| Interface Segregation | Models in `models/` are minimal and focused |
| Dependency Inversion | Components depend on service abstractions, not implementations |

### Component Pattern

All components use:
- `standalone: true` — no NgModules
- `changeDetection: ChangeDetectionStrategy.OnPush` — performance
- `inject()` function — no constructor injection

---

## State Management

Angular Signals — no NgRx, no BehaviorSubject boilerplate.

```typescript
// Inject the store
private readonly store = inject(AppStore);

// Read state (computed signals — auto-tracked)
store.isAuthenticated()     // boolean
store.currentUser()         // User | null
store.sidebarCollapsed()    // boolean
store.darkMode()            // boolean
store.isTauriApp()          // boolean

// Mutate state
store.toggleSidebar()
store.setSidebarCollapsed(true)
store.toggleDarkMode()
store.setDarkMode(true)
store.setAuthSuccess(user, tokens)
store.setAuthError('Invalid credentials')
store.clearAuth()
store.setOnline(false)
```

The `AppStore` holds two signal slices:
- `_ui` — sidebar state, dark mode, mobile breakpoint, online status, Tauri detection
- `_auth` — current user, tokens, loading state, error message

---

## Routing & Lazy Loading

All feature routes are lazy loaded using `loadChildren` / `loadComponent`:

```typescript
// app.routes.ts
{
  path: '',
  canActivate: [authGuard],
  loadComponent: () => import('./layout/shell/shell.component'),
  children: [
    {
      path: 'dashboard',
      loadChildren: () => import('./features/dashboard/dashboard.routes')
        .then(m => m.DASHBOARD_ROUTES),
    },
    // ... other features
  ]
}
```

Router features enabled:
- `withComponentInputBinding()` — route params bound as component inputs
- `withViewTransitions()` — native browser view transition animations

### Path Aliases (tsconfig.json)

```typescript
import { AppStore } from '@core/store/app.store';
import { StatCardComponent } from '@shared/components/stat-card.component';
import { DASHBOARD_ROUTES } from '@features/dashboard/dashboard.routes';
import { environment } from '@env/environment';
```

---

## Authentication

### Flow
1. User submits login form → `AuthService.login()`
2. HTTP POST to `/api/v1/auth/login`
3. Tokens stored in `localStorage`
4. `AppStore.setAuthSuccess()` updates signal state
5. Router navigates to `/dashboard`
6. On 401 → `authInterceptor` auto-refreshes token and retries request
7. On refresh failure → `AuthService.logout()` clears state and redirects to login

### Guards

| Guard | Purpose |
|---|---|
| `authGuard` | Blocks unauthenticated access, redirects to `/auth/login` |
| `guestGuard` | Blocks authenticated users from login page, redirects to `/dashboard` |
| `roleGuard(roles[])` | Blocks users without required role, redirects to `/unauthorized` |

### Dev Mock Login

In development (`environment.production === false`), any valid email + password (min 8 chars) logs in without a backend:

```
Email:    demo@navavyapar.in
Password: demo1234
```

Remove the mock block in `auth.service.ts` when connecting a real backend.

---

## Theme System

Three modes: `light` | `dark` | `system`

```typescript
// Inject ThemeService
themeService.setTheme('dark');    // force dark
themeService.setTheme('light');   // force light
themeService.setTheme('system');  // follow OS preference
```

- Theme persisted in `localStorage` under key `nv-theme`
- `html.dark` class toggled on the root element
- Angular Material M3 dark theme applied via `html.dark { @include mat.theme(...) }`
- Tailwind `darkMode: 'class'` reads the same `dark` class
- System preference change listener auto-switches when no manual override is set

---

## Styling — Tailwind + Material

### Tailwind Design Tokens (`tailwind.config.js`)

| Token Group | Examples |
|---|---|
| Colors | `primary-600`, `success-500`, `danger-600`, `surface-dark`, `sidebar` |
| Typography | `font-sans` (Inter), `font-mono` (JetBrains Mono) |
| Spacing | `sidebar` (260px), `sidebar-collapsed` (64px), `header` (64px) |
| Shadows | `shadow-card`, `shadow-card-hover`, `shadow-dialog`, `shadow-sidebar` |
| Z-Index | `z-sidebar` (100), `z-header` (90), `z-modal` (200), `z-toast` (300) |
| Animations | `animate-fade-in`, `animate-slide-in-up`, `animate-shimmer`, `animate-scale-in` |
| Border Radius | `rounded-sm` → `rounded-3xl` |

### Angular Material Theme (`styles.scss`)

Uses the M3 API (`mat.theme()`) — no deprecated `define-palette` / `define-light-theme`:

```scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (theme-type: light, primary: mat.$blue-palette, tertiary: mat.$violet-palette),
    typography: Inter,
    density: 0,
  ));
}

html.dark {
  @include mat.theme((
    color: (theme-type: dark, primary: mat.$blue-palette, tertiary: mat.$violet-palette),
    typography: Inter,
    density: 0,
  ));
}
```

---

## PWA Setup

### Service Worker (`ngsw-config.json`)

| Cache Group | Strategy | Scope |
|---|---|---|
| `app-shell` | prefetch on install | `index.html`, `*.js`, `*.css`, `manifest.webmanifest` |
| `assets` | lazy load, prefetch on update | `/assets/**`, `/icons/**` |
| `api-freshness` | network-first, 10s timeout, 3-day TTL | `/api/v1/**` |

### Web App Manifest (`manifest.webmanifest`)

- `display: standalone` — runs without browser chrome
- `theme_color: #2563eb`
- Icons: 72, 96, 128, 144, 152, 192 (maskable), 384, 512 (maskable) px
- Shortcuts: New Invoice, Dashboard

### PWA is enabled only in production builds

```typescript
provideServiceWorker('ngsw-worker.js', {
  enabled: !isDevMode(),
  registrationStrategy: 'registerWhenStable:30000',
})
```

---

## Tauri Desktop Setup

### How it works

```
Angular (Web UI)  ←→  Tauri WebView  ←→  Rust Backend
  localhost:4200         (dev)            src-tauri/src/lib.rs
  dist/ (prod)           (prod)
```

### TauriService

Abstracts all desktop APIs — safe to call in both web and desktop contexts:

```typescript
const tauri = inject(TauriService);

tauri.isDesktop                        // boolean — true only in Tauri
await tauri.openUrl('https://...')     // uses shell plugin on desktop, window.open on web
await tauri.getAppVersion()            // Tauri app version or '0.1.0' on web
await tauri.minimize()                 // desktop only
await tauri.maximize()                 // desktop only
await tauri.closeWindow()              // desktop only
await tauri.invoke<T>('command', args) // call custom Rust commands
```

### Tauri Detection

```typescript
// Detected automatically at runtime
const isTauri = '__TAURI_INTERNALS__' in window;
```

### Rust Commands (`src-tauri/src/lib.rs`)

```rust
#[tauri::command]
fn get_app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Nava Vyapar",
        "version": env!("CARGO_PKG_VERSION"),
        "platform": std::env::consts::OS,
    })
}
```

### Window Configuration (`tauri.conf.json`)

| Property | Value |
|---|---|
| Default size | 1280 × 800 |
| Minimum size | 900 × 600 |
| Resizable | yes |
| Centered on launch | yes |
| Decorations | native OS titlebar |

---

## Cross-Platform Builds

### macOS (build locally)

```bash
source "$HOME/.cargo/env"

# Apple Silicon .dmg
npm run tauri:build

# Intel .dmg
rustup target add x86_64-apple-darwin
npm run tauri:build:mac-intel

# Universal binary (Intel + Apple Silicon)
rustup target add x86_64-apple-darwin aarch64-apple-darwin
npm run tauri:build:mac-universal
```

Output: `src-tauri/target/release/bundle/dmg/`

### Windows (build on Windows or via CI)

```bash
npm run tauri:build:windows
```

Output: `src-tauri/target/release/bundle/nsis/` → `.exe` installer
Output: `src-tauri/target/release/bundle/msi/` → `.msi` installer

### Linux (build on Linux or via CI)

```bash
npm run tauri:build:linux
```

Output: `src-tauri/target/release/bundle/appimage/` → `.AppImage`
Output: `src-tauri/target/release/bundle/deb/` → `.deb`

### Platform Build Matrix

| Platform | Runner | Output Formats | Arch |
|---|---|---|---|
| macOS Apple Silicon | macOS 14+ | `.dmg`, `.app` | arm64 |
| macOS Intel | macOS 13 | `.dmg`, `.app` | x86_64 |
| macOS Universal | macOS 14+ | `.dmg`, `.app` | arm64 + x86_64 |
| Windows | Windows 10/11 | `.exe` (NSIS), `.msi` (WiX) | x86_64 |
| Linux | Ubuntu 22.04+ | `.AppImage`, `.deb` | x86_64 |

> **Note:** Tauri does not support cross-compilation between platforms.
> macOS builds must run on macOS, Windows builds on Windows, Linux builds on Linux.
> Use GitHub Actions for automated cross-platform builds.

### Rust Release Profile (`Cargo.toml`)

```toml
[profile.release]
panic = "abort"       # smaller binary
codegen-units = 1     # better optimization
lto = true            # link-time optimization
opt-level = "s"       # optimize for size
strip = true          # strip debug symbols
```

---

## CI/CD — GitHub Actions

File: `.github/workflows/release.yml`

### Trigger

```bash
# Tag a release
git tag v0.1.0
git push origin v0.1.0

# Or trigger manually from GitHub Actions UI
```

### Build Matrix

| Job | Runner | Target |
|---|---|---|
| macOS Apple Silicon | `macos-latest` | `aarch64-apple-darwin` |
| macOS Intel | `macos-13` | `x86_64-apple-darwin` |
| macOS Universal | `macos-latest` | `universal-apple-darwin` |
| Windows | `windows-latest` | `x86_64-pc-windows-msvc` |
| Linux | `ubuntu-22.04` | `x86_64-unknown-linux-gnu` |

All artifacts are uploaded as a **draft GitHub Release** for review before publishing.

### Optional Code Signing Secrets

Add these in GitHub → Repository → Settings → Secrets → Actions:

| Secret | Platform | Purpose |
|---|---|---|
| `APPLE_CERTIFICATE` | macOS | Base64-encoded `.p12` certificate |
| `APPLE_CERTIFICATE_PASSWORD` | macOS | Certificate password |
| `APPLE_SIGNING_IDENTITY` | macOS | e.g. `Developer ID Application: Name (TEAMID)` |
| `APPLE_ID` | macOS | Apple Developer account email |
| `APPLE_PASSWORD` | macOS | App-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | macOS | 10-character team identifier |
| `TAURI_SIGNING_PRIVATE_KEY` | Windows | Ed25519 private key for update signing |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Windows | Key password |

Without signing, installers still work but macOS shows a Gatekeeper warning and Windows shows SmartScreen.

---

## Code Quality

### ESLint (`eslint.config.js`)

ESLint 9 flat config with TypeScript and Prettier integration:

```bash
npm run lint          # check
npm run lint:fix      # auto-fix
```

Rules enforced:
- `@typescript-eslint/recommended`
- `@typescript-eslint/consistent-type-imports` — enforces `import type`
- `@typescript-eslint/no-unused-vars` — error (ignores `_` prefixed params)
- `no-console` — warns (allows `console.warn` and `console.error`)
- `prettier/prettier` — formatting as lint errors

### Prettier (`.prettierrc`)

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

```bash
npm run format        # format all files
npm run format:check  # check without writing
```

### Husky Git Hooks

**pre-commit** — runs `lint-staged`:
- TypeScript/HTML files → ESLint fix
- All source files → Prettier format

**commit-msg** — enforces Conventional Commits:

```
feat(sales): add invoice PDF export
fix(auth): handle token expiry edge case
chore(deps): update angular to 19.1
refactor(store): simplify auth signal mutations
```

Valid types: `feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore` | `ci` | `build` | `revert`

### TypeScript Strict Mode (`tsconfig.json`)

All strict flags enabled:
- `strict: true`
- `noImplicitOverride: true`
- `noPropertyAccessFromIndexSignature: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `strictInjectionParameters: true`
- `strictInputAccessModifiers: true`
- `strictTemplates: true`

---

## Environment Configuration

| File | Used When | `production` | `apiBaseUrl` |
|---|---|---|---|
| `environment.ts` | Default (replaced at build) | `false` | `http://localhost:3000/api/v1` |
| `environment.dev.ts` | `ng serve` / `ng build --configuration development` | `false` | `http://localhost:3000/api/v1` |
| `environment.prod.ts` | `ng build --configuration production` | `true` | `/api/v1` |

File replacement is configured in `angular.json` under `fileReplacements`.

---

## NPM Scripts Reference

| Script | Description |
|---|---|
| `npm start` | Angular dev server at `http://localhost:4200` |
| `npm run build` | Development build |
| `npm run build:prod` | Production build with optimizations |
| `npm run tauri:dev` | Tauri desktop dev (starts Angular + Rust watcher) |
| `npm run tauri:build` | Tauri production build (current platform) |
| `npm run tauri:build:mac-arm` | macOS Apple Silicon `.dmg` |
| `npm run tauri:build:mac-intel` | macOS Intel `.dmg` |
| `npm run tauri:build:mac-universal` | macOS Universal binary `.dmg` |
| `npm run tauri:build:windows` | Windows `.exe` + `.msi` |
| `npm run tauri:build:linux` | Linux `.AppImage` + `.deb` |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all source files |
| `npm run format:check` | Prettier check without writing |
| `npm test` | Karma unit tests |

---

## Troubleshooting

### `npm install` fails with `errno -88` (esbuild)
The project folder is on an iCloud-synced Desktop. Move it off iCloud:
```bash
cp -r ~/Desktop/pranay/Nava_Vyapar_Frontend ~/Projects/
cd ~/Projects/Nava_Vyapar_Frontend
npm install
```

### `cargo` not found when running `tauri:dev`
Rust is installed but not on PATH in the current shell:
```bash
source "$HOME/.cargo/env"
npm run tauri:dev
```
Add `source "$HOME/.cargo/env"` to your `~/.zshrc` to make it permanent.

### Tauri icon error — `is not RGBA`
Icons must be RGBA PNG (color type 6). Regenerate using the Python script in the project or run:
```bash
sips -s format png --setProperty hasAlpha yes icon.png --out icon_rgba.png
```

### `productName` with spaces breaks DMG bundling
Tauri's `bundle_dmg.sh` does not handle spaces in `productName`. Keep `productName` as a single word (e.g. `NavaVyapar`) and set the display name in `app.windows[].title`.

### Angular Material `define-palette` undefined
The old M2 theming API was removed in Material v18+. Use `mat.theme()` mixin as configured in `styles.scss`.

### `@use` must be first in SCSS
`@use '@angular/material'` must appear before all other rules including `@tailwind` directives.

---

## License

Proprietary — All rights reserved © 2025 Nava Vyapar.
