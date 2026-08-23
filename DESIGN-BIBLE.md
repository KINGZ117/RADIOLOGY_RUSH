# RADIOLOGY RUSH — Design Bible v1.0
*A match-3 that teaches radiology, built to Pixar warmth and Blizzard polish.*

---

## 1. The pitch

You are a first-year resident in a hospital where the imaging departments have become
worlds. Match glowing modality gems to run the scanner, clear the artifacts, and read
the case before the Rogue Cell does. Every world is a different department with its own
light, motion and music. Every level teaches one real idea from radiology, and the game
never stops to lecture you — the teaching rides on the reward.

**Session shape:** 90-second levels, 3–5 level sittings, one daily 4-minute ritual.
**Promise to the player:** *you will get faster, and you will actually know the words.*

---

## 2. The virtual AAA team, and what they broke

Six people reviewed this before a line of code was written. Three rounds. What survived
is in section 3 onward; what died is recorded here so it stays dead.

### Round 1 — first read

**Creative Director (ex-Blizzard, cinematics).**
> "Six worlds, six art styles, six music beds is not a *world*, it's a portfolio. Right
> now this reads as a showreel with a grid on top. Give me one universe with six weathers.
> Also: your hook is the smartest thing here and it's buried — the fantasy is *becoming a
> radiologist*, not *matching gems*. Put the rank on screen. Make the player a person."

**Art Director.**
> "Video backgrounds behind a match-3 board is the single most common way to make a
> beautiful game unreadable. If the plate is busy, the board dies. Every plate ships
> dark, low-contrast and *empty in the middle*, or it doesn't ship. And the gems can't
> just be six colors — 8% of your male players can't tell your amber from your gold.
> Six colors, six silhouettes, six materials."

**Lead Gameplay Engineer.**
> "Cascades plus particles plus a 5-second 1080p video loop plus DOM UI is a frame-rate
> obituary on a MacBook Air. Board goes to canvas, UI stays DOM, particles get a pool and
> a hard cap, video gets a kill switch that fires automatically when frame time slips."

**UX / Accessibility Lead.**
> "The typing mode is the accessibility problem *and* the accessibility win. Anything
> timed and text-based excludes people — motor, dyslexia, ESL. It has to be optional,
> forgiving, and never the only path to a reward. Meanwhile the match-3 itself must be
> fully keyboard playable, because that's free and almost nobody does it."

**Radiologist SME.**
> "Two things will get you laughed out of a reading room. One: gore. Don't. Two: fake
> clinical certainty — no 'FDG uptake = cancer'. And please don't make the boss a tumor.
> Make the bosses the things that actually ruin a study: motion, metal, and a cell that
> won't behave."

**Live Ops / Retention.**
> "No energy meter. Your player is a student, not a whale — the second you gate their
> studying behind a timer, they uninstall and feel good about it. Retention here comes
> from *knowing more tomorrow*: a daily 4-minute ritual, a streak, and a card album that
> is quietly a spaced-repetition engine."

### Round 2 — after the first revision

**Creative Director:** "Better. The rank ladder works. But your boss fights are health
bars with a hat. A boss has to change *how I match*, not how long I match."
→ **Changed:** every boss now rewrites a board rule (see 5.4). The health bar is the
timer, not the fight.

**Art Director:** "The gems read now. The board doesn't — everything glows, so nothing
glows. Cut the ambient bloom on idle tiles, spend all of it on the moment of a match."
→ **Changed:** idle tiles are matte-lit with a single rim; emission is reserved for
selection, match, and special-piece charge. Contrast is a currency.

**Gameplay Engineer:** "Your combo multiplier climbs forever, so the correct strategy is
one giant cascade and nothing else. Cap it and make the cap feel like an achievement."
→ **Changed:** multiplier caps at ×8, and hitting the cap triggers **OVERREAD** — screen
lights, audio jumps an octave, next match is worth double. The cap became the fireworks.

**UX Lead:** "You put co-op on one keyboard with two simultaneous cursors. That is a
fistfight, not a feature."
→ **Changed:** co-op is **Double Read** — alternating turns, shared board, shared move
pool, and each player's combo charges *the other player's* booster. It's cooperative
because you're spending your turn to set up theirs.

**SME:** "Typing mode is where the actual learning lives. Don't make it a score bonus
bolted on the side — make it the thing that saves you when the board is bad."
→ **Changed:** a correct dictation grants +3 moves and a ×1.5 window. It is a genuine
rescue mechanic, so learning is the strategy, not the tax.

