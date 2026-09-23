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
