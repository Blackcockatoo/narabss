# CLAUDE.md — Nara's Colour Quest / Baby B$S

You are working on **Nara's Colour Quest**, a Blue Snake Studios Junior kid-safe colouring-book arcade.

## Core product

A static website with:

1. A polished homepage wrapper.
2. Eight playable browser games.
3. A tiny Web Audio beat maker app.
4. Colouring-book art, creature cards and soft arcade energy.

## Hard rules

- Keep it kid-safe.
- No login, no comments, no school details, no location details, no public child contact form.
- Do not add backend services unless explicitly asked.
- Do not add ad scripts, tracking scripts or analytics by default.
- Keep it static and hostable on GitHub Pages / Vercel / Netlify.
- Preserve the Baby B$S tone: playful, weird, soft, round, printable, safe.

## Visual style

Baby B$S = Blue Snake Studios DNA softened for a child-safe world.

Use:

- cream paper backgrounds
- black ink outlines
- blue snake accents
- soft gold stars
- moss green / warm orange / tiny purple neon accents
- rounded cards
- sticker buttons
- creature mascots
- arcade panels

Avoid:

- horror
- adult occult imagery
- gore or weapons
- sharp aggressive logo systems
- private identity details
- dark cult language

## Current structure

```txt
index.html
css/style.css
apps/beat-maker/index.html
apps/beat-maker/style.css
apps/beat-maker/app.js
games/creature-match/
games/dino-dash/
games/hidden-jungle-friends/
games/catchemall-cat/
games/snake-trail/
games/feather-catcher/
games/colour-lab/
games/rex-rhythm/
assets/images/
```

## Upgrade priorities

1. Keep all games playable on desktop and mobile.
2. Improve shared navigation and back links.
3. Add friendly sound toggles where useful.
4. Improve accessibility: labels, keyboard controls, readable contrast.
5. Keep performance lightweight.
6. Add printable colouring-page views later.
7. Add a `docs/` page for game design notes if needed.

## Beat Maker Lab notes

The beat maker uses Web Audio only; no external sound files are needed. It should stay non-saving unless asked. The point is playful exploration, not a DAW.

Sounds:

- Dino Kick
- Snake Snap
- Cat Meow
- Feather Whistle
- Cool Pad

Effects:

- BPM
- Pitch
- Echo
- Fuzz
- Space
- Swing

## Copy tone

Use phrases like:

- Press start, little legend.
- Tiny arms, big score.
- Colour the creature.
- Dad-built, kid-powered.
- Enter the Dino Game Cave.
- Printable, playable, soft, weird, safe.