### Round 3 — polish pass

**Creative Director:** "The level-complete moment is a number going up. That's the last
thing they see before they decide to play again. Make it the best three seconds in the
game." → **Changed:** stars punch in on a rising 3-note stinger, the case card flips in,
XP bar fills late (after the stars, never during — never split the eye).

**Art Director:** "Ship a colorblind mode that's *on the tile*, not in a menu paragraph."
→ **Changed:** optional glyph badge on every gem (◆ ● ▲ ■ ✚ ★), plus a high-contrast
board tint that dims the video plate to 25%.

**Live Ops:** "Your daily ritual has no reason to exist on day 30." → **Changed:**
**Morning Rounds** serves cards you've previously *missed* first, so the daily gets
sharper the longer you play, and the streak counter is cosmetic — never a punishment.

**QA:** "Cascades during a boss attack during a typing prompt. You will ship that bug."
→ **Changed:** a single explicit state machine (`IDLE → SWAP → RESOLVE → CASCADE →
BOSS → PROMPT → IDLE`); input is dropped, never queued, outside `IDLE`.

---

## 3. Art direction — "Luminous Anatomy"

**One universe, six weathers.** Every world is the same hospital seen through a
different physics. Shared rules across all six:

| Rule | Spec |
|---|---|
| Key light | One dominant modality color per world, one warm amber accent — always |
| Value structure | Background plate lives in the bottom 35% of the value range; the board sits in the top 65% |
| Center of frame | Deliberately empty and dark in every plate; detail is pushed to the edges |
| Material language | Gems are thick, glossy, subsurface-scattered candy glass with a bevel you could bite |
| Emission budget | Idle = matte + one rim. Emission is *spent* on selection, match, charge, and boss beats |
| Motion | Backgrounds move at ≤ 2 px/s of apparent motion. Nothing in the plate crosses the frame |

**The six worlds**

1. **Slice City** (CT) — concentric cyan gantry rings as a cathedral-city; floating axial slices. Steel-blue / cyan, amber lamps.
2. **Resonance Cathedral** (MRI) — a gothic bore of superconducting magnets, aurora field lines, helium mist. Violet / indigo / magenta.
3. **Bone Foundry** (X-ray) — an industrial forge casting glowing radiographs; hard light shafts, embers. Bone-white / amber / brass.
4. **Echo Reef** (Ultrasound) — a sonar reef; teal ripple arcs, caustics, speckle haze. Teal / aquamarine / navy.
5. **Tracer Nebula** (Nuclear/PET) — radiotracer jellyfish drifting through a decay nebula. Radioactive gold / lime / black.
6. **The Reading Room** (Boss arena) — a wall of diagnostic monitors, crimson alert sweep. Cold blue / crimson on near-black.

**The six gems** — color *and* silhouette *and* material, never color alone:

| Gem | Silhouette | Material | Color |
|---|---|---|---|
| CT slice | Hexagon | Cold glass | Cyan |
| MRI coil | Rounded diamond | Copper in violet resin | Violet |
| X-ray plate | Square, brass-framed | Warm film | Amber |
| Ultrasound probe | Teardrop | Soft plastic + glass | Teal |
| Radiotracer | Sphere | Glowing liquid | Gold-green |
| Contrast vial | Bottle | Silver + fluid | Crimson |

**Animation principles** (stolen shamelessly from Pixar, and correct):
squash on land, anticipation before a special fires, overlap on cascade columns (each
column lands 40 ms after the one left of it), and **secondary action** — the boss reacts
to your combo even when it isn't his turn.

---

## 4. The teaching model

Three layers, each one optional to engage with and impossible to avoid absorbing:

1. **Ambient** — every gem, world and enemy is a real concept, correctly used. You learn
   the vocabulary by handling it for hours.
2. **Case Cards** — one card per level: term, plain-language definition, and a real
   example sentence. Earned as the reward, shown at the peak of the win moment.
3. **Dictation (typing mode)** — a definition appears, you type the term. Correct: +3
   moves and a ×1.5 multiplier window. Wrong or skipped: nothing bad happens.

**Spaced repetition, hidden:** every card carries a `seen` and `missed` count in the
save. Morning Rounds serves missed cards first, then least-recently-seen. The player
experiences it as "the daily gets more relevant"; it is a Leitner box.

