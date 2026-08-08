# CampingMeow 🏕️

A tiny Node + TypeScript tool that scouts **ReserveCalifornia** for open campsites
matching date patterns you care about — e.g. *"any 1-night Saturday→Sunday at
Crystal Cove's Moro Campground in the next 6 months."*

It only **reads** availability and prints what's open. You still book on the
official site. See [`API.md`](./API.md) for how the (undocumented) API works.

## Setup

```bash
cd campingmeow
npm install
```

Requires Node 20+.

## Use

Scan for the openings defined in `src/config.ts`:

```bash
npm run scan
```

Example output:

```
Scanning Crystal Cove — Moro Campground (tent/RV) (facility 447) ... bookable 2026-07-24→2027-01-23, 50 web-bookable sites
  Sat 2026-09-12  (1n, Sat→Sun (1 night))  2 sites: Standard Campsite #21, Premium Hook Up (E/W) Campsite #3
  Sat 2026-10-03  (1n, Sat→Sun (1 night))  5 sites: ...
```

## Configure what to look for

Everything is in [`src/config.ts`](./src/config.ts):

- **`locations`** — one entry per campground (a `facilityId`). Defaults to Crystal
  Cove Moro Campground (`447`).
- **`patterns`** — a check-in day-of-week + a number of nights. Ships with
  `Sat→Sun (1 night)`. Uncomment `Fri→Sun (2 nights)` for full weekends.
- **`horizonDays`** — how far ahead to look (max ~180; the API only lets you book
  6 months out).
- **`earliest`** — optional earliest check-in date.

### Finding IDs for other parks

```bash
npm run find -- "San Onofre"
```

prints each matching park's `PlaceId` and the `facilityId` of every campground
inside it. Drop the one you want into `config.ts`.

## Running it on a schedule (optional next step)

`npm run scan` is a one-shot check. To turn it into a real cancellation watcher,
run it on a cron / launchd timer every 15–30 minutes and have it notify you only
when something *new* appears. That layer (state + email/SMS/push) isn't built yet
— it's the natural next increment.

## Etiquette / caveats

- These endpoints are undocumented and can change; the client reads the current
  API base from `reservecalifornia.com/config.json` so it survives host changes.
- Be polite: there's a `requestDelayMs` between calls. Don't hammer it.
- This is for personal use to save yourself from refreshing a website by hand.
