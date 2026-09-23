/*
  questions.js — IQLY.QUESTIONS: quiz content only. No flow logic, no
  timing, no gate placement — that all belongs in config.js/state.js.
  This file is pure content so it can be edited (or A/B'd on question
  wording) without touching how the flow behaves.
*/

var IQLY = window.IQLY || {};

// Placeholder content — real question authoring happens when screens.js
// is built. Types match write-up.md: pattern, logic, spatial, memory, sequence.
IQLY.QUESTIONS = [
  { id: 'q1', type: 'pattern', prompt: 'Placeholder pattern question 1', options: [] },
  { id: 'q2', type: 'logic', prompt: 'Placeholder logic question 2', options: [] },
  { id: 'q3', type: 'spatial', prompt: 'Placeholder spatial question 3', options: [] },
  { id: 'q4', type: 'sequence', prompt: 'Placeholder sequence question 4', options: [] },
  { id: 'q5', type: 'memory', prompt: 'Placeholder memory question 5', options: [] },
  { id: 'q6', type: 'pattern', prompt: 'Placeholder pattern question 6', options: [] },
  { id: 'q7', type: 'logic', prompt: 'Placeholder logic question 7', options: [] },
  { id: 'q8', type: 'spatial', prompt: 'Placeholder spatial question 8', options: [] },
];

window.IQLY = IQLY;