**Clinical integrity (SME red lines):** no gore, no anatomy that isn't organs/scanners,
no diagnostic claims, no "this finding = this disease". Definitions are descriptive.
The game teaches *language and physics*, never how to practice.

---

## 5. Systems

### 5.1 Core
8×8 board, adjacent swap, match 3+. Invalid swaps bounce back and cost nothing.
No timers by default: **moves** are the currency. Cascades pay a multiplier that climbs
per chain link and caps at ×8 (**OVERREAD**).

### 5.2 Special pieces
| Made by | Piece | Effect |
|---|---|---|
| Match 4 in a line | **Collimator Beam** | Clears the full row or column |
| Match 5 in an L/T | **Contrast Bolus** | 3×3 blast |
| Match 5 in a line | **Recon Core** (prism) | Clears every gem of one type |
| Beam + Beam | — | Full cross |
| Bolus + Beam | — | Three-wide beam |
| Core + anything | — | Detonates every copy, then their effects |
| Core + Core | — | Clears the board |

### 5.3 Objectives (rotate, never repeat twice in a row)
Score target · Collect N of a modality · Clear the **artifact fog** · Deliver **case
files** to the bottom row · Boss.

### 5.4 Bosses — each rewrites a rule
- **The Rogue Cell** — every 3 of your moves, it infects a tile; infected tiles can't be matched until a neighbouring match cleans them. *Teaches: keep the field clean.*
- **The Motion Artifact Wraith** — smears a random 3×3 into unmatchable blur; only a special piece cuts through. *Teaches: save your specials.*
- **The Implant Golem** — armors tiles in chrome; armored tiles need two hits. *Teaches: plan two moves deep.*
Damage is dealt by matching the boss's **weakness modality**, which rotates every few
moves and is always displayed. **Critical Read:** at 50% and 20% HP the boss staggers and
a dictation prompt opens — a correct answer is a massive damage spike. (Typing off: the
stagger becomes a free double-damage window instead. Never a dead end.)

### 5.5 Co-op — "Double Read"
Two players, one screen, alternating turns on a shared board and a shared move pool.
Each player has an **Attending Meter**; your combo charges *your partner's* meter, and a
full meter grants them a booster. Shared score, shared stars. Pass-and-play dictation:
whoever isn't holding the mouse answers.

### 5.6 Meta & retention (no dark patterns)
- **Ranks:** Student → Intern → Resident → Fellow → Attending → Chief (XP).
- **Stars:** 1–3 per level; stars gate the next world.
- **Morning Rounds:** one 4-minute daily built from your missed cards. Streak is
  cosmetic and never punishes a missed day.
- **Boosters** are earned in play only. Nothing is purchasable. There is no energy meter,
  no timer between sessions, and no loss aversion mechanic anywhere in the game.

---

## 6. Technical performance targets

| Target | Spec |
|---|---|
| Frame rate | 60 fps sustained on an M1 MacBook Air at 1440×900; ≥ 30 fps floor on 5-year-old integrated graphics |
| Frame budget | 16.6 ms — board render ≤ 4 ms, particles ≤ 3 ms, UI ≤ 2 ms |
| Input latency | ≤ 50 ms from click to tile response |
| Cold start | Playable menu in < 1.5 s; assets stream in behind the menu |
| Particles | Pooled, hard cap 420 live; oldest recycled, never allocated mid-frame |
| Video plates | 720p, muted, looped, `playsinline`, poster still always present as fallback |
| Adaptive quality | Rolling 90-frame average frame time. > 22 ms → drop particle cap and blur; > 28 ms for 2 s → video plates pause and the poster still takes over. Automatic, announced once, reversible in Settings |
| Memory | < 250 MB steady state; sprites decoded once into offscreen canvases at tile size |
| Rendering split | Board = one DPR-aware canvas. HUD/menus = DOM. Never both for the same pixel |

---

## 7. Accessibility (ship-blocking, not a checkbox)

- **Full keyboard play:** arrows move the cursor, Space/Enter picks and swaps, Esc cancels.
- **Colorblind mode:** glyph badge on every gem (◆ ● ▲ ■ ✚ ★) plus distinct silhouettes.
- **High contrast:** dims the plate to 25% and raises tile contrast.
- **Reduced motion:** honors `prefers-reduced-motion` automatically; freezes plates, shortens animations, no screen shake.
- **No flashing** above 3 Hz, anywhere, ever.
- **Typing mode is optional**, case-insensitive, punctuation-insensitive, and never the only route to any reward.
- **Screen reader:** `aria-live` announcements for score, moves, objective progress and boss state.
- **Text size** control, and a dyslexia-friendly font toggle.
- **No fail-by-clock** in the default mode; every level is moves-based.

