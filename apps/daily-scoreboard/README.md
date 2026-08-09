# Daily Scoreboard 🏟️

A mobile-first PWA for tracking daily **calories**, **protein** and **water**
against your targets — dark scoreboard styling with clay / chartreuse / sky
accents, offline-first, installable on iPhone, with push notification
reminders that fire even when the app is closed.

No build step: plain HTML/CSS/JS, deployed straight to GitHub Pages.

## Features

- **Three-ring scoreboard** for today's calories, protein and water, with
  remaining amounts and an on-pace/behind-pace protein indicator.
- **Rest day / training day** toggle (1,900 / 2,300 kcal, both editable).
- **Quick-add buttons** for common dairy-free items (editable in Settings)
  plus custom entries; one-tap water logging (+250/+500/+750ml).
- **Undo** on every log action; delete anything from today's log.
- **History**: 7-day averages, 14-day charts per metric with target lines,
  day-by-day list with target badges, and a perfect-day streak counter.
- **Smart nudges** shown in-app, and delivered as **push notifications**
  via a tiny free Cloudflare Worker (see [`worker/`](worker/README.md)):
  hydration gaps, protein behind pace, target hit early, under target late.
- **Data export/import** as JSON; everything stored locally on your phone.

## Setup

### 1. Enable GitHub Pages (once)

Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The workflow in `.github/workflows/deploy-pages.yml` deploys automatically on
every push to `main` that touches this folder. The app will be at:

```
https://<user>.github.io/<repo>/
```

### 2. Install on your iPhone

Open the URL in Safari → **Share** → **Add to Home Screen**. Open it from the
Home Screen icon — that unlocks full-screen mode and (iOS 16.4+) web push.

### 3. Push notifications (optional)

Deploy the free reminder worker — full instructions in
[`worker/README.md`](worker/README.md) — then paste its URL into
**Settings → Notifications** in the app and tap **Enable notifications**.

## How notifications work

The app syncs your day's totals to the worker whenever you log something.
A cron job on the worker checks the reminder rules every 20 minutes in your
timezone and sends a Web Push. The service worker then fetches the
notification text and shows it — so reminders arrive with the app fully
closed. VAPID keys are auto-generated server-side on first use.
