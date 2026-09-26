# Write-up PDF Spec — Branded, One-Page Deliverables

Status: Ready to implement
Depends on: write-up-part1.md, write-up-part2.md, write-up-part3.md
(existing content — source of truth for what goes on each page),
styles/tokens.css (navy accent + Space Grotesk headings), and the
project's existing logo file (Claude Code already knows its path in
this repo — use that file directly, do not regenerate or substitute a
different logo).

## Purpose

Convert the 3 existing markdown write-ups into submission-ready PDFs:
one page each, visually branded and consistent with each other (same
header treatment, same logo placement, same type system), matching
IQly's accepted format list (PDF is explicitly accepted for all 3
write-ups per task.md). This is a formatting/layout pass — the
written content itself is not being rewritten, only laid out and, if
it overflows a page, tightened for length.

Task.md only states an explicit 1-page limit for Part 1's write-up,
but the user wants all 3 held to the same one-page standard for
consistency across the submission — treat all 3 the same way.

---

## Approach

Build ONE shared HTML template (branded header with logo + title +
part number, consistent type scale, consistent margins/footer) that
each write-up's content is dropped into — not 3 independently-styled
documents that happen to look similar. Reuse this project's existing
pattern of building content as HTML and exporting via a headless tool,
rather than introducing a new document-generation dependency:
- If `creatives/export.js` (or similar) already has a working
  HTML→PDF or HTML→image pipeline (check what's already installed —
  `wkhtmltopdf`, a Puppeteer `page.pdf()` call, or similar), reuse
  that tool/pattern rather than adding a new one.
- If only an HTML→image path exists (e.g. `wkhtmltoimage`, used for
  Part 3's creatives) and nothing already does HTML→PDF, add the
  minimal equivalent (e.g. `wkhtmltopdf`, which is typically bundled
  alongside `wkhtmltoimage`, or Puppeteer's built-in PDF export) —
  don't reach for a heavier document-generation library for this.

## Page setup

- Page size: A4, portrait. Reasonable margins (e.g. ~20mm) — this is a
  minor formatting default, change it if the project already has an
  established page-size convention elsewhere, but don't leave it
  unspecified.
- One page, hard requirement. If a write-up's existing content doesn't
  fit at a legible font size (body text no smaller than ~10.5pt) after
  reasonable margin/line-height tightening, STOP and report back with
  which write-up overflows and by roughly how much, rather than either
  shrinking text past legibility or silently cutting content. Trimming
  prose for length is fine (tighten sentences, cut redundancy) as long
  as it doesn't remove a substantive point — flag anything you cut
  that changes meaning rather than just wording.

## Branding — shared across all 3

- **Header**: IQly logo (existing file) + document title (e.g. "Part 1
  — AI Quiz Flow: Write-up") in a consistent position at the top of
  the page across all 3 documents.
- **Type**: Space Grotesk for the title/section headings (per
  tokens.css's --font-heading), body text in the existing system font
  stack (--font-family) — same pairing already used in the dashboard
  and quiz flow, for visual consistency across every deliverable in
  this submission.
- **Color**: navy accent (--color-primary) for the header/title
  treatment and any section dividers; body text in --color-text on
  --color-bg (or plain white — check which reads better in print/PDF,
  since the warm off-white background token was designed for screen
  use and may not be necessary or desirable in a printed document).
- **Footer** (optional but nice): small page identifier, e.g. "IQly —
  AI Growth Builder Challenge — Part 1 of 3", consistent across all 3.
- No new colors or fonts beyond what's already in tokens.css — this
  should look like it belongs to the same submission as the quiz flow,
  dashboard, and creatives, not a separately-designed document.

## Content structure per document

Preserve each write-up's existing structure and substance — this is
about layout, not rewriting arguments. Reasonable formatting choices
within that: convert markdown headers to the page's heading styles,
keep paragraph breaks, convert markdown lists to styled bullet lists
if the content uses them. Part 2 and Part 3's write-ups are structured
as one paragraph per test/creative (3 each) — keep that structure
visually clear (e.g. a small heading or bold lead-in per
test/creative) rather than running them together as one undifferentiated
block.

## Output

- 3 PDF files: `write-up-part1.pdf`, `write-up-part2.pdf`,
  `write-up-part3.pdf` (matching the existing .md filenames, so
  there's no ambiguity about which replaces which).
- Keep the source .md files as-is — do not delete or overwrite them,
  the PDFs are a separate export for submission.
- Put the generated PDFs and any intermediate HTML template file(s)
  under a clearly-named location (e.g. `docs/write-ups-pdf/`) rather
  than scattering them at repo root.

## Verification

- Confirm each PDF is exactly 1 page (check page count
  programmatically, not just "looks like one page" in a preview).
- Open/screenshot each PDF (or the HTML template pre-export) at least
  once to visually confirm: logo renders (not a broken image link),
  no text is clipped or overflowing its container, and the 3 documents
  look like a matched set when placed side by side.
- Confirm the PDFs open correctly outside this project too — a PDF
  viewer, not just the HTML source — since that's the actual
  submission format.

---

## Build checklist (for Claude Code)

- [ ] Shared branded HTML template built (logo, title, type, color,
      footer) reused across all 3 documents
- [ ] Each write-up's existing content ported in without rewriting its
      substance
- [ ] All 3 fit exactly 1 page at a legible font size — no silent
      shrinking past ~10.5pt, no silent content cuts
- [ ] Any trimmed content that changes meaning (not just wording) is
      flagged back to the user, not silently dropped
- [ ] 3 PDFs exported: write-up-part1.pdf, write-up-part2.pdf,
      write-up-part3.pdf, saved under docs/write-ups-pdf/
- [ ] Source .md files untouched
- [ ] Page-count verified programmatically (=1 for each)
- [ ] Visual check done on rendered output (logo, no clipping,
      consistent look across all 3) — not just "export succeeded"
- [ ] Stop for review before considering this done