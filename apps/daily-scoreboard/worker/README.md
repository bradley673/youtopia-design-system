# Daily Scoreboard — push reminder worker

A tiny Cloudflare Worker (free tier) that sends the Daily Scoreboard PWA its
push notifications, even when the app is closed:

- 💧 no water logged in 2+ hours (08:00–22:00)
- 🥩 protein under 40% of target by 3pm
- 🎯 calorie target hit early in the day (before 6pm)
- 🍽️ under 60% of calorie target by 8pm

The app posts its live totals here whenever you log something; a cron job
runs every 20 minutes, evaluates the rules in your timezone, and pushes.
VAPID keys are generated automatically on first use and stored in KV —
nothing to configure by hand.

## Deploy (one-time, ~3 minutes)

You need a free Cloudflare account and Node.js on any computer.

```bash
cd apps/daily-scoreboard/worker

# 1. Log in to Cloudflare (opens a browser)
npx wrangler login

# 2. Create the storage namespace, then paste the printed id into wrangler.toml
npx wrangler kv namespace create DATA

# 3. Deploy
npx wrangler deploy
```

The deploy prints your worker URL, e.g.
`https://daily-scoreboard-push.<your-subdomain>.workers.dev`.

## Connect the app

1. On your iPhone, open the app **from your Home Screen** (Safari → Share →
   Add to Home Screen first, if you haven't — push only works when installed).
2. Go to **Settings → Notifications**, paste the worker URL, tap
   **Enable notifications**, and allow the permission prompt.
3. Tap **Send test notification** to confirm it works.

## Notes

- Free tier limits (100k requests/day, KV, cron) are far beyond what one
  person's tracker needs.
- The worker stores only your daily totals and push subscription, keyed by a
  random client id — no account, no personal data.
- To stop notifications: the app's **Disable notifications** button, or
  `npx wrangler delete`.
