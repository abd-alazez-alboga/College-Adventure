const { insertUserMatch } = require("../data/history.repo");
const { setUserElo, setLastColor } = require("../data/user.repo");
const { updateOnFinish } = require("../data/match.repo");
const { eloDelta } = require("../domain/elo.service");

/**
 * Apply Elo and update match records for both players.
 * Returns a WS payload { type:'chess:result', reason, winnerId, white, black }.
 */
async function finishMatch({
  matchId,
  winnerId, // null for draw or abort/disconnect when treated externally
  reason, // 'checkmate'|'draw'|'timeout'|'disconnect'|'aborted'
  moves,
  durationSeconds,
  whiteTimeLeft,
  blackTimeLeft,
  playerWhite, // { user_id, username, elo_chess }
  playerBlack, // { user_id, username, elo_chess }
  gameStatus, // 'completed' | 'aborted'
}) {
  const isDraw = winnerId === null && reason === "draw";
  const whiteWon = winnerId === playerWhite.user_id;
  const blackWon = winnerId === playerBlack.user_id;

  // Determine results
  const resultWhite = isDraw
    ? "draw"
    : whiteWon
    ? "win"
    : blackWon
    ? "loss"
    : "loss";
  const resultBlack = isDraw
    ? "draw"
    : blackWon
    ? "win"
    : whiteWon
    ? "loss"
    : "loss";

  const whiteEloBefore = playerWhite.elo_chess;
  const blackEloBefore = playerBlack.elo_chess;

  // Compute Elo using proper expected score model
  let whiteDelta = 0;
  let blackDelta = 0;
  if (isDraw) {
    whiteDelta = eloDelta(whiteEloBefore, blackEloBefore, 0.5);
    blackDelta = eloDelta(blackEloBefore, whiteEloBefore, 0.5);
  } else if (whiteWon) {
    whiteDelta = eloDelta(whiteEloBefore, blackEloBefore, 1);
    blackDelta = eloDelta(blackEloBefore, whiteEloBefore, 0);
  } else if (blackWon) {
    whiteDelta = eloDelta(whiteEloBefore, blackEloBefore, 0);
    blackDelta = eloDelta(blackEloBefore, whiteEloBefore, 1);
  } else {
    // winnerId might be null for timeout/disconnect routed externally; treat as draw
    whiteDelta = eloDelta(whiteEloBefore, blackEloBefore, 0.5);
    blackDelta = eloDelta(blackEloBefore, whiteEloBefore, 0.5);
  }

  const whiteEloAfter = whiteEloBefore + whiteDelta;
  const blackEloAfter = blackEloBefore + blackDelta;

  // Persist Elo and last color
  await setUserElo(playerWhite.user_id, whiteEloAfter);
  await setUserElo(playerBlack.user_id, blackEloAfter);
  await setLastColor(playerWhite.user_id, "white");
  await setLastColor(playerBlack.user_id, "black");

  // Update match row
  await updateOnFinish({
    matchId,
    winnerId,
    movesJson: JSON.stringify(moves || []),
    durationSeconds,
    whiteTimeLeft,
    blackTimeLeft,
    status: gameStatus,
  });

  // Save history for both users
  await insertUserMatch({
    userId: playerWhite.user_id,
    matchId,
    role: "white",
    result: resultWhite,
    eloBefore: whiteEloBefore,
    eloAfter: whiteEloAfter,
    opponentId: playerBlack.user_id,
    opponentUsername: playerBlack.username,
    opponentEloBefore: blackEloBefore,
    opponentEloAfter: blackEloAfter,
    durationSeconds,
    moves,
  });

  await insertUserMatch({
    userId: playerBlack.user_id,
    matchId,
    role: "black",
    result: resultBlack,
    eloBefore: blackEloBefore,
    eloAfter: blackEloAfter,
    opponentId: playerWhite.user_id,
    opponentUsername: playerWhite.username,
    opponentEloBefore: whiteEloBefore,
    opponentEloAfter: whiteEloAfter,
    durationSeconds,
    moves,
  });

  // WS result payload
  return {
    type: "chess:result",
    reason,
    winnerId,
    white: {
      id: playerWhite.user_id,
      eloBefore: whiteEloBefore,
      eloAfter: whiteEloAfter,
    },
    black: {
      id: playerBlack.user_id,
      eloBefore: blackEloBefore,
      eloAfter: blackEloAfter,
    },
  };
}

module.exports = { finishMatch };
