// src/chess/domain/time-controls.js

// Canonical list for queue validation and UI population (seconds).
const TIME_CONTROLS = Object.freeze([
  // Bullet
  { base: 60, increment: 0 },
  { base: 120, increment: 1 },
  // Blitz
  { base: 180, increment: 0 },
  { base: 180, increment: 2 },
  { base: 300, increment: 0 },
  { base: 300, increment: 3 },
  // Rapid
  { base: 600, increment: 0 },
  { base: 600, increment: 5 },
  { base: 900, increment: 10 },
  // Classical
  { base: 1800, increment: 0 },
  { base: 1800, increment: 20 },
]);

function isValidTimeControl({ base, increment }) {
  return TIME_CONTROLS.some(
    (t) => t.base === base && t.increment === increment
  );
}

module.exports = { TIME_CONTROLS, isValidTimeControl };
