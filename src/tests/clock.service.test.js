const { tickOnMove } = require("../chess/engine/clock.service");
const { Chess } = require("chess.js");

function baseGame() {
  return {
    chess: new Chess(),
    players: { whiteId: 1, blackId: 2 },
    whiteTimeLeft: 1000, // 1s
    blackTimeLeft: 1000,
    increment: 500, // 0.5s per move
    lastMoveTime: Date.now() - 400, // pretend 0.4s elapsed
  };
}

test("tickOnMove subtracts elapsed from the moving side and adds increment", () => {
  const game = baseGame();
  const turn = game.chess.turn(); // 'w'
  const out = tickOnMove(game, turn);
  expect(out.timedOut).toBe(false);
  // white should be decreased by ~400 then +500 increment → net +100
  expect(game.whiteTimeLeft).toBeGreaterThan(1000);
  expect(game.blackTimeLeft).toBe(1000);
});
