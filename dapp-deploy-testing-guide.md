# Next.js dApp Deployment to Cloudflare

## Step-by-Step Implementation & Testing Guide

**Document Version:** 1

**Changes:**

- n/a

---

## Table of Contents

1. Phase 1: Pre-Deployment Preparation
2. Phase 2: Cloudflare Pages Configuration
3. Phase 3: Security & Bot Detection Setup
4. Phase 4: Cache Configuration & Warming
5. Phase 5: Sentry Configuration (Optional, Recommended)
6. Phase 6: Testing & Validation
7. Final Testing Checklist

---

## Phase 1: Pre-Deployment Preparation

### Step 1.1: Verify Local Environment

```bash
# Check Node.js version (16+ required)
node --version
# Expected: v20.9+

# Check yarn version
yarn --version
# Expected: 1.22+ or 4.x (depending on setup)
```

### Step 1.2: Check Next.js Configuration (ignore)

`next.config.js` (example):

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Critical for Cloudflare Pages deployment
  output: "export",

  // Required with static export
  images: {
    unoptimized: true,
  },

  // Optional: Strict build checks
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Optimize for edge
  compress: true,

  // Important for Web3 dApps
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### Step 1.3: Create Environment Files

`.env.local` (for local dev):

```env
# Sentry configuration (optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

`.env.production` (optional):

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_AUTH_TOKEN=your_sentry_auth_token
```

Reference file for Cloudflare (`.env.cloudflare`, not committed):

To be set in Cloudflare Pages UI

```env
# To be set in Cloudflare Pages UI
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

### Step 1.4: Test Local Build

```bash
# Install dependencies
yarn install --frozen-lockfile

# Create production build locally
yarn build

# Verify output directory
ls -la out/
```

Expected: `out/` contains `index.html`, other `*.html`, and `_next/` with static assets.

### Step 1.5: Test Local Static Export

```bash
# Serve static export
npx http-server out/ -p 3000

# Or with yarn + a script if you prefer:
# package.json
# "scripts": { "serve:out": "http-server out -p 3000" }
yarn serve:out
```

Open `http://localhost:3000` and fully test the dapp (navigation, wallet connection, etc.).

---

## Phase 2: Cloudflare Pages Configuration

### Step 2.1: Create/Confirm Cloudflare Pages Project

1. Go to Cloudflare Dashboard → Pages.
2. If project already exists, open it. Otherwise:
   - Click "Create a project" → "Connect to Git".
   - Select the existing GitHub repo (already set up).

### Step 2.2: Build Settings (Using Yarn)

In the Pages project build configuration:

- **Production branch**: `main`
- **Framework preset**: `Next.js`
- **Build command**:

```bash
yarn install --frozen-lockfile && yarn build
```

- **Build output directory**: `out`
- **Root directory**: `/` (or your app path in a monorepo)

Save and deploy.

### Step 2.3: Configure Environment Variables (Sentry)

In Cloudflare Dashboard → Pages → your project → **Settings → Environment variables**:

Production variables:

| Name                     | Value                                   |
| ------------------------ | --------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://your-key@sentry.io/project-id` |
| `SENTRY_AUTH_TOKEN`      | Your Sentry auth token                  |

Save, then trigger a new deployment from the Deployments tab.

### Step 2.4: Custom Domain

1. Pages project → **Custom domains** → "Set up a custom domain".
2. Enter `dapp.yourdomain.com` (or similar).
3. Follow instructions to add DNS record if needed (usually CNAME to `<project>.pages.dev`).
4. Wait for SSL to become active, confirm HTTPS works.

### Step 2.5: Runtime Compatibility Flags

Pages project → **Settings → Functions**:

- Enable compatibility flags:
  - `nodejs_compat`
  - `streams_enable_constructors`

Apply to Production (and Preview if used).

---

## Phase 3: Security & Bot Detection Setup

### Step 3.1: Access WAF

Domain → **Security → WAF**.

### Step 3.2: WAF Custom Rules

**Rule 1 – Allow Verified Bots**

- Name: `Allow Verified Bots`
- Expression:

```text
(cf.bot_management.verified_bot)
```

- Action: **Skip** all remaining custom rules
- Priority: 1

**Rule 2 – Block Definite Bots**

- Name: `Block Definite Bots`
- Expression:

```text
(cf.bot_management.score eq 1)
```

