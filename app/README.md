# Youtopia Practice — practice management app

A working practice management system built on the [Youtopia design system](../README.md),
driven by two data sources the practice already maintains:

- **The client work schedule** (Google Sheet) — year-end accounts tracker,
  personal tax tracker, and P11D benefits tracker.
- **The Pixie exports** — `pixie-clients-*.csv` (client directory: type, manager,
  year end, confirmation statement dates) and `pixie-contacts-*.csv`
  (people, AML status, onboarding).

## Views

- **Dashboard** — open jobs, filing deadlines within two months, overdue banner,
  jobs by stage, workload by manager, season progress for accounts / SA / P11D.
- **Accounts jobs** — the year-end tracker with deadline countdowns, stage badges,
  and filters by stage, manager and open/filed scope.
- **Personal tax** — the SA tracker with season progress and invoice flags.
- **P11D benefits** — the benefits-in-kind tracker with value and Class 1A NI totals.
- **Clients** — the searchable Pixie directory. Click any client for a detail view:
  contacts with AML status, linked accounts and personal tax jobs, statutory dates.

## Run it

```bash
cd app
npm install
npm run dev        # local dev server
npm run build      # dist/ plus a self-contained dist/youtopia-practice.html
```

## Data

The repo ships with a **fictional sample dataset**
(`src/data/practice-data.json`). This repository is public, so real client data
must never be committed.

To load the real practice data locally:

```bash
node scripts/build-data.mjs pixie-clients.csv pixie-contacts.csv schedule.txt \
  src/data/practice-data.json aliases.json
npm run build   # then keep the JSON out of git (see .gitignore)
```

- `schedule.txt` is the work schedule sheet exported as text (the pipe-delimited
  table dump the Drive connector produces).
- `aliases.json` (optional, gitignored) maps schedule short names to Pixie full
  names where the automatic matcher can't, e.g.
  `{ "HG Landscapes": "H G Landscapes Woburn Limited" }`.
- The script deliberately **drops** NI numbers, UTRs, dates of birth and PAYE
  references from the output — the app doesn't need them and they shouldn't sit
  in a browser bundle.

After swapping the data in, `git checkout -- src/data/practice-data.json`
restores the sample before committing.
