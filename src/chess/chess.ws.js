// src/chess/chess.ws.js

const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const { Chess } = require("chess.js");
const { getMatch, setStarted } = require("./data/match.repo");
const { broadcast } = require("./ws/broadcaster");
const { handleMove } = require("./engine/game.engine");
const { finishMatch } = require("./engine/result.service");
const state = require("./engine/game.state");

const matchWss = new WebSocket.Server({ noServer: true });
const HEARTBEAT_MS = 30000;

function setupHeartbeatOnce(wss) {
  if (wss._heartbeatInterval) return;
  wss._heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws._isAlive === false) {
        try {
          ws.terminate();
        } catch {}
        return;
      }
      ws._isAlive = false;
      try {
        ws.ping();
      } catch {}
    });
  }, HEARTBEAT_MS);
}

function setupMatchWebSocketHandler(req, socket, head) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get("token");
  let matchId = url.searchParams.get("matchId");
  if (!matchId) {
    const m = url.pathname.match(/^\/match\/([0-9a-fA-F-]+)$/);
    if (m) matchId = m[1];
  }

  if (!matchId || !token) {
    socket.write("HTTP/1.1 400 Bad Request\r\n\r\n");
    socket.destroy();
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    req.matchId = matchId;
    matchWss.handleUpgrade(req, socket, head, (ws) => {
      matchWss.emit("connection", ws, req);
    });
  } catch {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
  }
}