- Action: **Block**
- Priority: 2

**Rule 3 – Challenge Suspicious Traffic**

- Name: `Challenge Suspicious Traffic`
- Expression:

```text
(cf.bot_management.score gt 1 and cf.bot_management.score lt 30)
```

- Action: **Managed Challenge**
- Priority: 3

Save/deploy all rules.

### Step 3.3: DDoS Protection

Domain → **Security → DDoS**:

- Sensitivity: **High** (adjust as needed).

### Step 3.4: Rate Limiting (Optional)

Domain → **Security → Rate Limiting**:

Example:

- Threshold: `100` requests / `10 seconds`
- Action: `Block` or `Challenge`.

---

## Phase 4: Cache Configuration & Warming

### Step 4.1: Cache Rules

Domain → **Rules → Cache Rules → Create**.

**Rule A – Static Assets Long TTL**

- Name: `Cache Next.js Static Assets`
- URL: `/_next/static/*`
- Cache TTL: `1 year`

**Rule B – HTML Pages**

- Name: `Cache HTML Pages`
- URL: `/*.html`
- Cache TTL: `1 hour`

**Rule C – Root Path**

- Name: `Cache Root Path`
- URL: `/` (or `/index.html`)
- Cache TTL: `30 minutes`

### Step 4.2: Query String Behavior

Domain → **Caching → Configuration**:

- Enable **Query String Sort**.
- Set browser cache TTL (e.g., `30 minutes`), depending on your update rhythm.

### Step 4.3: Cache Warming Script (Yarn-based workflow)

Create `scripts/warm-cdn.js`:

```javascript
#!/usr/bin/env node

const https = require("https");

const DOMAIN = process.env.DOMAIN || "https://yourdomain.com";
const CRITICAL_PATHS = [
  "/",
  "/index.html",
  "/dashboard",
  "/portfolio",
  "/api/health", // if exists
  "/_next/static/chunks/main.js",
  "/_next/static/chunks/pages/_app.js",
  "/favicon.ico",
];

async function fetchURL(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: { "User-Agent": "Mozilla/5.0 (CDN-Warmer)" },
          timeout: 10000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            resolve({
              status: res.statusCode,
              cacheStatus: res.headers["cf-cache-status"] || "UNKNOWN",
              contentLength: data.length,
            });
          });
        }
      )
      .on("error", reject);
  });
}

async function warmCache() {
  console.log(`🔥 Starting CDN cache warming for ${DOMAIN}...\n`);

  let successCount = 0;
  let failureCount = 0;

  for (const path of CRITICAL_PATHS) {
    const url = `${DOMAIN}${path}`;
    try {
      const result = await fetchURL(url);
      const statusIcon = result.status === 200 ? "✅" : "⚠️";
      const cacheIcon = result.cacheStatus === "HIT" ? "💾" : "🔄";

      console.log(
        `${statusIcon} ${cacheIcon} ${path} (${result.status}) - ${result.cacheStatus}`
      );

      if (result.status === 200) successCount++;
      else failureCount++;
    } catch (error) {
      console.log(`❌ ${path} - ${error.message}`);
      failureCount++;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n📊 Results:");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(
    `📈 Success Rate: ${(
      (successCount / (successCount + failureCount)) *
      100
    ).toFixed(2)}%`
  );

  console.log("\n✨ Cache warming complete!");
}

warmCache().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

Update `package.json` scripts:

```json
{
  "scripts": {
    "build": "next build",
    "warm:cdn": "node scripts/warm-cdn.js",
    "deploy:local": "yarn build && yarn warm:cdn"
  }
}
```

You can call `yarn warm:cdn` locally after a production deployment, or via CI.

---

## Phase 5: Sentry Configuration (Optional, Recommended)

The project already includes full Sentry integration (`sentry.client.config.ts`, `@sentry/nextjs`, etc.). No additional code changes are required.

### Step 5.1: Add Sentry Environment Variables in Cloudflare

In Cloudflare Pages → Project → **Settings → Environment variables** (Production scope):

| Name                     | Value                        |
| ------------------------ | ---------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Your DSN from Sentry project |
| `SENTRY_AUTH_TOKEN`      | Your Sentry auth token       |

Save and trigger a new deployment from the Deployments tab.

---

## Phase 6: Testing & Validation

This phase is unchanged conceptually, but all commands use **yarn**:

- Confirm deployment in Cloudflare Pages.
- Network tab: check `cf-cache-status`, status codes, JS/CSS loaded.
- Use `curl -I https://yourdomain.com` to verify headers.
- Test wallet connection and any other dApp interactions.
- Run `yarn warm:cdn` with `DOMAIN=https://yourdomain.com`.

