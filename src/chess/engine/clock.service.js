// src/chess/engine/clock.service.js

/**
 * Server-authoritative clocks.
 *
 * We subtract ONLY the side to move since the last tick (game.lastMoveTime),
 * then apply increment to the side that just moved.
 *
 * Returns:
 *   {
 *     white: number,   // ms
 *     black: number,   // ms
 *     timedOut: boolean,
 *     loserColor?: 'w' | 'b'
 *   }
 */
function tickOnMove(game, turnBeforeMove /* 'w' | 'b' */) {
  const now = Date.now();
  const elapsed = Math.max(0, now - (game.lastMoveTime || now));
  let timedOut = false;
  let loserColor;

  if (turnBeforeMove === "w") {
    game.whiteTimeLeft -= elapsed;
    if (game.whiteTimeLeft <= 0) {
      timedOut = true;
      loserColor = "w";
      game.whiteTimeLeft = 0;
    } else {
      game.whiteTimeLeft += game.increment;
    }
  } else {
    game.blackTimeLeft -= elapsed;
    if (game.blackTimeLeft <= 0) {
      timedOut = true;
      loserColor = "b";
      game.blackTimeLeft = 0;
    } else {
      game.blackTimeLeft += game.increment;
    }
  }

  game.lastMoveTime = now;

  return {
    white: game.whiteTimeLeft,
    black: game.blackTimeLeft,
    timedOut,
    loserColor,
  };
}

/** Serialize for outbound messages / sync */
function serialize(game) {
  return {
    white: game.whiteTimeLeft,
    black: game.blackTimeLeft,
  };
}

module.exports = {
  tickOnMove,
  serialize,
};
