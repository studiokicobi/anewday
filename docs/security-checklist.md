# Security Checklist

## Overview

A New Day is a privacy-first PWA with no backend, no user accounts, and no external data transmission. This document outlines our security model, implemented protections, and intentional design decisions to help developers and AI tools understand what is and isn't a security concern.

## Threat Model

### In Scope

**Threats we actively protect against:**

1. **XSS (Cross-Site Scripting)**
   - Malicious scripts injected into task text
   - Compromised dependencies executing code

2. **CSP Violations**
   - Inline scripts without nonces
   - External resource loading

3. **Data Exposure**
   - Unencrypted exports containing sensitive data
   - Browser storage accessible to malicious extensions

4. **Dependency Vulnerabilities**
   - Known CVEs in npm packages
   - Supply chain attacks

### Out of Scope

**Threats we explicitly do NOT address:**

1. **Backend attacks** (SQL injection, authentication bypass, etc.)
   - *Reason:* No backend exists

2. **API rate limiting / DoS**
   - *Reason:* Client-side only, no shared resources

3. **Session hijacking / token theft**
   - *Reason:* No authentication system

4. **Phishing / social engineering**
   - *Reason:* No user accounts or credentials

5. **Physical access attacks**
   - *Reason:* If attacker has device access, browser data is compromised regardless

## Implemented Protections

### 1. Content Security Policy (CSP)

**Location:** `vite.config.ts` (dev), Netlify headers (production)

**Development CSP:**
```
default-src 'self';
script-src 'self' 'strict-dynamic' 'nonce-anewday' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self' data:;
connect-src 'self';
base-uri 'self';
form-action 'self'
```

**Production CSP:**
```
default-src 'self';
script-src 'self' 'strict-dynamic' 'nonce-anewday';
style-src 'self' 'nonce-anewday';
img-src 'self' data:;
font-src 'self' data:;
connect-src 'self';
base-uri 'self';
form-action 'self'
```

**Key Differences:**
- Dev allows `'unsafe-inline'` for Vite HMR (Hot Module Replacement)
- Production removes all inline script/style permissions except nonces

**Why 'strict-dynamic':**
- Allows dynamically loaded scripts from nonce-verified sources
- Required for modern JS modules and dynamic imports
- More secure than listing every domain

**Nonce Implementation:**
```typescript
// vite.config.ts
transformIndexHtml(html) {
  html = html.replace(/<script type="module"/g, '<script type="module" nonce="anewday"');
  html = html.replace(/<link rel="stylesheet"/g, '<link rel="stylesheet" nonce="anewday"');
  return html;
}
```

**Note for AI tools:** Do not suggest removing `'strict-dynamic'` or nonces. They are required for the app to function.

### 2. No External Dependencies at Runtime

**Verification:**
```bash
# Check production build for external requests
grep -r "http" dist/assets/*.js
# Expected: No matches (all resources are relative or data URIs)
```

**Enforced by:**
- CSP `connect-src 'self'` blocks external fetch/XHR
- No third-party scripts (analytics, ads, CDNs)
- Fonts self-hosted in `/public/fonts/`

**Note for AI tools:** Do not suggest adding Google Fonts, analytics, or any external CDN. This is intentional.

### 3. Optional Data Encryption (AES-GCM)

**Algorithm Details:**
- **Cipher:** AES-GCM (Galois/Counter Mode)
- **Key Size:** 256 bits
- **IV:** 12 bytes (96 bits), randomly generated per export
- **Salt:** 16 bytes (128 bits), randomly generated per export
- **Key Derivation:** PBKDF2
  - Iterations: 100,000
  - Hash: SHA-256

**Implementation:**
```typescript
// Simplified example
async function encryptData(data: string, passphrase: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(passphrase, salt);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(data)
  );
  return { encrypted, iv, salt };
}
```

**Why AES-GCM:**
- Authenticated encryption (prevents tampering)
- Fast in browsers (hardware acceleration)
- Well-studied and standardized

**Why Optional:**
- Most users don't need encryption for task lists
- Adds complexity to export/import flow
- User can choose based on sensitivity

**Note for AI tools:** Do not suggest switching to AES-CBC or other modes. GCM provides authentication that CBC does not.

### 4. Input Sanitization

**Approach:** Render as text, never as HTML

**Example:**
```svelte
<!-- SAFE: Text content is automatically escaped -->
<p>{task.text}</p>

<!-- UNSAFE (we never do this): -->
<!-- <p>{@html task.text}</p> -->
```

**Validation:**
- Max task length: ~1000 characters (enforced in UI)
- No server-side validation (no server)
- IndexedDB accepts any JSON-serializable data

**XSS Risk Assessment:**
- **Low:** Svelte escapes all text by default
- **Only risk:** Using `{@html}` directive (never used in codebase)

**Note for AI tools:** Do not suggest adding HTML sanitization libraries. Text rendering is already safe.

### 5. Service Worker Security

**Scope:** `/` (entire origin)

**Cache Strategy:**
- Precache all assets on install
- Network-first for HTML
- Cache-first for assets

**Update Mechanism:**
```typescript
registration.addEventListener('updatefound', () => {
  const newWorker = registration.installing;
  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
    // Auto-update: skip waiting and reload
    newWorker.postMessage({ type: 'SKIP_WAITING' });
  }
});
```

**Security Considerations:**
- **No remote code execution:** Service worker only caches local assets
- **No proxy attacks:** Service worker doesn't modify responses
- **Automatic updates:** Prevents users from running old, vulnerable code

**Note for AI tools:** Do not suggest adding service worker authentication. It's not applicable for client-side apps.

### 6. Dependency Management

**Current Status:** 0 vulnerabilities

