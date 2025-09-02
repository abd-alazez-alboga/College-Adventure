// src/chess/engine/game.state.js

/**
 * Centralized in-memory store for matches, clients, spectators, and disconnect timers.
 * This keeps chess.ws.js focused on I/O and orchestration.
 */

const games = new Map(); // matchId -> game state
const clients = new Map(); // matchId -> Set<ws>
const spectators = new Map(); // matchId -> Set<ws>

/** Create or get a Set at key in a Map */
function _getSet(map, key) {
  if (!map.has(key)) map.set(key, new Set());
  return map.get(key);
}

/** Game state accessors */
function hasGame(matchId) {
  return games.has(matchId);
}
function getGame(matchId) {
  return games.get(matchId);
}
function setGame(matchId, state) {
  games.set(matchId, state);
}
function deleteGame(matchId) {
  games.delete(matchId);
}

/** Client management (players) */
function addClient(matchId, ws) {
  _getSet(clients, matchId).add(ws);
}
function removeClient(matchId, ws) {
  const set = clients.get(matchId);
  if (set) {
    set.delete(ws);
    if (set.size === 0) clients.delete(matchId);
  }
}
function getClients(matchId) {
  return Array.from(clients.get(matchId) || []);
}

/** Spectator management */
function addSpectator(matchId, ws) {
  _getSet(spectators, matchId).add(ws);
}
function removeSpectator(matchId, ws) {
  const set = spectators.get(matchId);
  if (set) {
    set.delete(ws);
    if (set.size === 0) spectators.delete(matchId);
  }
}
function getSpectators(matchId) {
  return Array.from(spectators.get(matchId) || []);
}

/** Combined helpers */
function getAllSockets(matchId) {
  return [...getClients(matchId), ...getSpectators(matchId)];
}
function someoneWithUserIdConnected(matchId, userId) {
  return getClients(matchId).some((c) => c._userId === userId);
}

/** Disconnect timers live on the game object */
function ensureDisconnectMap(game) {
  if (!game.disconnectTimers) game.disconnectTimers = {};
  return game.disconnectTimers;
}
function startDisconnectTimer(matchId, userId, ms, onExpire) {
  const game = getGame(matchId);
  if (!game) return;
  const timers = ensureDisconnectMap(game);
  clearDisconnectTimer(matchId, userId);
  timers[userId] = setTimeout(onExpire, ms);
}
function clearDisconnectTimer(matchId, userId) {
  const game = getGame(matchId);
  if (!game || !game.disconnectTimers) return;
  const t = game.disconnectTimers[userId];
  if (t) clearTimeout(t);
  delete game.disconnectTimers[userId];
}

/** Cleanup everything for a match */
function cleanup(matchId) {
  const game = getGame(matchId);
  if (game && game.disconnectTimers) {
    Object.values(game.disconnectTimers).forEach((t) => clearTimeout(t));
    game.disconnectTimers = {};
  }
  const cs = clients.get(matchId);
  const ss = spectators.get(matchId);
  if (cs) cs.clear();
  if (ss) ss.clear();
  clients.delete(matchId);
  spectators.delete(matchId);
  deleteGame(matchId);
}

module.exports = {
  // games
  hasGame,
  getGame,
  setGame,
  deleteGame,

  // sockets
  addClient,
  removeClient,
  getClients,
  addSpectator,
  removeSpectator,
  getSpectators,
  getAllSockets,
  someoneWithUserIdConnected,

  // disconnect timers
  startDisconnectTimer,
  clearDisconnectTimer,

  // match cleanup
  cleanup,
};
