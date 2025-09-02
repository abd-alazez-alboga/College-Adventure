# Game Endpoints Reference

Complete reference for all HTTP and WebSocket endpoints in the College Adventure Backend.

## Base URL
```
http://localhost:8000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## HTTP Endpoints

### Authentication

#### Register User
- **URL**: `POST /auth/register`
- **Description**: Create a new user account
- **Authentication**: None required
- **Request Body**:
```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```
- **Response** (201 Created):
```json
{
  "userId": 123,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Error Response** (400 Bad Request):
```json
{
  "message": "Email already in use"
}
```

#### Login User
- **URL**: `POST /auth/login`
- **Description**: Authenticate user and get JWT token
- **Authentication**: None required
- **Request Body**:
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```
- **Response** (200 OK):
```json
{
  "userId": 123,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
- **Error Response** (401 Unauthorized):
```json
{
  "message": "Invalid credentials"
}
```

### User Management

#### Get User Profile
- **URL**: `GET /user/profile`
- **Description**: Get current user's profile information
- **Authentication**: JWT Token required
- **Response** (200 OK):
```json
{
  "userid": 123,
  "username": "testuser",
  "displayname": "Test User",
  "language": "en",
  "cosmeticdata": {
    "avatar": "default",
    "theme": "classic"
  },
  "elochess": 1200,
  "elo_pingpong": 1200
}
```

#### Update User Profile
- **URL**: `PUT /user/profile/update`
- **Description**: Update user profile information
- **Authentication**: JWT Token required
- **Request Body**:
```json
{
  "displayName": "Updated Display Name",
  "language": "en",
  "cosmeticData": {
    "avatar": "default",
    "theme": "classic"
  }
}
```
- **Response** (200 OK):
```json
{
  "message": "Profile updated successfully"
}
```

### Chess Game

#### Get Chess Leaderboard
- **URL**: `GET /chess/leaderboard`
- **Description**: Get top players ranked by chess Elo rating
- **Authentication**: None required
- **Response** (200 OK):
```json
{
  "success": true,
  "leaderboard": [
    {
      "userId": 123,
      "username": "chessmaster",
      "elo": 1850
    },
    {
      "userId": 456,
      "username": "grandmaster",
      "elo": 1800
    }
  ]
}
```

#### Get Chess Match History
- **URL**: `GET /chess/history`
- **Description**: Get current user's chess match history
- **Authentication**: JWT Token required
- **Response** (200 OK):
```json
{
  "success": true,
  "history": [
    {
      "matchId": "550e8400-e29b-41d4-a716-446655440000",
      "role": "white",
      "result": "win",
      "eloBefore": 1200,
      "eloAfter": 1216,
      "opponent": {
        "id": 456,
        "username": "opponent",
        "eloBefore": 1200,
        "eloAfter": 1184
      },
      "durationSeconds": 1800,
      "moves": [
        {"from": "e2", "to": "e4"},
        {"from": "e7", "to": "e5"}
      ],
      "createdAt": "2025-01-27T10:30:00.000Z"
    }
  ]
}
```

#### Get Current Match Info
- **URL**: `GET /chess/matchInfo`
- **Description**: Get information about current active match
- **Authentication**: JWT Token required
- **Response** (200 OK):
```json
{
  "success": true,
  "match": {
    "matchId": "550e8400-e29b-41d4-a716-446655440000",
    "role": "white",
    "opponentId": 456,
    "opponentUsername": "opponent",
    "time": {
      "white": 300000,
      "black": 300000,
      "inc": 0
    }
  }
}
```
- **Response** (200 OK) - No active match:
```json
{
  "success": true,
  "match": null
}
```

#### Get Match Replay
- **URL**: `GET /chess/replay/:matchId`
- **Description**: Get replay data for a completed match
- **Authentication**: None required
- **Parameters**: `matchId` (UUID) in URL path
- **Response** (200 OK):
```json
{
  "success": true,
  "replay": {
    "moves": [
      {"from": "e2", "to": "e4"},
      {"from": "e7", "to": "e5"}
    ],
    "duration_seconds": 1800,
    "created_at": "2025-01-27T10:30:00.000Z"
  }
}
```
- **Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": "Replay not found"
}
```

### Chat System

#### Get Chat Messages
- **URL**: `GET /chat/general/messages`
- **Description**: Get cafeteria chat messages (returns empty for cafeteria chat)
- **Authentication**: JWT Token required
- **Response** (200 OK):
```json
{
  "roomId": "general",
  "messages": []
}
```

#### Post Chat Message
- **URL**: `POST /chat/general/messages`
- **Description**: Post message to cafeteria chat (stored in memory only)
- **Authentication**: JWT Token required
- **Request Body**:
```json
{
  "content": "Hello from the cafeteria!"
}
```
- **Response** (201 Created):
```json
{
  "id": 1234567890.123,
  "room_id": "general",
  "user_id": 123,
  "content": "Hello from the cafeteria!",
  "created_at": "2025-01-27T10:30:00.000Z"
}
```
- **Error Response** (400 Bad Request):
```json
{
  "message": "Content is required"
}
```

### System

#### Health Check
- **URL**: `GET /`
- **Description**: Check if server is running
- **Authentication**: None required
- **Response** (200 OK):
```
College Game Backend is running 🎮
```

#### Get Server Time
- **URL**: `GET /time`
- **Description**: Get server time for clock synchronization
- **Authentication**: None required
- **Response** (200 OK):
```json
{
  "serverTime": "2025-01-27T10:30:00.000Z",
  "timestamp": 1706357400000,
  "timezone": "UTC"
}
```

---

## WebSocket Endpoints

### Chat WebSocket

#### Connection
- **URL**: `ws://localhost:8000/chat?token=YOUR_JWT_TOKEN`
- **Authentication**: JWT token in query parameter
- **Purpose**: Real-time cafeteria chat room

#### Client Messages

**Send Chat Message**:
```json
{
  "type": "chat:message",
  "content": "Hello everyone in the cafeteria!"
}
```

**Send Typing Indicator**:
```json
{
  "type": "chat:typing",
  "isTyping": true
}
```

#### Server Responses

**Join Confirmation**:
```json
{
  "type": "chat:joined",
  "roomId": "general",
  "me": {
    "userId": 123,
    "username": "testuser"
  },
  "online": [
    {
      "userId": 123,
      "username": "testuser"
    }
  ]
}
```

**User Joins**:
```json
{
  "type": "chat:join",
  "user": {
    "userId": 456,
    "username": "anotheruser"
  }
}
```

**Message Received**:
```json
{
  "type": "chat:message",
  "message": {
    "id": 1234567890.123,
    "room_id": "general",
    "user_id": 456,
    "content": "Hello everyone in the cafeteria!",
    "created_at": "2025-01-27T10:30:00.000Z",
    "user": {
      "userId": 456,
      "username": "anotheruser"
    }
  }
}
```

### Lobby WebSocket

#### Connection
- **URL**: `ws://localhost:8000/lobby?token=YOUR_JWT_TOKEN`
- **Authentication**: JWT token in query parameter
- **Purpose**: Real-time campus movement system

#### Client Messages

**Move Player**:
```json
{
  "type": "lobby:move",
  "coordinates": {
    "x": 10,
    "y": 5,
    "z": 0
  },
  "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"
}
```

#### Server Responses

**Join Confirmation**:
```json
{
  "type": "lobby:joined",
  "me": {
    "userId": 123,
    "username": "testuser"
  },
  "coordinates": {
    "x": 0,
    "y": 0,
    "z": 0
  }
}
```

**User Moves**:
```json
{
  "type": "lobby:move",
  "user": {
    "userId": 456,
    "username": "anotheruser"
  },
  "coordinates": {
    "x": 10,
    "y": 5,
    "z": 0
  },
  "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1",
  "serverTs": 1706357400000
}
```

### Chess Queue WebSocket

#### Connection
- **URL**: `ws://localhost:8000/queue/chess?token=YOUR_JWT_TOKEN&base=300&inc=0`
- **Authentication**: JWT token in query parameter
- **Parameters**:
  - `base`: Base time in seconds
  - `inc`: Increment in seconds
- **Purpose**: Chess matchmaking system

#### Supported Time Controls
- **Bullet**: `base=60&inc=0`, `base=120&inc=1`
- **Blitz**: `base=180&inc=0`, `base=180&inc=2`, `base=300&inc=0`, `base=300&inc=3`
- **Rapid**: `base=600&inc=0`, `base=600&inc=5`, `base=900&inc=10`
- **Classical**: `base=1800&inc=0`, `base=1800&inc=20`

#### Server Responses

**Waiting for Opponent**:
```json
{
  "type": "queue:waiting",
  "timer": {
    "base": 300,
    "increment": 0
  }
}
```

**Match Found**:
```json
{
  "type": "match:found",
  "matchId": "550e8400-e29b-41d4-a716-446655440000",
  "role": "white",
  "opponent": {
    "userId": 456,
    "username": "opponent"
  },
  "timer": {
    "base": 300,
    "increment": 0
  }
}
```

### Chess Match WebSocket

#### Connection
- **URL**: `ws://localhost:8000/match/550e8400-e29b-41d4-a716-446655440000?token=YOUR_JWT_TOKEN`
- **Authentication**: JWT token in query parameter
- **Parameters**: `matchId` in URL path
- **Purpose**: Active chess game

#### Client Messages

**Make Chess Move**:
```json
{
  "type": "chess:move",
  "move": {
    "from": "e2",
    "to": "e4"
  }
}
```

**Request Game Sync**:
```json
{
  "type": "chess:sync"
}
```

#### Server Responses

**Game Sync**:
```json
{
  "type": "chess:sync",
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1",
  "moves": [
    {
      "from": "e2",
      "to": "e4"
    }
  ],
  "turn": 456,
  "whiteId": 123,
  "blackId": 456,
  "role": "white",
  "whiteTimeLeft": 300000,
  "blackTimeLeft": 300000
}
```

**Move Applied**:
```json
{
  "type": "chess:move",
  "move": {
    "from": "e2",
    "to": "e4",
    "piece": "p",
    "color": "w",
    "san": "e4"
  },
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
}
```

**Clock Update**:
```json
{
  "type": "chess:clock",
  "white": 298500,
  "black": 300000
}
```

**Game Result**:
```json
{
  "type": "chess:result",
  "reason": "checkmate",
  "winnerId": 123,
  "white": {
    "id": 123,
    "eloBefore": 1200,
    "eloAfter": 1216
  },
  "black": {
    "id": 456,
    "eloBefore": 1200,
    "eloAfter": 1184
  }
}
```

---

## Error Responses

### HTTP Error Responses

**400 Bad Request**:
```json
{
  "message": "Invalid request data"
}
```

**401 Unauthorized**:
```json
{
  "message": "No token provided"
}
```

**403 Forbidden**:
```json
{
  "message": "Invalid token"
}
```

**404 Not Found**:
```json
{
  "success": false,
  "error": "Resource not found"
}
```

**500 Internal Server Error**:
```json
{
  "message": "Internal server error"
}
```

### WebSocket Error Responses

**Chat Error**:
```json
{
  "type": "chat:error",
  "error": "Invalid message"
}
```

**Lobby Error**:
```json
{
  "type": "lobby:error",
  "error": "Invalid lobby:move",
  "details": "coordinates must contain finite numbers for x, y, z"
}
```

**Chess Error**:
```json
{
  "type": "chess:error",
  "error": "Not your turn"
}
```

**Queue Error**:
```json
{
  "type": "queue:error",
  "error": "Unsupported time control"
}
```

---

## Rate Limiting

Currently, no rate limiting is implemented. However, it's recommended to:
- Not send messages more frequently than once per second
- Handle connection errors gracefully
- Implement exponential backoff for reconnections

## Security Considerations

- JWT tokens expire after 7 days
- All sensitive endpoints require authentication
- WebSocket connections validate JWT tokens
- Input validation is performed on all endpoints
- SQL injection protection through parameterized queries

This reference covers all endpoints available in the College Adventure Backend.