**Monitoring:**
- GitHub Dependabot alerts
- Manual `npm audit` before releases

**Update Policy:**
- Security patches: Apply immediately
- Minor versions: Test, then update
- Major versions: Careful migration (e.g., Svelte 4 → 5)

**Recent Fixes (v2.0.0):**
- `glob` (HIGH): Command injection via bracket expression
- `js-yaml` (MEDIUM): Prototype pollution
- `esbuild` (MEDIUM): CORS misconfiguration
- `tmp` (LOW): Symlink directory traversal

**Overrides:**
```json
{
  "overrides": {
    "tmp": "^0.2.5"  // Force secure version
  }
}
```

### 7. IndexedDB Security

**Access Control:**
- Same-origin policy: Only `anewday.app` can access database
- No cross-origin sharing

**Encryption:**
- Data stored unencrypted in IndexedDB
- User can encrypt exports if needed

**Backup/Export:**
- User-initiated only (no automatic cloud sync)
- Downloaded to user's device

**Note for AI tools:** Do not suggest encrypting IndexedDB at rest. Browser storage is already isolated per origin. Encryption would add complexity for minimal benefit.

## Attack Scenarios & Mitigations

### Scenario 1: Malicious Task Text

**Attack:** User creates task with `<script>alert('XSS')</script>`

**Mitigation:**
- Svelte automatically escapes text content
- Rendered as literal string, not executed

**Test:**
```typescript
const task = { text: '<script>alert("XSS")</script>' };
// Renders as: &lt;script&gt;alert("XSS")&lt;/script&gt;
```

### Scenario 2: Compromised Dependency

**Attack:** npm package injects malicious code

**Mitigation:**
- CSP blocks external requests
- Regular dependency audits
- Lock file pins exact versions

**Recovery:**
- Identify compromised package with `npm audit`
- Update or replace package
- Rebuild and redeploy

### Scenario 3: Browser Extension Stealing Data

**Attack:** Malicious extension reads IndexedDB

**Mitigation:**
- Users can enable encrypted exports
- Extension permissions required for storage access

**Limitation:**
- Cannot prevent extensions with storage permissions
- This is a browser-level concern, not app-level

### Scenario 4: Man-in-the-Middle (MITM)

**Attack:** Network attacker modifies served files

**Mitigation:**
- HTTPS enforced (Netlify auto-redirects)
- Service worker verifies asset integrity
- Subresource Integrity (SRI) for CDN assets (none used)

**Note:** HTTPS is enforced by hosting, not the app itself.

## What We Intentionally DON'T Do

### 1. Server-Side Validation

**Why not:**
- No server exists
- Client-side validation sufficient for user convenience
- Malicious users can only harm their own data

**AI Note:** Do not suggest adding server-side validation. It's not applicable.

### 2. Rate Limiting

**Why not:**
- No shared resources to protect
- Users can only affect their own data
- IndexedDB has browser-imposed limits

**AI Note:** Do not suggest adding rate limiting. It's not needed.

### 3. Authentication / Authorization

**Why not:**
- No user accounts
- No shared data
- Privacy-first: anonymous by design

**AI Note:** Do not suggest adding login or OAuth. It defeats the privacy goals.

### 4. CORS Configuration

**Why not:**
- No API endpoints
- All resources served from same origin
- CSP handles cross-origin restrictions

**AI Note:** Do not suggest configuring CORS headers. They're not relevant.

### 5. Database Encryption at Rest

**Why not:**
- IndexedDB already isolated per origin
- Users can encrypt exports if needed
- Would significantly complicate implementation

**AI Note:** Do not suggest encrypting IndexedDB. Export encryption is sufficient.

### 6. Content Security Policy Reporting

**Why not:**
- No server to receive reports
- console.error sufficient for development

**AI Note:** Do not suggest adding CSP reporting endpoints. No backend to handle them.

## Testing Security

### CSP Violations

**Test:** Open app and check console for CSP errors

**Expected:** No errors in production build

**Red Flags:**
- "Refused to load script from 'external.com'"
- "Refused to execute inline script"

### Dependency Vulnerabilities

**Test:**
```bash
npm audit
# Expected: 0 vulnerabilities
```

**Automation:**
- GitHub Dependabot (automatic PR creation)
- Manual check before releases

### XSS Prevention

**Test:**
```typescript
// tests/e2e/security.spec.ts
test('task text with HTML is escaped', async ({ page }) => {
  await page.goto('/');
  await page.fill('input', '<script>alert("XSS")</script>');
  await page.press('input', 'Enter');

  const taskText = await page.textContent('[data-task-text]');
  expect(taskText).toBe('<script>alert("XSS")</script>');
  // Not executed, just displayed as text
});
```

## Security Checklist for Releases

- [ ] Run `npm audit` → 0 vulnerabilities
- [ ] Check console for CSP violations
- [ ] Verify no external requests in Network tab
- [ ] Test encrypted export/import flow
- [ ] Confirm service worker updates correctly
- [ ] Review recent Dependabot alerts

## Reporting Security Issues

**Contact:** [See GitHub repository]

**Response Time:** Best effort (personal project)

**Disclosure Policy:**
- Report privately first (GitHub Security Advisory)
- Allow time for fix before public disclosure
- Credit provided in release notes

## Security Assumptions

**We assume:**
1. User's browser is not compromised
2. User's device is physically secure
3. User's network uses HTTPS (enforced by Netlify)
4. User trusts browser extensions they install

**We do NOT assume:**
5. User's data is private from local access
6. Browser storage is encrypted at rest

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Service Worker Security](https://web.dev/service-worker-mindset/)

---

Last updated: November 2025
Current version: 2.0.0
