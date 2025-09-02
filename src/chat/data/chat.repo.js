const pool = require('../../config/db');
const { v4: uuidv4 } = require('uuid');

async function ensureGeneralRoom() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sel = await client.query("SELECT id FROM room WHERE type = $1 LIMIT 1", ['general']);
    if (sel.rows.length > 0) {
      await client.query('COMMIT');
      return sel.rows[0].id;
    }
    const id = uuidv4();
    await client.query(
      'INSERT INTO room (id, type) VALUES ($1, $2)',
      [id, 'general']
    );
    await client.query('COMMIT');
    return id;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function createMessage({ roomId, userId, content }) {
  const q = `INSERT INTO message (room_id, user_id, content) VALUES ($1, $2, $3) RETURNING *`;
  const { rows } = await pool.query(q, [roomId, userId, content]);
  return rows[0];
}

async function listMessages({ roomId, limit = 50, beforeId = null }) {
  const params = [roomId];
  let where = 'room_id = $1';
  if (beforeId) {
    params.push(beforeId);
    where += ` AND id < $${params.length}`;
  }
  params.push(limit);
  const q = `SELECT * FROM message WHERE ${where} ORDER BY id DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(q, params);
  return rows.reverse();
}

module.exports = {
  ensureGeneralRoom,
  createMessage,
  listMessages,
};


