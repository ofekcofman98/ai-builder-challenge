Read task.md in the project root before doing anything else.

## Context

I'm building the deliverables for a growth challenge. This is NOT a
software engineering assignment — it's a growth/CVR optimization
challenge — but the code architecture still matters for a practical
reason: in Part 2 I need to produce 3 standalone variants of this
same flow, each with exactly one isolated change. If the code is
well-separated, each variant is a small config edit. If it isn't,
each variant is manual duplication and a source of bugs.

Do NOT start writing the flow yet. First, set up the project.

## Step 1 — Project setup

Initialize the project and create a CLAUDE.md with the rules below
(plus anything else you consider standard best practice for working
with Claude Code on this kind of project).

**Hard constraints (from task.md):**
- Must run offline in a browser with NO backend and NO build step
- Opening index.html must be enough to click through the entire flow
- Must be genuinely responsive — mobile-first, not a desktop layout
  squeezed down. Traffic arrives on both.
- No frameworks that require a build step. Vanilla HTML/CSS/JS only.
- No external CDN dependencies that break offline.

**Architecture requirements:**
- Separate concerns cleanly:
  - Quiz content/questions → its own data module
  - Flow configuration (number of questions, where the email gate
    sits, which feedback messages fire and when, copy strings) →
    a single config object, so variants can be produced by editing
    config only
  - Screen rendering / UI → separate from state logic
  - Styling → centralized design tokens (colors, spacing,
    typography) in one place, not scattered inline styles
- State machine pattern for screen navigation — one source of truth
  for "which screen am I on", not ad-hoc DOM toggling
- Include a lightweight event-tracking layer: every funnel
  transition fires a trackEvent(name, payload) that writes to
  localStorage. No backend, but the flow must be instrumented as
  if it were going live. This is deliberate and should be visible
  in the code.

**Code quality rules for CLAUDE.md:**
- Small, single-responsibility functions
- No magic numbers/strings — everything named in config
- Comments explain *why* a growth decision was made, not what the
  code does
- Consistent naming convention throughout

## Step 2 — Confirm the plan

After creating CLAUDE.md and the project skeleton, show me:
1. The file/folder structure you propose and why
2. The shape of the config object
3. How you'd produce a variant (concrete example: moving the email
   gate from after Q8 to after Q4 — what exactly changes?)

Do not build the actual screens until I approve the structure.