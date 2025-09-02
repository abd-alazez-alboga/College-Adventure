-- ======================================================
-- College Adventure Backend Database Schema
-- ======================================================

-- ======================================================
-- user
-- ======================================================
CREATE TABLE IF NOT EXISTS "user" (
  userid             SERIAL PRIMARY KEY,
  username           VARCHAR(50)  UNIQUE NOT NULL,
  email              VARCHAR(100) UNIQUE NOT NULL,
  passwordhash       VARCHAR(255) NOT NULL,
  displayname        VARCHAR(50),
  language           VARCHAR(10)  DEFAULT 'en',
  cosmeticdata       JSONB,
  elochess           INT          DEFAULT 1200,
  elo_pingpong       INT          DEFAULT 1200,
  last_color_played  VARCHAR(5),
  is_banned          BOOLEAN      DEFAULT FALSE,
  is_muted           BOOLEAN      DEFAULT FALSE,
  is_admin           BOOLEAN      DEFAULT FALSE,
  created_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- match
-- ======================================================
CREATE TABLE IF NOT EXISTS match (
  matchid           UUID PRIMARY KEY,
  game_type         VARCHAR(20) NOT NULL,
  player1_id        INT REFERENCES "user"(userid),
  player2_id        INT REFERENCES "user"(userid),
  winner_id         INT REFERENCES "user"(userid),
  score_player1     INT,
  score_player2     INT,
  elo_change_p1     INT,
  elo_change_p2     INT,
  moves             JSONB,
  duration_seconds  INT,
  created_at        TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  start_time        TIMESTAMP,
  status            VARCHAR(20),
  white_time_left   INT,
  black_time_left   INT,
  increment         INT          DEFAULT 0,
  delay             INT
);

-- ======================================================
-- user_matches
-- ======================================================
CREATE TABLE IF NOT EXISTS user_matches (
  id                  UUID PRIMARY KEY,
  user_id             INT  NOT NULL REFERENCES "user"(userid),
  match_id            UUID NOT NULL REFERENCES match(matchid),
  role                VARCHAR(5)  NOT NULL,  -- 'white' | 'black'
  result              VARCHAR(10) NOT NULL,  -- 'win' | 'loss' | 'draw'
  elo_before          INT  NOT NULL,
  elo_after           INT  NOT NULL,
  opponent_id         INT  NOT NULL REFERENCES "user"(userid),
  opponent_username   VARCHAR(50),
  opponent_elo_before INT  NOT NULL,
  opponent_elo_after  INT  NOT NULL,
  duration_seconds    INT  NOT NULL,
  moves               JSONB NOT NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- room
-- ======================================================
CREATE TABLE IF NOT EXISTS room (
  id          UUID PRIMARY KEY,
  type        VARCHAR(20) NOT NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- user_room
-- ======================================================
CREATE TABLE IF NOT EXISTS user_room (
  id         SERIAL PRIMARY KEY,
  user_id    INT  REFERENCES "user"(userid),
  room_id    UUID REFERENCES room(id),
  joined_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- message
-- ======================================================
CREATE TABLE IF NOT EXISTS message (
  id         SERIAL PRIMARY KEY,
  room_id    UUID REFERENCES room(id),
  user_id    INT  REFERENCES "user"(userid),
  content    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- activity_log
-- ======================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES "user"(userid),
  event_type VARCHAR(20),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- ban_log
-- ======================================================
CREATE TABLE IF NOT EXISTS ban_log (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES "user"(userid),
  admin_id   INT REFERENCES "user"(userid),
  action     VARCHAR(10) NOT NULL,
  reason     TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- invite
-- ======================================================
CREATE TABLE IF NOT EXISTS invite (
  code        UUID PRIMARY KEY,
  game_type   VARCHAR(20),
  host_id     INT REFERENCES "user"(userid),
  opponent_id INT,
  expires_at  TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================================================
-- match_replay (optional)
-- ======================================================
CREATE TABLE IF NOT EXISTS match_replay (
  match_id UUID PRIMARY KEY REFERENCES match(matchid),
  pgn      TEXT,
  fen      TEXT,
  exported BOOLEAN DEFAULT FALSE
);

-- ======================================================
-- Verify tables were created
-- ======================================================
\dt 