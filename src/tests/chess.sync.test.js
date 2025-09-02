const { Chess } = require("chess.js");
const { serialize: serializeClock } = require("../chess/engine/clock.service");

test("chess:sync returns correct full game state", () => {
  const chess = new Chess();
  chess.move({ from: "e2", to: "e4" });
  chess.move({ from: "e7", to: "e5" });

  const game = {
    chess,
    players: { whiteId: 1, blackId: 2 },
    moves: [
      { from: "e2", to: "e4" },
      { from: "e7", to: "e5" },
    ],
    whiteTimeLeft: 300000,
    blackTimeLeft: 300000,
  };

  const syncPayload = {
    type: "chess:sync",
    fen: chess.fen(),
    moves: game.moves,
    turn: chess.turn() === "w" ? game.players.whiteId : game.players.blackId,
    whiteId: game.players.whiteId,
    blackId: game.players.blackId,
    whiteTimeLeft: game.whiteTimeLeft,
    blackTimeLeft: game.blackTimeLeft,
  };

  expect(syncPayload.fen).toMatch(/^rnbqkbnr/); // FEN starts with board
  expect(syncPayload.moves.length).toBe(2);
  expect(syncPayload.turn).toBe(game.players.whiteId); // after 2 ply, white again
  expect(syncPayload.whiteTimeLeft).toBe(300000);
});
