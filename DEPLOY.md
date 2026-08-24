# Radiology Rush — deployment

**Live: https://radiology-rush.netlify.app**
Admin: https://app.netlify.com/projects/radiology-rush · Repo: `KINGZ117/RADIOLOGY_RUSH`

## Publishing an update

Double-click **`Publish update.command`**. It pushes to GitHub *and* publishes to
Netlify, then prints the live URL. That is the whole workflow.

The site is deployed from this Mac via the Netlify CLI, so the repo does not need to be
connected to Netlify for updates to go out. If you would rather have every GitHub push
deploy itself, connect it once: Netlify → **Site configuration → Build & deploy →
Link repository** → pick `RADIOLOGY_RUSH`. Both routes can coexist.

## The original setup, for reference

The game is a static site — no build step, no server, no database. Netlify just
serves the files. Total payload is **8.5 MB**.

## What's already done

- `netlify.toml` — publish directory, cache headers, security headers
- `manifest.webmanifest` + icons — installs to a phone home screen properly
- `.gitignore` — keeps the 190 MB of full-resolution masters out of the repo
- The repo is initialised and the production build is committed on `main`

## Step 1 — make an empty GitHub repo

On github.com: **New repository** → name it `radiology-rush` → **Private** or
**Public**, your call → do **not** add a README, .gitignore or licence (the repo
already has them). Copy the URL it shows you.

## Step 2 — push

From this folder:

```bash
git remote add origin https://github.com/YOUR-USERNAME/radiology-rush.git
```

```bash
git push -u origin main
```

If GitHub asks for a password, it wants a **personal access token**, not your
account password — or install the `gh` CLI and run `gh auth login` once.

## Step 3 — connect Netlify

On app.netlify.com: **Add new site → Import an existing project → GitHub** →
pick `radiology-rush`. Netlify reads `netlify.toml`, so leave the build settings
exactly as they appear:

| Field | Value |
|---|---|
| Build command | *(empty)* |
| Publish directory | `.` |

**Deploy site.** It takes about a minute. You get a URL like
`radiology-rush-a1b2c3.netlify.app` — rename it under **Site configuration →
Site details → Change site name**.

## Step 4 — check it on your phone

Open the Netlify URL in Safari, then **Share → Add to Home Screen**. Because the
site is HTTPS, audio, saved progress and full-screen mode all behave the way they
should — including things that are flaky over a plain `http://` LAN address.

## Updating it later

Every push to `main` redeploys automatically:

```bash
git add -A && git commit -m "what changed" && git push
```

## Things worth knowing

- **Progress is per-browser.** Saves live in `localStorage` under
  `radiology-rush-v2`. A player's stars do not follow them between devices, and
  clearing site data resets them. That is deliberate — there are no accounts and
  nothing to sign up for.
- **`index.html` is set to always revalidate**; everything in `media/` is cached
  for a year. When you change art or audio, either rename the file or bump the
  `?v=` stamp on the script tags, or returning players keep the old copy.
- **Bandwidth.** Netlify's free tier includes 100 GB/month. At 8.5 MB per fresh
  visitor that is roughly 11,000 first-time loads a month; repeat visits are
  nearly free because the media is cached.
- **The masters are not in the repo.** `assets/` holds the full-resolution art
  and the uncompressed video. Keep a copy — everything in `media/` is derived
  from it by the scripts in `tools/`.
