# EV Revival (Static GitHub Pages Website)

A production-ready, mobile-first static support website for **Vestel EV chargers only**.

## What is included
- Multi-page static site (HTML/CSS/JS), no backend.
- Mobile-friendly navigation and layout.
- Support guides for getting charger online and OCPP setup.
- Error light troubleshooting and FAQ accordions.
- Pricing page (`£3.99/month`, `14 days free`) with trial/subscription clarity.
- Placeholder Login and Billing pages (non-functional, future release).
- Basic installable web app setup with `manifest.webmanifest` + `sw.js` + `offline.html`.

## Folder structure
- `index.html` — homepage
- `features.html` — features overview
- `charger-online.html` — HS vs non-HS setup guide
- `ocpp.html` — OCPP connection guide
- `error-help.html` — light/error troubleshooting
- `faqs.html` — FAQ accordions
- `pricing.html` — pricing details
- `about.html` — first-person story
- `terms.html` — terms of use
- `privacy.html` — privacy policy draft
- `cookies.html` — cookie policy draft
- `refunds.html` — refund and cancellation policy draft
- `subscription-terms.html` — trial and subscription terms draft
- `support.html` — contact and support page
- `login.html` — placeholder login
- `billing.html` — placeholder billing portal
- `app.html` — add-to-home-screen instructions
- `offline.html` — fallback when offline
- `style.css` — site styling
- `script.js` — menu, copy buttons, back-to-top, service worker registration
- `manifest.webmanifest` — PWA metadata
- `sw.js` — static caching service worker
- `assets/icons/` — placeholder app icons

## Deploy to GitHub Pages
1. Create a new GitHub repo and upload all files from this folder.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, choose:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main` (or your branch) and `/ (root)`
4. Save and wait for GitHub Pages to publish.
5. Open the provided Pages URL.

## Set a custom domain later
1. Buy/configure your domain with your DNS provider.
2. In repo **Settings → Pages**, add your custom domain.
3. Create DNS records as prompted (usually `CNAME`/`A` records).
4. Enable HTTPS in Pages settings once certificate is issued.

## Where to edit key content
- Pricing text: `pricing.html`, `billing.html`
- FAQs: `faqs.html`
- IP/login model guidance: `charger-online.html`
- Terms/legal text: `terms.html`
- About page story: `about.html`
- Homepage summary/CTA: `index.html`

## Replace placeholder icons/logo
- Replace files in `assets/icons/` and update `manifest.webmanifest` if names/format change.
- Update brand mark/text in header sections across HTML pages.

## Login/Billing notice
`login.html` and `billing.html` are intentionally placeholders only. No real authentication, billing, or payment integration is included yet.
