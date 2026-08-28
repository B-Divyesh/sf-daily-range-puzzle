# Daily Range Puzzle — visual thesis

## Direction: field-notes risograph collage

The interface should feel like two friends have unfolded a small, ink-printed
survey map on a kitchen table. Imperfect registration, clipped paper shapes,
stamped symbols, and fibrous grain make distance feel physical without hiding
the board. Decoration always explains the world: contour marks imply terrain,
registration crosses frame the daily print, and the hero is an abstract field
map rather than a generic game illustration.

This is intentionally a single-mode, warm-paper treatment. The explicit light
surface is part of the risograph metaphor; an automatic dark inversion would
destroy ink relationships and the map's legibility.

## Tokens

- Paper/background: `#F3E9D3`; lifted paper: `#FFF8E8`.
- Carbon/text: `#172B2A`; muted text: `#4D625F`.
- Ink blue/accent: `#135E75`; accent contrast: `#FFFFFF`.
- Persimmon/action: `#C43E28`; deep action text: `#7D2518`.
- Mustard/highlight: `#E0A52B`; success: `#176B4A`; warning:
  `#8A4B12`; danger: `#A62C2C`.
- Terrain is never color-only: every tile has a name and a distinct glyph
  (`·` open, wave water, triangle ridge, star signal).
- Contrast was designed around carbon-on-paper (about 12:1), muted-on-paper
  (about 6:1), and white-on-blue (above 7:1).

## Type and spacing

- Display: local/system slab stack (`Rockwell`, `Roboto Slab`, `Georgia`,
  serif), heavy and slightly condensed in all-caps for printed headings.
- Utility/body: local/system humanist stack (`Avenir Next`, `Segoe UI`,
  sans-serif). No network font requests.
- Scale: 14 / 16 / 20 / 28 / clamp(36–64) px; body line-height 1.55.
- 4 px base rhythm with 8, 12, 16, 24, 32, 48, and 64 px steps. Reading
  measure is capped at 68 characters. Controls are at least 44 px.

## Board and interaction grammar

- Hexes are chunky paper chits with a carbon outline and offset blue/pink ink
  shadows. Terrain glyphs remain readable in monochrome.
- A click/tap or Enter/Space plants a numbered relay. Arrow keys walk focus
  between neighboring tiles; Backspace removes the most recent relay.
- The route appears as straight ink strokes behind the chits. Legal links are
  blue; an over-range link is dashed persimmon. Status text always states the
  same information without color.
- Primary actions resemble stamped labels: solid blue or persimmon, two-pixel
  carbon edge, offset hard shadow. Pressing physically closes the shadow.
- On phones, story copy compresses and the board becomes the visual center;
  controls stack and share actions stay in normal document flow so safe areas
  are never covered.

## Motion

- 180 ms press and focus transitions; 260 ms tile placement with a short
  scale/opacity 'stamp' from the selected hex. Route strokes reveal once.
- Nothing loops. `prefers-reduced-motion: reduce` disables transforms,
  transitions, smooth scrolling, and stroke reveals; state changes remain
  immediate and fully visible.

## Original asset plan and provenance

- `src/assets/range-field-map.webp`: generated hero fragment, used as a
  clipped print behind the introduction. It establishes the hand-made survey
  world; the live board remains semantic HTML/CSS rather than baked imagery.
- Art prompt sheet: **subject** — top-down abstract hex survey map with two
  small relay flags and an ink route; **world** — fictional windswept island
  field chart; **materials** — fibrous cream paper, torn collage edges, two
  overprinted inks, halftone grain; **light/lens** — flat archival scan,
  top-down, no cast shadows; **palette words** — carbon, petrol blue,
  persimmon, mustard, warm paper; **negative list** — no text, letters,
  numbers, logos, watermark, people, hands, branding, photorealism, copyrighted
  symbols, gradients.
- Production prompt: “A wide editorial risograph collage, top-down abstract
  hex survey map of a fictional windswept island, two tiny geometric relay
  flags connected by a dotted measuring route, contour rings and wave marks,
  fibrous cream paper with torn edges, deliberately imperfect petrol-blue and
  persimmon ink registration, sparse mustard stamps, tactile halftone grain,
  flat archival scan, bold simple shapes, generous quiet space, no text, no
  letters, no numbers, no logos, no watermark, no people, no hands, no brands,
  no gradients.”
- Generator: Azure OpenAI factory image deployment via
  `/opt/fleet/lib/gen-image.sh`, 2026-08-28. Original generated asset for this
  product. Source PNG and prompt sidecar retained under `assets/src/`; shipped
  WebP is optimized to ≤300 KB. Footer discloses AI-assisted artwork.

## Accessibility and states

- Focus is a 3 px mustard/black double ring, never color-only.
- Loading uses text (`Printing today’s map…`); a deterministic fallback map is
  available if date parsing fails. Offline mode is a persistent, dismissible
  field-note banner and prior dates remain playable from local shell/cache.
- Results use words plus a five-line text pattern. Dialogs move focus to the
  heading and return it to the trigger. A board summary mirrors route status
  for screen readers.
