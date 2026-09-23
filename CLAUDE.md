# CLAUDE.md — IQly Quiz Flow

This is a growth/CVR optimization challenge, not a software engineering assignment.
The code architecture matters only because Part 2 requires 3 standalone variants of the
Part 1 flow, each with exactly one isolated change. Good separation = each variant is a
config edit. Bad separation = manual duplication and bugs.

## Hard constraints

- **Offline, no backend, no build step.** Double-clicking `index.html` must work.
- **No CDN dependencies.** Everything ships locally in this repo.
- **No ES modules.** `import`/`export` fail under `file://` CORS. All JS loads as
  classic `<script>` tags in dependency order, each file attaching to the single
  global namespace `IQLY`.
- **Vanilla HTML/CSS/JS only.** No frameworks that require a build step.

## Mobile-first, genuinely responsive

- Author base styles at phone width first; widen with `min-width` media queries only.
- Tap targets ≥44px.
- Traffic arrives on both mobile and desktop — never ship a desktop layout scaled down.

## Architecture

Layering (see file headers for each module's single responsibility):

- `config.js` — `IQLY.CONFIG`: the entire flow shape + all copy strings. The single
  surface variants are allowed to touch.
- `questions.js` — `IQLY.QUESTIONS`: quiz content only, no flow logic.
- `scoring.js` — `IQLY.scoring`: pure functions, answers → score/percentile/categories.
- `tracking.js` — `IQLY.track(name, payload)`: writes events to localStorage. Every
  funnel transition must call this. No silent transitions.
- `state.js` — `IQLY.state`: the state machine (current screen, answers, screen
  history). **Must not touch the DOM.**
- `screens.js` — `IQLY.screens`: one pure render function per screen, reading only
  `IQLY.CONFIG` and current state. **Must not mutate state.**
- `render.js` — `IQLY.render`: mounts `screens.js` output into the DOM, binds events,
  calls back into `state.js`.
- `main.js` — `IQLY.init`: wires everything together and starts the machine.

Load order (every entry HTML file): tokens.css → base.css → components.css, then
config.js → questions.js → scoring.js → tracking.js → state.js → screens.js →
render.js → main.js.

**Variant rule:** a variant HTML file may only override `IQLY.CONFIG` values inline
between the `config.js` and `main.js` script tags. If a test needs an actual code
change to work, that's a signal the behavior belongs in `CONFIG`, not that the rule
should be broken.

## Code quality

- Small, single-responsibility functions.
- No magic numbers or strings — everything named in `IQLY.CONFIG`.
- Comments explain *why* a growth decision was made (e.g. why a toast fires after Q3,
  why the email gate sits where it does), not what the code does mechanically.
- Naming: `camelCase` for JS identifiers, `kebab-case` for file/CSS names,
  `IQLY` as the sole global namespace root.

## Decision log

After any non-trivial decision made jointly with the user (architecture, flow, growth,
or deliverable-format calls), append a dated entry to `AI_WORKFLOW.md` using the fixed
format shown in that file, before moving on. It feeds the submission write-up directly.
Trivial mechanics (renames, typo fixes) don't need an entry.

## Context

- Goal metric: CVR = account creations / page visits.
- `.private/task.md` — the full challenge brief (all 3 parts).
- `write-up.md` — Part 1 competitive research and funnel model the design answers to.
- `AI_WORKFLOW.md` — decision log for the submission.
