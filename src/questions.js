/*
  questions.js — IQLY.QUESTIONS / IQLY.SOFT_ENTRY_QUESTION: quiz content
  only. No flow logic, no timing, no gate placement — that all belongs in
  config.js/state.js. This file is pure content so wording/visuals can be
  edited (or A/B'd) without touching how the flow behaves.

  Pattern/spatial questions render an inline SVG via svgGrid() below —
  inline only, so the offline/no-CDN/no-asset-file constraint holds.
  Logic/sequence/memory questions are text-only.

  optionShapes (additive, optional): parallel array to `options`, one
  {shape, count} per option, rendered as a small monochrome icon next to
  the option text via optionIcon() below — see screens.js's quiz(). Only
  present where an option's meaning reduces cleanly to shape+count (q1,
  q3); q4's options ("a rectangle", "a rotated square") aren't expressible
  in shapeMarkup()'s vocabulary, so it stays text-only rather than forcing
  a mismatched icon.

  q1 is a 3x3 matrix pattern question, not the simple sequence question
  the "easy first" framing below might imply — it lives at position 0
  specifically so the ad creative's per-answer deep link can target it
  (see q1's own comment for the full reasoning and the difficulty-curve
  trade-off that decision accepted).
*/

var IQLY = window.IQLY || {};

