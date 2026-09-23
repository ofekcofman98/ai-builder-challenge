/*
  questions.js — IQLY.QUESTIONS / IQLY.SOFT_ENTRY_QUESTION: quiz content
  only. No flow logic, no timing, no gate placement — that all belongs in
  config.js/state.js. This file is pure content so wording/visuals can be
  edited (or A/B'd) without touching how the flow behaves.

  Pattern/spatial questions render an inline SVG via svgGrid() below —
  inline only, so the offline/no-CDN/no-asset-file constraint holds.
  Logic/sequence/memory questions are text-only.
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

function shapeMarkup(shape, count, cellX, cellSize) {
  var out = '';
  var r = 8;
  var spacing = 18;
  var startX = cellX + cellSize / 2 - ((count - 1) * spacing) / 2;
  var cy = cellSize / 2;

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

// Q0 — unscored. Age range, not a generic demographic: IQ scores are
// genuinely age-normed, so asking reinforces the methodology claim on the
// entry screen instead of feeling like an arbitrary data grab.
IQLY.SOFT_ENTRY_QUESTION = {
  id: 'q0',
  prompt: "First, what's your age range?",
  options: ['Under 18', '18–24', '25–34', '35–44', '45+'],
};

IQLY.QUESTIONS = [
  // Easy first two — early wins reduce early-abandonment risk.
  {
    id: 'q1',
    type: 'sequence',
    category: 'sequence',
    prompt: 'What comes next in the sequence? 2, 4, 6, 8, __',
    options: ['9', '10', '12', '16'],
    correctIndex: 1,
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
    correctIndex: 0,
  },
  {
    id: 'q4',
    type: 'spatial',
    category: 'spatial',
    prompt: 'If you rotate a square 90° clockwise, which shape results?',
    render: function () {
      return svgGrid([{ shape: 'square', count: 1 }]);
    },
    options: [
      'An identical square',
      'A rectangle',
      'A triangle',
      'A rotated square (same outline)',
    ],
    correctIndex: 3,
  },
  {
    id: 'q5',
    type: 'memory',
    category: 'memory',
    prompt: 'Memorize this sequence, then select it: 7 - 2 - 9 - 4',
    options: ['7 - 2 - 9 - 4', '7 - 2 - 4 - 9', '2 - 7 - 9 - 4', '7 - 9 - 2 - 4'],
    correctIndex: 0,
  },
  // Hardest cluster around Q6–Q7.
  {
    id: 'q6',
    type: 'pattern',
    category: 'pattern',
    prompt: 'Which shape completes the pattern?',
    render: function () {
      return svgGrid([
        { shape: 'triangle', count: 3 },
        { shape: 'triangle', count: 2 },
        { shape: 'blank', count: 0 },
      ]);
    },
    options: ['1 triangle', '2 triangles', '3 triangles', '4 triangles'],
    correctIndex: 0,
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