Example:

```bash
export DOMAIN=https://yourdomain.com
yarn warm:cdn
```

---

## Final Testing Checklist

### ✅ Pre-Deployment

- [ ] `yarn build` succeeds locally.
- [ ] `out/` exists and serves correctly via `http-server` or similar.
- [ ] Sentry DSN is defined locally (if using Sentry).

### ✅ Cloudflare Pages

- [ ] Pages project points to correct repo + branch.
- [ ] Build command is:

```bash
yarn install --frozen-lockfile && yarn build
```

- [ ] Output directory: `out`.
- [ ] Custom domain configured and HTTPS is valid.
- [ ] Compatibility flags enabled: `nodejs_compat`, `streams_enable_constructors`.

### ✅ Environment Variables

- [ ] `NEXT_PUBLIC_SENTRY_DSN` set in Cloudflare Pages (Production).
- [ ] `SENTRY_AUTH_TOKEN` set in Cloudflare Pages (Production).
- [ ] New deployment triggered after env var changes.

### ✅ Security & Bot Detection

- [ ] WAF rules: allow verified bots, block score=1, challenge score 2–29.
- [ ] DDoS sensitivity on **High**.
- [ ] Rate limiting configured appropriately (if used).
- [ ] Security → Events shows no obvious false positives.

### ✅ Caching & Warming

- [ ] Cache rules:
  - Static assets: 1 year
  - HTML: 1 hour
  - Root: 30 minutes
- [ ] Query string sort enabled.
- [ ] `scripts/warm-cdn.js` exists and runs.
- [ ] `yarn warm:cdn` reports mostly `200` and many `HIT` statuses after some runs.

### ✅ Web3 Behavior

- [ ] Wallet connects in production.
- [ ] Account data fetches without CORS or network errors.
- [ ] Test transaction works.

### ✅ Sentry Integration

- [ ] `NEXT_PUBLIC_SENTRY_DSN` set in Cloudflare Pages for Production.
- [ ] `SENTRY_AUTH_TOKEN` set for build/initialization.
- [ ] Errors captured and appear in Sentry dashboard.

### ✅ Performance

- [ ] TTFB acceptable from your main regions (generally <200–300 ms).
- [ ] Cache hit ratio climbs above 80–90% after traffic / warming.
- [ ] No large blocking scripts in console or obvious performance regressions.

### ✅ Mobile & Cross-Browser

- [ ] iOS and Android: app loads, wallet connect works, layout responsive.
- [ ] Chrome, Firefox, Safari, Edge: no layout or JS issues.

---

## Rollback Plan

If critical issues discovered:

1. **Immediate**: Disable Pages deployment or revert to previous commit
2. **Dashboard**: Pages Project → Deployments → Click previous deployment → "Rollback"
3. **Git**: `git revert <commit-hash>` and push
4. **Time**: Rollback typically < 2 minutes
5. **Communication**: Notify team and client immediately

---

## Ongoing Maintenance Schedule

### Daily (Week 1)

- [ ] Monitor Analytics → check traffic patterns
- [ ] Review Security → Events for anomalies
- [ ] Check cache hit ratio

### Weekly (Week 2+)

- [ ] Review analytics for 7-day trends
- [ ] Check for error spikes
- [ ] Verify bot detection accuracy
- [ ] Test cache warming

### Monthly

- [ ] Performance audit
- [ ] Security audit
- [ ] Cost review
- [ ] User feedback review

---

## Emergency Contacts

**Cloudflare Support**: https://support.cloudflare.com/  
**Cloudflare Status**: https://www.cloudflarestatus.com/  
**Sentry Support**: https://sentry.io/support/

---

## Appendix: Useful Commands

```bash
# Check deployment
git log --oneline -5

# Rebuild locally
yarn install --frozen-lockfile && yarn build

# Test static build
npx http-server out/ -p 3000

# Run cache warmer
yarn warm:cdn

# Check environment
node --version
yarn --version

# Clear yarn cache (if needed)
yarn cache clean
```
