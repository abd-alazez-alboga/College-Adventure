const { Chess } = require("chess.js");
const { applyMove } = require("../chess/engine/move.service");

function makeGame() {
  return {
    chess: new Chess(),
    players: { whiteId: 1, blackId: 2 },
    moves: [],
  };
}

test("applyMove fails on illegal move", () => {
  const game = makeGame();
  const out = applyMove(game, { from: "e2", to: "e5" });
  expect(out.ok).toBe(false);
});

test("applyMove returns move + fen on success", () => {
  const game = makeGame();
  const out = applyMove(game, { from: "e2", to: "e4" });
  expect(out.ok).toBe(true);
  expect(out.move).toBeTruthy();
  expect(out.fen).toEqual(game.chess.fen());
});