(function () {

// Builds a small square-grid SVG of shapes for matrix/pattern questions.
// cells: array of {shape:'circle'|'square'|'triangle'|'blank', count:n}
// laid out left-to-right, one row.
function svgGrid(cells) {
  var cellSize = 64;
  var gap = 8;
  var width = cells.length * cellSize + (cells.length - 1) * gap;
  var svg = '<svg viewBox="0 0 ' + width + ' ' + cellSize + '" width="100%" ' +
    'height="auto" style="max-width:280px" aria-hidden="true">';

  cells.forEach(function (cell, i) {
    var x = i * (cellSize + gap);
    svg += '<rect x="' + x + '" y="0" width="' + cellSize + '" height="' + cellSize +
      '" fill="none" stroke="var(--color-border)" stroke-width="2" rx="8"/>';
    if (cell.shape === 'blank') {
      svg += '<text x="' + (x + cellSize / 2) + '" y="' + (cellSize / 2 + 8) +
        '" text-anchor="middle" font-size="28" fill="var(--color-text-muted)">?</text>';
      return;
    }
    var shapeSvg = shapeMarkup(cell.shape, cell.count, x, cellSize);
    svg += shapeSvg;
  });

  svg += '</svg>';
  return svg;
}

// Genuine 2D grid, separate from svgGrid() (which stays single-row,
// unchanged — q3 still uses it as-is). rows: array of arrays of
// {shape, count} or {shape:'blank'}, one inner array per row. Reuses
// shapeMarkup() for cell content, same as svgGrid() — no duplicated
// shape-drawing logic.
//
// cellSize defaults to 64px (matching svgGrid()'s single-row cell size) —
// question-content's shared 168px min-height is a floor, not a cap, and a
// matrix question (q6, currently the only caller) is explicitly allowed
// its own height budget past that floor rather than being squeezed to fit
// alongside every text-only question (see AI_WORKFLOW.md's entry: this
// grid's answer layout is already structurally different from the rest —
// a 2x2 icon grid, not a text column — so a taller question-content here
// doesn't introduce a new inconsistency beyond what already exists).
// Verified the actual rendered height fits without scroll at 360/390/480
// widths via Puppeteer, not assumed.
function svgGridMatrix(rows, cellSize) {
  cellSize = cellSize || 48;
  var gap = 6;
  // Scale is derived from the DENSEST cell in this matrix, not a fixed
  // cellSize/64 ratio — a fixed ratio sized shapes to fit a "typical"
  // count, but a cell with more shapes than that (this question's count-5
  // cells) still overflowed its own border at any fixed ratio, since
  // count and cellSize were scaled independently. Confirmed visually at
  // the ad creative's 1080x1920 scale, where the overflow was clearly
  // visible (not just a rounding-error sliver at the quiz's compact
  // size). Solving for the count that needs the most room guarantees
  // every cell's shapes fit, and keeps one shared scale across the whole
  // matrix — same principle as optionIcon()'s shared canvasSize: shapes
  // being compared to each other must stay at a consistent relative
  // scale, not be individually stretched to fill their own cell.
  var maxCount = 1;
  rows.forEach(function (row) {
    row.forEach(function (cell) {
      if (cell.shape !== 'blank' && cell.count > maxCount) maxCount = cell.count;
    });
  });
  var neededSpan = (maxCount - 1) * 18 + 8 * 2;
  var scale = Math.min(1, cellSize / neededSpan);
  var numCols = Math.max.apply(null, rows.map(function (row) { return row.length; }));
  var numRows = rows.length;
  var width = numCols * cellSize + (numCols - 1) * gap;
  var height = numRows * cellSize + (numRows - 1) * gap;
  // Explicit pixel width/height, not width:100%+max-width — that combo
  // made the *cap*, not cellSize, the actual source of truth for rendered
  // size (and an inline max-width always wins over an HTML width
  // attribute, which silently broke creative-1080x1920.html until it
  // added an explicit override — see that file's comment). cellSize now
  // directly determines pixel size with nothing else able to override it;
  // .question-visual's flex centering still centers it either way.
  var svg = '<svg viewBox="0 0 ' + width + ' ' + height + '" width="' + width +
    '" height="' + height + '" aria-hidden="true">';

  rows.forEach(function (row, rowIndex) {
    var y = rowIndex * (cellSize + gap);
    row.forEach(function (cell, colIndex) {
      var x = colIndex * (cellSize + gap);
      svg += '<rect x="' + x + '" y="' + y + '" width="' + cellSize + '" height="' + cellSize +
        '" fill="none" stroke="var(--color-border)" stroke-width="2" rx="4"/>';
      if (cell.shape === 'blank') {
        svg += '<text x="' + (x + cellSize / 2) + '" y="' + (y + cellSize / 2 + cellSize * 0.16) +
          '" text-anchor="middle" font-size="' + Math.round(cellSize * 0.45) +
          '" fill="var(--color-text-muted)">?</text>';
        return;
      }
      svg += shapeMarkup(cell.shape, cell.count, x, cellSize, y, scale);
    });
  });

  svg += '</svg>';
  return svg;
}

// cellY defaults to 0 — svgGrid() and optionIcon() are single-row callers
// that never pass it, so cy resolves the same as before this parameter
// existed. svgGridMatrix() below is the only caller that passes a
// non-zero cellY, for its multi-row layout.
//
// scale defaults to 1 — every existing caller (svgGrid() at cellSize=64,
// optionIcon() at its own computed canvasSize) keeps its exact prior
// r=8/spacing=18 absolute pixel sizing. svgGridMatrix() is the only
// caller that passes a non-1 scale, proportional to its own (much
// smaller) cellSize — without it, a dense cell (this question's row of
// 5 circles) can't fit inside a compact matrix cell at fixed absolute
// spacing; scaling both together keeps shapes correctly proportioned to
// whatever cell size they're drawn into instead of overflowing it.
function shapeMarkup(shape, count, cellX, cellSize, cellY, scale) {
  var out = '';
  scale = scale || 1;
  var r = 8 * scale;
  var spacing = 18 * scale;
  var startX = cellX + cellSize / 2 - ((count - 1) * spacing) / 2;
  var cy = (cellY || 0) + cellSize / 2;

  for (var i = 0; i < count; i++) {
    var cx = startX + i * spacing;
    if (shape === 'circle') {
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--color-primary)"/>';
    } else if (shape === 'square') {
      out += '<rect x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + (r * 2) +
        '" height="' + (r * 2) + '" fill="var(--color-primary)"/>';
    } else if (shape === 'triangle') {
      out += '<polygon points="' + cx + ',' + (cy - r) + ' ' + (cx - r) + ',' + (cy + r) +
        ' ' + (cx + r) + ',' + (cy + r) + '" fill="var(--color-primary)"/>';
    }
  }
  return out;
}

// Computes the snug canvas size for an icon showing `count` shapes —
// shapeMarkup()'s r/spacing constants are absolute, so this is how much
// room `count` shapes need plus fixed padding. Exposed separately from
// optionIcon() below so callers can compute ONE shared size from a
// question's largest option count and reuse it for every option's icon —
// see optionIcon()'s own comment for why a per-option size is wrong.
function iconCanvasSize(count) {
  var r = 8;
  var spacing = 18;
  var padding = 6;
  var contentSize = (count - 1) * spacing + r * 2;
  return contentSize + padding * 2;
}

// Renders a single small SVG icon for one answer option — shape+count
// only, monochrome (var(--color-primary), no other colors), reusing
// shapeMarkup(). Additive: only questions with an `optionShapes` field
// use this (screens.js's quiz() wires it in); every other question
// renders text-only, unchanged.
//
// No pixel width/height on the <svg> — only viewBox. Sizing is entirely
// CSS's job (.option-icon { width:100%; height:100%; } in components.css),
// so there is exactly one source of truth for how big the icon renders:
// its container's size. An icon with its own px dimensions and a
// separately-sized button was what caused the icon/button size
// back-and-forth this replaced — two independent numbers that had to be
// hand-tuned against each other instead of one relationship (100% of
// container) that always holds.
//
// canvasSize is a required, explicit parameter — NOT derived from `count`
// internally — because every option within one question must share the
// same canvasSize (screens.js's quiz() computes it once from the
// question's largest option count and passes it to every option's icon).
// A canvasSize derived per-option from its own count would crop a
// single-shape option's viewBox tighter than a three-shape option's, and
// since CSS then scales every icon to the same physical cell size, the
// single shape would stretch to fill that cell and render visibly larger
// than an individual shape inside the three-shape icon — same absolute
// shape radius (r=8), different apparent size. A shared canvasSize keeps
// every shape at the same absolute scale; a small-count option just sits
// in more empty space around it instead of being stretched to fill it.
function optionIcon(shape, count, canvasSize) {
  return '<svg class="option-icon" viewBox="0 0 ' + canvasSize + ' ' + canvasSize +
    '" aria-hidden="true">' +
    shapeMarkup(shape, count, 0, canvasSize) +
  '</svg>';
}

IQLY.iconCanvasSize = iconCanvasSize;
IQLY.optionIcon = optionIcon;

// Q0 — unscored. Age range, not a generic demographic: IQ scores are
// genuinely age-normed, so asking reinforces the methodology claim on the
// entry screen instead of feeling like an arbitrary data grab.
IQLY.SOFT_ENTRY_QUESTION = {
  id: 'q0',
  prompt: "First, what's your age range?",
  options: ['Under 18', '18–24', '25–34', '35–44', '45+'],
};

IQLY.QUESTIONS = [
  // q1 is now the 3x3 matrix pattern question (formerly q6) — moved here
  // specifically so creative-1080x1920-interactive.html's per-answer deep
  // link (?q1=<index>) can target it: src/main.js's readAnswerParam()
  // parses the question index straight from the qN query-param NAME (not
  // from any question's `id` field), matched against array position, and
  // only ever honors index 0 (the first unanswered question) — see that
  // file's comment. There is no app mechanism to deep-link to an
  // arbitrary later question, so putting the matrix at array position 0
  // was the only way to make Build B show a deep-linkable icon-grid
  // question at all, per the user's explicit choice among the options
  // presented (see AI_WORKFLOW.md's dated entry).
  //
  // Trade-off, called out rather than silently absorbed: this question was
  // originally placed at position 6 specifically as part of a "hardest
  // cluster around Q6-Q7" difficulty curve, with q1/q2 deliberately easy
  // ("early wins reduce early-abandonment risk"). Opening the quiz with a
  // 3x3 arithmetic matrix instead of a simple sequence question works
  // against that curve. Accepted here because the ad-creative deep-link
  // requirement was explicit; if the difficulty-curve concern outweighs
  // it later, the fix is either accepting Build B stays q1-only-in-spirit
  // (the "keep Build B on the old q1" option) or adding real app support
  // for skipping to an arbitrary question index.
  {
    id: 'q1',
    type: 'pattern',
    category: 'pattern',
    prompt: 'Which shape completes the pattern?',
    render: function () {
      return svgGridMatrix([
        [{ shape: 'square', count: 1 }, { shape: 'square', count: 2 }, { shape: 'square', count: 3 }],
        [{ shape: 'triangle', count: 1 }, { shape: 'triangle', count: 2 }, { shape: 'triangle', count: 3 }],
        [{ shape: 'circle', count: 1 }, { shape: 'circle', count: 2 }, { shape: 'blank' }],
      ]);
    },
    // Distractors: 6 continues the diagonal sequence (1,3,5.. not the row
    // rule); 7 sums across rows instead of within a row; 9 is a generic
    // increasing guess. 8 (3+5) is correct and deliberately not first.
    options: ['3 triangles', '2 circles', '3 circles', '2 squares'],
    optionShapes: [
      { shape: 'triangle', count: 3 },
      { shape: 'circle', count: 2 },
      { shape: 'circle', count: 3 },
      { shape: 'square', count: 2 },
    ],
    correctIndex: 2,
  },
  {
    id: 'q2',
    type: 'logic',
    category: 'logic',
    prompt: 'All Zips are Zops. Some Zops are Zaps. Which must be true?',
    options: [
      'All Zips are Zaps',
      'Some Zaps are Zips',
      'Some Zips may be Zaps',
      'No Zips are Zaps',
    ],
    correctIndex: 2,
  },
  {
    id: 'q3',
    type: 'pattern',
    category: 'pattern',
    prompt: 'Which shape completes the pattern?',
    render: function () {
      return svgGrid([
        { shape: 'circle', count: 1 },
        { shape: 'circle', count: 2 },
        { shape: 'blank', count: 0 },
      ]);
    },
    options: ['3 circles', '2 squares', '1 triangle', '3 triangles'],
    // Parallel to `options`, one entry each — see optionIcon() above.
    optionShapes: [
      { shape: 'circle', count: 3 },
      { shape: 'square', count: 2 },
      { shape: 'triangle', count: 1 },
      { shape: 'triangle', count: 3 },
    ],
    correctIndex: 0,
  },
  // Replaced the original rotate-a-square question: its single-cell
  // svgGrid() render had no second cell to set the aspect ratio against,
  // so the SVG's width:100% scaled it up to fill the full question-visual
  // width at 1:1 — 200px+ tall on most viewports, pushing the option
  // buttons down and breaking question-content's fixed-height contract
  // (docs/fixes.md's "image too big, moves the answers" report). Text-only
  // spatial reasoning sidesteps the bug instead of patching svgGrid()'s
  // single-cell scaling for one question.
  {
    id: 'q4',
    type: 'spatial',
    category: 'spatial',
    prompt: 'A cube is painted red on all 6 faces, then cut into 27 equal smaller cubes. How many of the small cubes have paint on exactly 2 faces?',
    options: ['6', '8', '12', '20'],
    correctIndex: 2,
  },
  // Replaced the original "memorize then select it" question — the
  // correct option was character-for-character identical to the prompt,
  // so it was answerable by matching visible text against visible text,
  // not by memorizing anything (no timed hide/reveal step exists to make
  // that work). Reverse-digit-span is a standard working-memory task that
  // doesn't have this flaw: none of the options match the prompt's
  // sequence verbatim, so it requires actually holding the sequence in
  // mind and manipulating it, not copying it.
  {
    id: 'q5',
    type: 'memory',
    category: 'memory',
    prompt: 'Reverse this sequence: 7 - 2 - 9 - 4',
    options: ['4 - 9 - 2 - 7', '7 - 2 - 9 - 4', '4 - 2 - 9 - 7', '9 - 2 - 7 - 4'],
    correctIndex: 0,
  },
  // Formerly q1 — the matrix pattern question that used to live here moved
  // to array position 0 (see that question's comment for why). This plain
  // sequence question took its place so the "hardest cluster around
  // Q6-Q7" slot still has *a* question in it, even though the difficulty
  // curve this was meant to preserve is now broken by the swap above.
  {
    id: 'q6',
    type: 'sequence',
    category: 'sequence',
    prompt: 'What comes next in the sequence? 2, 4, 6, 8, __',
    options: ['9', '10', '12', '16'],
    correctIndex: 1,
  },
  {
    id: 'q7',
    type: 'sequence',
    category: 'sequence',
    prompt: 'What comes next? 1, 1, 2, 3, 5, 8, __',
    options: ['11', '12', '13', '10'],
    correctIndex: 2,
  },
  {
    id: 'q8',
    type: 'logic',
    category: 'logic',
    prompt: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
    options: ['0°', '7.5°', '15°', '30°'],
    correctIndex: 1,
  },
];

window.IQLY = IQLY;

})();