matchWss.on("connection", async (ws, req) => {
  setupHeartbeatOnce(matchWss);
  ws._isAlive = true;
  ws.on("pong", () => (ws._isAlive = true));

  const matchId = req.matchId;
  const userId = req.user.userId;

  if (!state.hasGame(matchId)) {
    try {
      // Pull match + players with correct casing and nested users.
      const match = await getMatch(matchId, { withPlayers: true });
      if (!match) {
        ws.send(
          JSON.stringify({ type: "chess:error", error: "Match not found" })
        );
        return ws.close();
      }

      const chess = new Chess();
      const storedMoves = Array.isArray(match.moves) ? match.moves : [];
      for (const m of storedMoves) {
        chess.move(m);
      }

      // Times are already stored in ms.
      const baseWhite = Number.isFinite(match.white_time_left)
        ? match.white_time_left
        : 5 * 60 * 1000;
      const baseBlack = Number.isFinite(match.black_time_left)
        ? match.black_time_left
        : baseWhite;
      const incrementMs = (match.increment || 0) * 1000;

      state.setGame(matchId, {
        chess,
        players: { whiteId: match.player1_id, blackId: match.player2_id },
        moves: storedMoves,
        whiteTimeLeft: baseWhite,
        blackTimeLeft: baseBlack,
        increment: incrementMs,
        lastMoveTime: Date.now(),
        startTime: match.start_time
          ? new Date(match.start_time).getTime()
          : null,
        disconnectTimers: {},
        finished: false,
      });
      try {
        const g = state.getGame(matchId);
        console.log(
          `[STATE] setGame match=${matchId} players=${JSON.stringify(
            g.players || {}
          )}`
        );
      } catch {}
    } catch (err) {
      console.error("DB error initializing match:", err);
      return ws.close();
    }
  }

  const game = state.getGame(matchId);
  const { chess, players, moves } = game;
  // Normalize types to avoid strict-equality mismatches (e.g., "1" vs 1)
  const normalized = {
    whiteId:
      typeof players.whiteId === "string"
        ? Number(players.whiteId)
        : players.whiteId,
    blackId:
      typeof players.blackId === "string"
        ? Number(players.blackId)
        : players.blackId,
    userId: typeof userId === "string" ? Number(userId) : userId,
  };
  const isPlayer = [normalized.whiteId, normalized.blackId].includes(
    normalized.userId
  );
  console.log(
    `[WS] connect match=${matchId} uid=${userId} (type=${typeof userId}) players=` +
      `${JSON.stringify(
        players
      )} isPlayer=${isPlayer} types(w=${typeof players.whiteId}, b=${typeof players.blackId})`
  );

  if (!isPlayer) {
    state.addSpectator(matchId, ws);
    ws.send(
      JSON.stringify({
        type: "chess:sync",
        fen: chess.fen(),
        moves,
        turn: chess.turn() === "w" ? players.whiteId : players.blackId,
        whiteId: players.whiteId,
        blackId: players.blackId,
        role: "spectator",
        whiteTimeLeft: game.whiteTimeLeft,
        blackTimeLeft: game.blackTimeLeft,
      })
    );
    ws.on("close", () => state.removeSpectator(matchId, ws));
    return;
  }

  ws._userId = normalized.userId;
  state.addClient(matchId, ws);
  state.clearDisconnectTimer(matchId, userId);

  // Initial sync for players too (makes client simpler)
  ws.send(
    JSON.stringify({
      type: "chess:sync",
      fen: chess.fen(),
      moves,
      turn: chess.turn() === "w" ? players.whiteId : players.blackId,
      whiteId: players.whiteId,
      blackId: players.blackId,
      role: normalized.userId === normalized.whiteId ? "white" : "black",
      whiteTimeLeft: game.whiteTimeLeft,
      blackTimeLeft: game.blackTimeLeft,
    })
  );

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw);
      const type = data.type;

      if (type === "chess:move") {
        if (game.finished) return;
        const outcome = handleMove(game, userId, data.move);

        if (!outcome.ok) {
          ws.send(
            JSON.stringify({
              type: "chess:error",
              error: outcome.error || "Invalid move",
            })
          );
          return;
        }

        if (!game.startTime) {
          game.startTime = Date.now();
          await setStarted(matchId);
        }

        const { from, to, promotion } = data.move || {};
        game.moves.push({ from, to, promotion });

        const allSockets = state.getAllSockets(matchId);

        if (outcome.move && outcome.fen) {
          broadcast(allSockets, {
            type: "chess:move",
            move: outcome.move,
            fen: outcome.fen,
          });
        }
        if (outcome.clocks) {
          broadcast(allSockets, {
            type: "chess:clock",
            white: outcome.clocks.white,
            black: outcome.clocks.black,
          });
        }

        if (outcome.finished) {
          const { reason, winnerOverride } = outcome.finished;
          return await endAndBroadcast({
            matchId,
            game,
            reason,
            winnerOverride: winnerOverride ?? null,
          });
        }
      }

      if (type === "chess:sync") {
        ws.send(
          JSON.stringify({
            type: "chess:sync",
            fen: chess.fen(),
            moves,
            turn: chess.turn() === "w" ? players.whiteId : players.blackId,
            whiteId: players.whiteId,
            blackId: players.blackId,
            whiteTimeLeft: game.whiteTimeLeft,
            blackTimeLeft: game.blackTimeLeft,
          })
        );
      }
    } catch (err) {
      console.error("WebSocket error:", err);
      ws.send(
        JSON.stringify({ type: "chess:error", error: "Invalid message format" })
      );
    }
  });

  ws.on("close", () => {
    state.removeClient(matchId, ws);
    state.startDisconnectTimer(matchId, userId, 60000, async () => {
      const stillDisconnected = !state.someoneWithUserIdConnected(
        matchId,
        userId
      );
      if (!stillDisconnected || game.finished) return;
      if (!game.moves || game.moves.length === 0) {
        return await endAndBroadcast({
          matchId,
          game,
          reason: "aborted",
          winnerOverride: null,
        });
      }
      const winnerId =
        userId === game.players.whiteId
          ? game.players.blackId
          : game.players.whiteId;
      return await endAndBroadcast({
        matchId,
        game,
        reason: "disconnect",
        winnerOverride: winnerId,
      });
    });
  });

  async function endAndBroadcast({
    matchId,
    game,
    reason,
    winnerOverride = null,
  }) {
    if (game.finished) return;
    game.finished = true;

    try {
      const match = await getMatch(matchId, { withPlayers: true });

      const playerWhite = match.player_white;
      const playerBlack = match.player_black;

      if (!playerWhite || !playerBlack) {
        throw new Error("Missing player data on match object");
      }

      const payload = await finishMatch({
        matchId,
        winnerId: winnerOverride,
        reason,
        moves: game.moves || [],
        durationSeconds: Math.floor(
          (Date.now() - (game.startTime || Date.now())) / 1000
        ),
        whiteTimeLeft: game.whiteTimeLeft,
        blackTimeLeft: game.blackTimeLeft,
        playerWhite,
        playerBlack,
        gameStatus: reason === "aborted" ? "aborted" : "completed",
      });

      const allSockets = state.getAllSockets(matchId);
      if (payload) broadcast(allSockets, payload);
    } catch (err) {
      console.error("Error finishing match:", err);
    } finally {
      state.cleanup(matchId);
    }
  }
});

module.exports = { setupMatchWebSocketHandler };
