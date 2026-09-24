# AI Workflow — Decision Log

Reverse-chronological log of non-trivial decisions made jointly with Claude Code while
building this submission. Used directly in the submission write-up to show where AI
tools helped and what was decided by the candidate.

Entry format:

```
## YYYY-MM-DD — <short title>

**Decision:** what we chose.

**Considered:** the alternatives on the table.

**Why:** the reasoning / trade-off that decided it.

**AI's role:** what Claude surfaced vs. what the user decided.
```

---

## 2026-09-24 — Inline email capture on partialResult, no intermediate screen

**Decision:** the baseline post-quiz email gate is no longer a separate `emailGate`
screen reached via a "See your full score" button. The email field renders inline at
the bottom of `partialResult`, and submitting it advances straight to `fullResult`. The
standalone `emailGate` screen still exists (extracted into a shared `emailForm()`
helper) for the two paths with no result content to merge into: a gate firing mid-quiz
(Test 1) and a gate firing before a full, ungated reveal.

**Considered:** keeping the separate screen and CTA as originally built.

**Why:** Result -> Account is the steepest drop-off in the funnel model (write-up.md),
so an unearned extra click on it directly opposes the flow's own stated priority. Step-
level measurement isn't lost — `result_viewed` and `account_created` still fire as
distinct events at the same points, just without a screen boundary between them.

**AI's role:** user identified the friction and specified the fix directly; Claude
implemented it, including refactoring the duplicated form markup into one helper so the
two remaining standalone-emailGate code paths didn't drift from the inline version.

---

## 2026-09-24 — State machine: resolver function, not an index walk

**Decision:** `state.js`'s screen transitions are computed by a pure `resolveNextScreen()`
function of (current screen, answers, email-captured, `CONFIG`) — not by incrementing an
index through `CONFIG.flow.screens`. The email gate is not in that array at all; its
position is decided fresh on every transition from `CONFIG.emailGate` and
`CONFIG.result.revealMode`.

**Considered:** keeping the original index-walk skeleton (`screenIndex + 1` through a
flat array including `'emailGate'` at a fixed position).

**Why:** the index walk cannot express Test 1 (email gate moved from after Q8 to after
Q4) — a fixed array position can't make the gate interrupt the quiz mid-way and then
resume it. It also can't express a variant that skips `partialResult` for a full reveal.
Building the real screens first surfaced this: `state.shouldShowEmailGate()` existed in
the skeleton but nothing called it, which was the concrete signal the design was
incomplete. The resolver makes every variant in this session's scope (and Part 2's
gate-timing test specifically) a pure `CONFIG` edit, with the state machine unchanged —
the promise this project's whole architecture exists to keep.

**AI's role:** Claude identified the gap while implementing screens (before writing any
screen code) and proposed the resolver model with a worked transition table; verified by
simulating the full answer sequence for baseline and all 3 variant configs headlessly
before treating it as correct.

---

## 2026-09-24 — Variant delivery: shared files + config override

**Decision:** Part 2's 3 variants are separate entry HTML files
(`variant-N-<name>.html`) that load the same `src/` scripts as `index.html` and apply a
small inline `IQLY.CONFIG` override between the `config.js` and `main.js` tags.

**Considered:** (1) a dev-time bundler script that inlines everything into 4 fully
self-contained single-file HTML documents; (2) one fully-inlined `index.html`, with
each variant a full copy with one section changed.

**Why:** Option 2 is exactly the manual-duplication bug source the task warns against —
any shared-code fix has to be repeated by hand in 4 files. Option 1 reintroduces a build
step, which is a hard constraint violation for local development (must remember to
re-run it after every edit) even though the output itself is buildless. The chosen
option keeps a single source of truth for shared behavior and makes each test a
~10-line diff. `task.md` explicitly accepts a `.zip` of linked files for both Part 1 and
Part 2, so shipping the folder together is in-format.

**AI's role:** Claude proposed all three options with trade-offs; the user selected the
config-override approach via AskUserQuestion.

---

## 2026-09-24 — No ES modules; classic scripts on a global namespace

**Decision:** All JS files are classic `<script>` tags in a fixed dependency order,
each file attaching its exports to one global object, `IQLY`. No `import`/`export`.

**Considered:** ES modules (`<script type="module">`), which would give cleaner
explicit imports between `config.js`, `questions.js`, `state.js`, etc.

**Why:** `import`/`export` fail under `file://` CORS restrictions in every major
browser — opening `index.html` by double-click would silently break, violating the
hard "no backend, click index.html to run" constraint. Classic scripts with a shared
namespace preserve the same file separation without depending on a server.

**AI's role:** Claude identified the `file://` CORS constraint (a detail the user
had not raised) and proposed the classic-script/namespace pattern as the fix; the user
confirmed it via AskUserQuestion.
