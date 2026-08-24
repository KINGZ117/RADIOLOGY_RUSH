# Radiology Rush — working notes for Claude

A match-3 that teaches radiology. Plain HTML/CSS/JS, **no build step, no framework,
no package manager.** Open `index.html` through a local server and it runs.

## Run it
- **Play:** double-click `Play Radiology Rush.command` (serves on 4173+, prints a LAN
  address for the iPhone). Never open `index.html` over `file://` — video plates and
  saved progress misbehave there.
- **Publish:** double-click `Publish update.command`, or `git push origin main`.
  Netlify redeploys itself from `main`. Rollback is one click in the Netlify UI.

## Where things live
| File | What it owns |
|---|---|
| `js/engine.js` | Pure board logic — matches, specials, gravity, hazards. No DOM. |
| `js/game.js` | Screens, level runtime, bosses, tutorial, dictation, save, render |
| `js/audio.js` | The whole score and every sound, synthesised live. Nothing streams. |
| `js/plate.js` | Two `<video>` elements crossfaded 0.7 s before the end = seamless loops |
| `js/fx.js` | Pooled particles, shake, floating text |
| `js/data.js` | 7 worlds, 35 levels, the 48-term deck |
| `media/` | Everything that ships (8.9 MB). `assets/` holds the masters, gitignored. |
| `tools/*.py` | The asset pipeline — cutouts, sprite-strip slicing. Needs `.venv`. |

## Systems added in the "make it addictive" pass (2026-08-24)
- **Seven tools**: Injection (shuffle), Windowing (charge a beam), Second Read (+3 moves),
  Aspirate (remove one tile, costs no move), Scanogram (clear a row), Protocol (clear a
  whole gem type), Dictate. Targeted ones use `L.armed` — the tap handler must check
  `if (L.armed)`, never a specific tool name.
- **Curve balls** (`CURVEBALLS` in game.js) fire roughly every 5+ moves, three good to one
  awkward: Code Blue (×2 for three moves), Power Surge, Contrast Spill, Stat Order,
  Second Opinion, Artifact Storm, Shift Change.
- **Card mastery**: `save.cards[i].correct` drives Bronze/Silver/Gold; every tier-up pays
  a booster and XP. Five mastered terms in a specialty earns its badge. Three stars pays
  a bonus card.
- **Per-level look**: `applyLevelLook()` sets `--plate-hue/-bright/-sat/--level-wash` from
  the level number, so all 35 levels are lit differently.
- **Pace**: swap 0.10 s, clear 0.15 s, fall 0.17 s, and `chainSpeed()` shortens each link
  further so deep chains accelerate.

## Rules that are deliberate, not accidental
- **Combo caps at ×8** ("OVERREAD"). Uncapped made one giant cascade the only strategy.
- **Moves, never timers.** No energy meter, nothing purchasable, streaks never punish.
- **Typing mode is a rescue**, not a tax: +3 moves and ×1.5, and a wrong answer costs
  nothing. It must never be the only route to a reward.
- **Clinical red lines:** no gore, no anatomy beyond organs and scanners, no diagnostic
  claims. Definitions stay descriptive.
- **Music and SFX are synthesised** because Higgsfield's music/SFX models are restricted
  to its own game pipeline. Voice lines are Higgsfield TTS (`seed_audio`, 0.2 credits a
  line). Don't try to generate music there — it refuses.

## Testing without a human
`RR.step(dt)` drives one frame deterministically, so a bot can play a whole level in the
console; `RR.debug()` returns `{save, level}`; `RR.tut` is the tutorial state. **CSS
animations and transitions freeze in a hidden tab** — verify with computed geometry and
game state, not screenshots, unless the pane is fronted.

## Gotchas that have already bitten
- A stale `stopMusic` timer used to kill a freshly started track (generation counter now).
- `setPointerCapture` can throw; it's wrapped.
- `media/` is cached for a year — a *changed* asset needs a new filename, and the JS/CSS
  `?v=` stamps get bumped on publish.
- Save key is `radiology-rush-v2`. Changing it wipes everyone's stars.

## Deploy
GitHub `KINGZ117/RADIOLOGY_RUSH` → Netlify, auto-deploy from `main`. See `DEPLOY.md`.
This Mac pushes as `rhtr7s5w68-sys`, which is a **collaborator** on that repo.
