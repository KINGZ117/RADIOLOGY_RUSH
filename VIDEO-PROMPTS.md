# Radiology Rush — Higgsfield background-loop prompts

Eight sections, one visual grammar. Every prompt is written to the same five rules so
the set reads as one film rather than eight clips.

**The rules, baked into every prompt below**

| Rule | Why |
|---|---|
| One dominant modality colour + one warm accent | Keeps eight rooms inside one universe |
| Deliberately dark, empty centre of frame | The board sits there; a busy centre kills legibility |
| Apparent motion ≤ ~2 px/s, nothing crosses frame | A loop that travels can never seam cleanly |
| No cuts, no camera shake, no people, no text | Cuts break the loop; people pull focus; text dates the build |
| Continuous cyclical motion (rings, ripples, drift) | Cyclical motion hides the loop point |

**Pipeline that produced them:** `nano_banana_pro` for the still (2 credits, full control
of composition and grade) → that still as `start_image` for `kling3_0_turbo`, 5 s, 720p
(7.5 credits). Generating the plate first is what keeps the centre of frame empty —
text-to-video alone will not respect that.

**The engine loops them seamlessly regardless of the source clip.** `js/plate.js` runs two
video elements and crossfades 0.7 s before the end, so even a clip whose last frame does
not match its first has no visible seam.

---

## 1 · Menu — "The Atrium"

> Ultra-realistic futuristic cinematic still for a game main menu, shot on an anamorphic
> lens, shallow depth of field, volumetric haze. A vast darkened hospital imaging atrium
> at night seen from a low wide angle: polished dark floor with mirror reflections, a
> distant illuminated CT gantry ring glowing cool cyan, banks of diagnostic monitors along
> the walls throwing soft blue light, thin holographic scan slices drifting slowly in the
> air, a single warm amber accent lamp far back. Deep teal and steel palette, near-black
> shadows, cinematic colour grade, film grain. Deliberately empty and dark through the
> centre of frame so a title and menu can sit on top. No text, no logos, no people.

**Motion pass:** *Almost imperceptible forward drift. The distant gantry ring rotates
slowly; monitor glow breathes; haze drifts left to right across the light beams; a
holographic slice rotates once in place. No cuts, no people, no camera shake.*

## 2 · CT — "Slice City"

> Ultra-realistic futuristic cinematic still of a colossal CT gantry reimagined as a
> circular cathedral-city: concentric rings of cyan light rotating around a bright bore,
> translucent axial CT slices floating in the air like glass panes, steel and porcelain
> architecture, catwalks, volumetric god rays, warm amber service lamps at the edges.
> Cool cyan and steel-blue palette, cinematic colour grade, film grain, empty dark centre.

**Motion pass:** *The concentric rings rotate slowly and steadily, light pulsing around
them; floating slices bob and rotate in place; haze drifts through the beams.*

## 3 · MRI — "Resonance Cathedral"

> Ultra-realistic futuristic cinematic still of an MRI bore imagined as a gothic cathedral
> of superconducting magnets: spiral coils like organ pipes, aurora ribbons of violet and
> magenta field lines, liquid-helium mist across a mirrored floor, floating hexagonal coil
> elements, cold white rim light. Deep violet and indigo palette, volumetric fog,
> cinematic colour grade, empty dark centre.

**Motion pass:** *Aurora ribbons undulate slowly; helium mist creeps across the mirrored
floor; a travelling pulse of light runs along the coil pipes; very slow push in.*

## 4 · Cath Lab — "The Angio Suite"

> Ultra-realistic futuristic cinematic still of an interventional cardiac catheterisation
> laboratory: a gleaming C-arm angiography system arcing over an empty procedure table,
> ceiling-mounted monitor booms carrying a wall of live angiographic displays glowing
> crimson and cold white, sterile blue drapes, chrome and glass, red-orange indicator
> lighting raking the ceiling rails. Crimson, chrome and cold white on near-black,
> high-end medical-tech advertising photography, cinematic grade, empty dark centre.
> Nothing graphic or gory.

**Motion pass:** *The C-arm rotates a few degrees and settles; angiographic traces scroll
across the monitor wall; indicator lights sweep the ceiling rails; slow parallax drift.*

## 5 · Nuclear medicine — "Tracer Nebula"

> Ultra-realistic cinematic still of a nuclear-medicine cosmos: radiotracer molecules
> drifting like luminous golden jellyfish through a dark nebula, PET detector rings
> floating as orbital stations, faint paired-photon streaks crossing the void, hot-metal
> colour-map clouds of green and gold. Radioactive gold and lime on deep space black,
> particles, cinematic grade, empty dark centre.

**Motion pass:** *Tracers drift like slow jellyfish trailing decay sparks; detector rings
rotate slowly; nebula clouds billow almost imperceptibly; very slow forward drift.*

## 6 · Radiography — "Bone Foundry"

> Ultra-realistic cinematic still of an industrial forge where radiographs are cast like
> glowing plates: hanging light boxes with luminous bone films, sparks of amber, brass and
> copper machinery, giant collimator lamps casting hard shafts of white light through
> drifting dust. Bone-white, amber and brass on charcoal, cinematic grade, empty dark
> centre.

**Motion pass:** *Embers and dust motes float upward through the light shafts; the light
boxes glow and settle; slow parallax drift to the right.*

## 7 · Ultrasound — "Echo Reef"

> Ultra-realistic cinematic still of an underwater sonar reef: ultrasound waves rippling
> outward as glowing teal arcs, coral shaped like transducer probes, bioluminescent
> plankton, caustic light patterns, a distant speckle haze like a live scan. Teal and
> aquamarine on deep navy with warm coral highlights, cinematic grade, empty dark centre.

**Motion pass:** *Sonar rings ripple outward again and again; caustics crawl over the
coral; plankton sparks drift upward; gentle current sway.*

## 8 · Final boss — "The Reading Room"

> Ultra-realistic futuristic cinematic still of a vast darkened radiology reading room
> turned arena: a curved wall of towering diagnostic monitors glowing cold blue, a heavy
> crimson alert wash, floating holographic scan windows, cable runs and server towers,
> dramatic rim lighting, ominous scale. Cold blue and crimson on near-black, volumetric
> haze, cinematic grade, empty dark centre.

**Motion pass:** *Monitors flicker with scrolling scan data; a slow crimson alert light
sweeps the room; holographic windows drift and rotate; haze rolls low across the floor;
very slow push in.*

---

## Reusing these

Keep the still and the motion pass as a pair — the still fixes composition and grade, the
motion pass fixes tempo. If a clip comes back too busy, the fix is almost never the motion
prompt; it is that the still had detail in the centre of frame.
