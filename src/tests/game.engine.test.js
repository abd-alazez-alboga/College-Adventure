const { Chess } = require("chess.js");
const { handleMove } = require("../chess/engine/game.engine");

function makeGame({
  fen,
  whiteId = 1,
  blackId = 2,
  baseMs = 60_000,
  incMs = 0,
}) {
  const chess = new Chess();
  if (fen) chess.load(fen);
  return {
    chess,
    players: { whiteId, blackId },
    moves: [],
    whiteTimeLeft: baseMs,
    blackTimeLeft: baseMs,
    increment: incMs,
    lastMoveTime: Date.now(), // pretend we just started
    startTime: Date.now(),
    finished: false,
  };
}

describe("game.engine.handleMove", () => {
  test("rejects move when it's not the player's turn", () => {
    const game = makeGame({});
    const notToMoveUser = game.players.blackId; // Black tries to move first
    const out = handleMove(game, notToMoveUser, { from: "e7", to: "e5" });
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/not your turn/i);
  });

  test("applies legal move and returns fen + clocks", () => {
    const game = makeGame({});
    const out = handleMove(game, game.players.whiteId, {
      from: "e2",
      to: "e4",
    });
    expect(out.ok).toBe(true);
    expect(out.move).toBeTruthy();
    expect(out.fen).toEqual(game.chess.fen());
    expect(out.clocks.white).toBeGreaterThanOrEqual(0);
    expect(out.clocks.black).toBeGreaterThanOrEqual(0);
  });

  test("illegal move returns error", () => {
    const game = makeGame({});
    const out = handleMove(game, game.players.whiteId, {
      from: "e2",
      to: "e5",
    }); // illegal
    expect(out.ok).toBe(false);
    expect(out.error).toMatch(/invalid move/i);
  });

  test("detects checkmate (Scholar's Mate)", () => {
    const game = makeGame({});
    const seq = [
      [game.players.whiteId, { from: "e2", to: "e4" }],
      [game.players.blackId, { from: "e7", to: "e5" }],
      [game.players.whiteId, { from: "d1", to: "h5" }],
      [game.players.blackId, { from: "b8", to: "c6" }],
      [game.players.whiteId, { from: "f1", to: "c4" }],
      [game.players.blackId, { from: "g8", to: "f6" }],
      [game.players.whiteId, { from: "h5", to: "f7" }],
    ];
    let finished = null;
    for (const [uid, mv] of seq) {
      const out = handleMove(game, uid, mv);
      expect(out.ok).toBe(true);
      if (out.finished) {
        finished = out.finished;
        break;
      }
    }
    expect(finished).toBeTruthy();
    expect(finished.reason).toBe("checkmate");
  });

  test("flags timeout for the side to move when their clock is already expired", () => {
    const game = makeGame({ baseMs: 10 }); // very tiny time
    // Let white's time run out by faking lastMoveTime in the past
    game.lastMoveTime = Date.now() - 50_000; // 50s ago
    const out = handleMove(game, game.players.whiteId, {
      from: "e2",
      to: "e4",
    });
    // engine ticks before move and should timeout white
    expect(out.ok).toBe(true);
    expect(out.finished).toBeTruthy();
    expect(out.finished.reason).toBe("timeout");
    // winnerOverride must be black
    expect(out.finished.winnerOverride).toBe(game.players.blackId);
  });
});