---

## 7b. Polish pass — what the second round added

The first build was correct. It was not yet *exciting*. The polish pass fixed six
things, in this order:

1. **The tutorial.** Eight beats on a live board: welcome, your goal, moves-not-clocks,
   *make this exact swap* (the board is locked to one legal move and refuses the rest),
   chains, power-ups, your kit, go. It spotlights one element at a time and speaks each
   beat. Skippable, replayable, and it never explains two things at once.
2. **Combo escalation.** A named call at every link — NICE, CRYSTAL CLEAR SCAN, CLEAN
   READ, DIAGNOSIS UNLOCKED, TEXTBOOK, SPECTACULAR READ, OVERREAD — each with its own
   banner tier, screen kick, flash and voice line. **SURGE:** from the third link the
   board detonates a free 3×3 burst of its own, so long chains physically snowball
   instead of just counting higher.
3. **Music that layers with the streak.** Four synthesised layers — bass+kick, hats,
   the hook, counter-melody+claps — entering and leaving *only on the bar line*, driven
   by chain depth. Each world has its own key, mode and tempo. (Written as a WebAudio
   sequencer rather than generated: the asset service's music model is restricted to its
   own game pipeline, and licence-free procedural music also costs nothing to load.)
4. **A voice cast.** Nineteen generated lines: the attending calls the reads, and three
   crew members — Marco the CT tech, Nurse Rosa, Dr. Kim the resident — pop in on big
   chains with a quick celebration and a caption. Every line is captioned, so the whole
   layer is optional and nothing is lost with sound off.
5. **The reward, staged.** Stars punch in on the stinger, *then* the case card turns
   over — a real 3D flip from a holo-foil back with a gold seal, with a gloss sweep
   across the face — and only then does the XP bar fill. Three stars gilds the card.
6. **iPhone.** Flick-to-swap at a third of a tile, 44pt minimum targets, safe-area
   insets, no rubber-band scroll, no zoom-on-input, audio unlocked on first touch, and
   haptics where the platform allows them (Android yes; iOS Safari exposes no web
   vibration API, so the toggle is honest about doing nothing there).

## 7c. Production pass

**The score was rewritten.** The first pass was a pleasant chiptune; it did not
carry a boss fight. What ships now is a cinematic electronic engine: sidechained
bass ducking under every kick, five-voice supersaw pads, plucked arps through a
dotted-eighth feedback delay, a convolution room on a send, risers into every
eighth bar and an impact when they land. Seven department scores, each with its own
key, tempo, drum pattern and motif; the level number nudges tempo and transposes
the key, so no two of the 35 levels sound the same. The boss gets a faster,
waveshaped, minor-second variant. Victory is a written cue, not a jingle.

**Why it is synthesised rather than generated.** The asset service's music and
sound-effect models are restricted to its own game pipeline and refuse standalone
use. Procedural also wins on merit here: zero download, zero licensing, and layers
that can genuinely follow the player's combo streak bar by bar, which a rendered
stem cannot.

**Seamless loops, solved in code.** Any generated clip has a seam. `js/plate.js`
runs two video elements and crossfades 0.7 s before the end, driven by a 200 ms
watchdog rather than media events — which throttle in background tabs and lie on
iOS. The result loops invisibly whatever the source does.

**An eighth section.** The Angio Suite (cardiac cath lab) joins as world six,
pushing the Reading Room to seven and the ladder to 35 levels.

**Weight.** 28 MB of video became 2.3 MB at 1280×720 CRF 30 — a fifteen-fold cut
with no visible loss on a plate that sits dimmed behind a board. Total deploy: 8.5 MB.

## 8. Asset manifest (all generated for this build)

- 6 world key-art plates (2752×1536) + 6 five-second ambient video loops
- 8 gem/power-up cutouts (256², transparent)
- 3 boss characters (512², transparent)
- 1 title key art, 1 world-map plate
- 3 cartoon crew characters × 3 celebration poses, cut from single generated sprite strips
- 1 holographic foil texture and 1 award seal for the case card
- 19 voice lines (attending + three crew), ~260 KB total
- All music and sound effects synthesised at runtime with WebAudio — no audio downloads
