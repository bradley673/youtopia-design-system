# Publishing this to Claude Design (via Claude Code Web)

This repo is ready. It just needs to be pushed to GitHub, then opened in
**Claude Code Web** — a browser Claude Code that can do the one-time login
`/design-sync` requires (no local Node/CLI install needed).

## 1. Create an empty GitHub repo
Go to <https://github.com/new> and create a repo named **`youtopia-design-system`**.
- Visibility: **Private** is fine.
- **Do NOT** tick "Add a README / .gitignore / license" — the repo must start empty
  so the push below isn't rejected.

## 2. Push this folder to it
Open a terminal in this folder (`C:\Users\Bradley Webb\youtopia-design-system`)
and run — replacing `YOUR-USERNAME`:

```bash
git remote add origin https://github.com/YOUR-USERNAME/youtopia-design-system.git
git push -u origin main
```

(If a login prompt appears, sign in to GitHub in the browser window it opens.)

## 3. Open it in Claude Code Web
1. Go to <https://claude.ai/code>.
2. Connect / select the **`youtopia-design-system`** GitHub repo you just pushed.
3. Wait for the workspace to load the files.

## 4. Run the sync
In that Claude Code Web session, type:

```
/design-sync
```

Approve the design-system access prompt when it appears. It reads the tokens and
components in this repo and publishes them.

## 5. Check Claude Design
Reopen the **Design system** dropdown in the Claude Design app — **Youtopia**
now appears there instead of just "None". Select it for any project.

---

### What's in here
- `tokens/` — colour, type, spacing, motion, z-index, and chart-palette tokens
  (CSS variables + JSON), with the brand fonts embedded.
- `src/components/` — 32 React components.
- `src/examples/` — 3 composed screens (Dashboard, SettingsForm, Invoices).

Re-run `/design-sync` any time you change these to push an update.
