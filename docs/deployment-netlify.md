# Netlify Deployment Guide

This guide walks through deploying **A New Day** to Netlify with a custom domain.

## Prerequisites

- ✅ Netlify account (free tier)
- ✅ Public GitHub repository
- ✅ Custom domain (ready to configure DNS)
- ✅ Production-ready build (`npm run build` succeeds)

## Step 1: Connect GitHub Repository

### Option A: Netlify Dashboard (Recommended)

1. **Log in to Netlify** at https://app.netlify.com
2. **Click "Add new site"** → "Import an existing project"
3. **Connect to Git provider**: Choose GitHub
4. **Authorize Netlify**: Grant access to your repositories
5. **Select repository**: `anewday` (or your repo name)

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
```

## Step 2: Configure Build Settings

When prompted, use these settings:

| Setting               | Value           |
| --------------------- | --------------- |
| **Build command**     | `npm run build` |
| **Publish directory** | `dist`          |
| **Base directory**    | (leave empty)   |

Or configure in `netlify.toml` (recommended):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Step 3: Environment Variables (Optional)

For this project, **no environment variables are needed** - the app runs entirely client-side.

If you add environment variables later:

- Go to **Site settings** → **Environment variables**
- Prefix client-side variables with `VITE_` (e.g., `VITE_API_KEY`)

## Step 4: Deploy

1. **Push to GitHub**: Netlify will automatically detect the push
2. **Wait for build**: Monitor at `https://app.netlify.com/sites/[your-site]/deploys`
3. **Build succeeds**: Site is live at `https://[random-name].netlify.app`

### Manual Deploy (if needed)

```bash
npm run build
netlify deploy --prod --dir=dist
```

## Step 5: Custom Domain Setup

### Add Your Domain

1. **Go to Site settings** → **Domain management**
2. **Click "Add custom domain"**
3. **Enter your domain**: `anewday.app` (or your domain)
4. **Verify ownership** (if prompted)

### Configure DNS

You have two options:

#### Option A: Netlify DNS (Recommended)

Netlify manages everything automatically:

1. **Use Netlify nameservers** (shown in domain settings)
2. **Update your domain registrar**:
   - Point nameservers to Netlify's (e.g., `dns1.p01.nsone.net`)
   - Wait for propagation (up to 48 hours, usually < 1 hour)

Benefits:

- ✅ Automatic SSL certificate
- ✅ Global CDN
- ✅ Automatic DNS management

#### Option B: External DNS

Keep your current DNS provider:

1. **Add A record**: Point to Netlify's load balancer IP
   - Go to **Domain settings** → **DNS records**
   - Copy the IP address shown
2. **Add in your DNS provider**:
   ```
   Type: A
   Name: @ (or root)
   Value: [Netlify IP from dashboard]
   ```
3. **Add CNAME for www** (optional):
   ```
   Type: CNAME
   Name: www
   Value: [your-site].netlify.app
   ```

### Enable HTTPS

Netlify automatically provisions SSL certificates via Let's Encrypt:

1. **Wait for DNS propagation** (check at https://dnschecker.org)
2. **SSL certificate auto-provisions** (usually within 1 hour)
3. **Verify**: Visit `https://anewday.app`
4. **Force HTTPS** (optional):
   - Site settings → Domain management
   - Enable "Force HTTPS redirect"

## Step 6: Configure Headers (for PWA)

Create or update `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/manifest.webmanifest"
  [headers.values]
    Content-Type = "application/manifest+json"
    Cache-Control = "public, max-age=3600"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Commit and push** - Netlify will redeploy with new headers.

## Step 7: Verify PWA Installation

After deployment:

1. **Test on mobile**: Visit your domain on iOS/Android
2. **Install prompt appears**: Browser should offer "Install" or "Add to Home Screen"
3. **Check Lighthouse**:
   ```bash
   npx lighthouse https://anewday.app --view
   ```
4. **Verify offline**:
   - Install the app
   - Enable airplane mode
   - App should still load

## Step 8: Post-Deployment Checklist

- [ ] Site loads at custom domain
- [ ] HTTPS works (green padlock)
- [ ] PWA installable (test on mobile)
- [ ] Service worker registered (check DevTools → Application)
- [ ] Offline mode works
- [ ] Tasks persist across sessions
- [ ] Midnight reset functions correctly
- [ ] Dark mode works
- [ ] All Settings sections functional

## Ongoing Deployment

### Automatic Deploys

Every push to `main` branch automatically:

1. Triggers Netlify build
2. Runs `npm run build`
3. Deploys to production
4. Notifies via email/webhook (if configured)

### Deploy Previews

Pull requests get preview URLs:

- Each PR gets unique URL: `https://deploy-preview-[PR#]--[site].netlify.app`
- Test changes before merging
- Automatic cleanup when PR closes

### Rollback

If something breaks:

1. **Go to Deploys** in Netlify dashboard
2. **Find previous working deploy**
3. **Click "Publish deploy"**
4. Site instantly reverts

Or via CLI:

```bash
netlify rollback
```

## Troubleshooting

### Build Fails

**Check build logs** in Netlify dashboard:

- **Missing dependencies**: Ensure `package-lock.json` is committed
- **Node version**: Verify `NODE_VERSION = "20"` in netlify.toml
- **Build command**: Ensure it matches local: `npm run build`

### Site Doesn't Update

- **Clear cache**: Site settings → Build & deploy → Clear cache and retry
- **Force deploy**: Push empty commit: `git commit --allow-empty -m "trigger deploy"`
- **Check build logs**: Ensure build succeeded

### Custom Domain Not Working

- **DNS propagation**: Wait up to 48 hours, check at https://dnschecker.org
- **SSL pending**: Let's Encrypt needs DNS to resolve first
- **Nameservers**: Verify they match Netlify's exactly

### PWA Not Installing

- **HTTPS required**: Must use custom domain with SSL
- **Service worker scope**: Ensure `sw.js` is at root (`/sw.js`)
- **Manifest**: Check `/manifest.webmanifest` loads correctly
- **Cache headers**: Verify SW has `Cache-Control: max-age=0`

## Performance Monitoring

### Netlify Analytics (Optional - Paid)

- Server-side analytics (privacy-friendly)
- No JavaScript required
- $9/month per site

### Free Alternatives

Since A New Day prioritizes privacy:

- Use **Lighthouse CI** in GitHub Actions
- Monitor **Core Web Vitals** via Chrome UX Report
- Check **uptime** with external services (UptimeRobot, etc.)

## Budget Tracking

### Netlify Free Tier Limits

- ✅ **Bandwidth**: 100 GB/month (your app is ~460 KB, so ~200k+ new visitors)
- ✅ **Build minutes**: 300/month (you use ~1s per build)
- ✅ **Sites**: Unlimited
- ✅ **Deploy previews**: Unlimited

**Your app will comfortably fit the free tier** unless you go viral.

### Monitor Usage

- Dashboard → Team settings → Usage
- Set up email alerts for 80% usage

## Next Steps

1. ✅ Complete initial deployment
2. ⏭️ Set up status badge in README
3. ⏭️ Configure DNS and SSL
4. ⏭️ Test PWA installation on real devices
5. ⏭️ Share with users!

## Status Badge (Optional)

Add to README.md:

```markdown
[![Netlify Status](https://api.netlify.com/api/v1/badges/[YOUR-SITE-ID]/deploy-status)](https://app.netlify.com/sites/[YOUR-SITE-NAME]/deploys)
```

Get your site ID from: Site settings → General → Site details

---

**Ready to deploy?** Start with Step 1 and you'll be live in ~15 minutes! 🚀
