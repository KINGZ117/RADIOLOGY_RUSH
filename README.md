# Radiology Rush

A match-3 game that teaches radiology. Six worlds, thirty levels, three bosses,
an optional typing mode, local co-op, and a case-card album that quietly works
as spaced repetition.

## Play it

Double-click **`Play Radiology Rush.command`**. It starts a small local server,
opens your browser, and prints the address. Close the Terminal window when you
are done playing.

(You can also open `index.html` directly, but the launcher is the reliable path —
video backgrounds and saved progress behave properly over `http://`.)

## First time in

The **tutorial runs itself** on your first level: eight short beats that spotlight one
thing at a time — your goal, your moves, a real swap you make yourself, chains,
power-ups, your kit. Skip it any time; replay it from Settings.

## How to play

- **Swap two neighbouring gems** to line up three or more. Click one then the
  other, or drag. Arrow keys + space work too.
- **Match 4 in a line** → Collimator Beam, clears a whole row or column.
- **Match 5 in an L or T** → Contrast Bolus, a 3×3 blast.
- **Match 5 in a line** → Recon Core, clears every gem of one colour.
- Cascades raise the combo multiplier, capped at ×8 — hitting the cap is
  **OVERREAD**, and it pays.
- **Moves, not clocks.** Nothing in the default game is timed.

**Bosses** rewrite a board rule: the Rogue Cell infects tiles, the Motion
Artifact blurs a 3×3, the Implant Golem armors tiles so they take two hits.
Damage only lands when you match the boss's current weakness, which is always
shown. At 50% and 20% health it staggers and offers a **Critical Read**.

**Typing mode** (on by default, switch it off in Settings) shows a definition;
type the term for +3 moves and a ×1.5 window. Getting it wrong costs nothing —
the card just comes back in tomorrow's Morning Rounds.

**Co-op · Double Read** puts two players on one board, alternating turns. Your
combos charge *your partner's* meter, not your own.

## The noise it makes

Everything you hear is synthesised on your device — there is not one audio file in
the game except the voice lines.

- **A cinematic electronic score, four layers deep, and your streak decides how
  many play.** Sidechained bass and kick always; hats and percussion arrive on your
  second chain link, the plucked hook on the fourth, supersaw pads and the
  counter-lead when you're on fire. Layers only ever change on the bar line, so it
  stays musical. Every department has its own key, tempo and drum feel — and the
  level number nudges both, so no two levels sound identical.
- **The boss has his own track**: faster, distorted, half-time drums, a minor
  second in the motif. **Winning has its own cue** — a rising IV–V–I with the lead
  over the top.
- **Room tone.** Under everything: air, a 60 Hz hum, and a distant monitor that
  beeps on no predictable schedule. Switch it off in Settings.
- **Voice calls.** The attending calls your reads — *"Crystal clear scan."*,
  *"Diagnosis unlocked!"*, *"Overread! Outstanding."* — and on a big chain one of the
  crew pops in to celebrate: Marco the CT tech, Nurse Rosa, or Dr. Kim the resident.
  Every line is captioned on screen, so it all works muted.
- **Chains snowball on purpose.** From the third link the scanner overdrives and
  detonates a burst of its own, so a good chain visibly runs away with itself.

## On an iPhone

- **Flick to swap** — a third of a tile in any direction is enough; no need to land on
  the neighbour.
- Every control is at least 44pt, the board sits in thumb reach, and the layout
  respects the notch and home indicator.
- **Haptics** fire on matches, stars and rewards on devices that support the web
  vibration API — that's Android and Chrome. **iOS Safari has no web haptics API at
  all**, so on an iPhone the toggle is there but the phone stays quiet; nothing else
  is affected.
- Add it to your home screen for a full-screen, browser-chrome-free run.

## Deploying it

See [DEPLOY.md](DEPLOY.md). Short version: it is a static site, `netlify.toml` is
already written, and the whole payload is 8.5 MB.

## What is in here

```
index.html                  the shell
css/style.css               UI skin (the board is canvas; everything else is DOM)
js/plate.js                 two video elements, crossfaded — seamless loops from any clip
js/data.js                  gems, worlds, 30 levels, the 48-term deck
js/engine.js                pure board logic — matches, specials, gravity, hazards
js/audio.js                 all sound synthesised at runtime (no audio files)
js/fx.js                    pooled particles, shake, floating text
js/game.js                  screens, level runtime, bosses, dictation, save
media/plates/               section key art (also the poster fallback for video)
media/loops/                eight background loops — menu plus seven departments
media/icons/                home-screen and favicon set
media/sprites/              gem, power-up and boss cutouts
assets/                     the full-resolution masters everything was cut from
DESIGN-BIBLE.md             art direction, the AAA critique rounds, targets
```

## Notes

- Progress lives in your browser's `localStorage` under `radiology-rush-v1`.
  Clearing site data (or Settings → Erase all progress) resets it.
- Performance adapts on its own: particles thin out first, and if frames keep
  slipping the video plates pause and the still key art takes over.
- Accessibility: full keyboard play, colourblind glyphs, high contrast, reduced
  motion, text scaling, a readable-font toggle, and screen-reader announcements.
  Typing mode is never required for any reward.
- Clinical content is descriptive language only — no diagnoses, no gore.
