# Game WebSocket Testing Guide

This guide covers all WebSocket endpoints in the College Adventure Backend and how to test them using Postman.

## Prerequisites

- Server running on `http://localhost:8000`
- Valid JWT token (obtained from `/auth/login`)
- Postman with WebSocket support

## WebSocket Endpoints Overview

| Endpoint                              | Purpose                | Authentication                  |
| ------------------------------------- | ---------------------- | ------------------------------- |
| `ws://localhost:8000/chat`            | Cafeteria chat room    | JWT Token required              |
| `ws://localhost:8000/lobby`           | Campus movement system | JWT Token required              |
| `ws://localhost:8000/queue/chess`     | Chess matchmaking      | JWT Token + Time control params |
| `ws://localhost:8000/match/<matchId>` | Active chess game      | JWT Token required              |

---

## 1. Chat WebSocket (`/chat`)

### Connection

- **URL**: `ws://localhost:8000/chat?token=YOUR_JWT_TOKEN`
- **Method**: WebSocket
- **Authentication**: JWT token in query parameter

### Client Messages

#### Send Chat Message

```json
{
  "type": "chat:message",
  "content": "Hello everyone in the cafeteria!"
}
```

#### Send Typing Indicator

```json
{
  "type": "chat:typing",
  "isTyping": true
}
```

```json
{
  "type": "chat:typing",
  "isTyping": false
}
```

### Server Responses

#### Join Confirmation

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

#### User Joins

```json
{
  "type": "chat:join",
  "user": {
    "userId": 456,
    "username": "anotheruser"
  }
}
```

#### User Leaves

```json
{
  "type": "chat:leave",
  "user": {
    "userId": 456,
    "username": "anotheruser"
  }
}
```

#### Message Received

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

#### Typing Indicator

```json
{
  "type": "chat:typing",
  "user": {
    "userId": 456,
    "username": "anotheruser"
  },
  "isTyping": true
}
```

#### Error Response

```json
{
  "type": "chat:error",
  "error": "Invalid message"
}
```

---

## 2. Lobby WebSocket (`/lobby`)

### Connection

- **URL**: `ws://localhost:8000/lobby?token=YOUR_JWT_TOKEN`
- **Method**: WebSocket
- **Authentication**: JWT token in query parameter

### Client Messages

#### Move Player

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

### Server Responses

#### Join Confirmation

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

#### Current Players

```json
{
  "type": "lobby:positions",
  "players": [
    {
      "userId": 456,
      "username": "anotheruser",
      "coordinates": {
        "x": 15,
        "y": 8,
        "z": 0
      },
      "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"
    }
  ]
}
```

#### User Joins

```json
{
  "type": "lobby:join",
  "user": {
    "userId": 456,
    "username": "anotheruser"
  },
  "coordinates": {
    "x": 0,
    "y": 0,
    "z": 0
  },
  "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"
}
```

#### User Moves

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

#### User Leaves

```json
{
  "type": "lobby:leave",
  "user": {
    "userId": 456,
    "username": "anotheruser"
  }
}
```

#### Error Response

```json
{
  "type": "lobby:error",
  "error": "Invalid lobby:move",
  "details": "coordinates must contain finite numbers for x, y, z"
}
```

---

## 3. Chess Queue WebSocket (`/queue/chess`)

### Connection

- **URL**: `ws://localhost:8000/queue/chess?token=YOUR_JWT_TOKEN&base=300&inc=0`
- **Method**: WebSocket
- **Authentication**: JWT token in query parameter
- **Parameters**:
  - `base`: Base time in seconds (e.g., 300 for 5 minutes)
  - `inc`: Increment in seconds (e.g., 0 for no increment)

### Supported Time Controls

- **Bullet**: `base=60&inc=0`, `base=120&inc=1`
- **Blitz**: `base=180&inc=0`, `base=180&inc=2`, `base=300&inc=0`, `base=300&inc=3`
- **Rapid**: `base=600&inc=0`, `base=600&inc=5`, `base=900&inc=10`
- **Classical**: `base=1800&inc=0`, `base=1800&inc=20`

### Server Responses

#### Waiting for Opponent

```json
{
  "type": "queue:waiting",
  "timer": {
    "base": 300,
    "increment": 0
  }
}
```

#### Match Found

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

#### Error Response

```json
{
  "type": "queue:error",
  "error": "Unsupported time control"
}
```

---

## 4. Chess Match WebSocket (`/match/<matchId>`)

### Connection

- **URL**: `ws://localhost:8000/match/550e8400-e29b-41d4-a716-446655440000?token=YOUR_JWT_TOKEN`
- **Method**: WebSocket
- **Authentication**: JWT token in query parameter
- **Parameters**: `matchId` in URL path

### Client Messages

#### Make Chess Move

```json
{
  "type": "chess:move",
  "move": {
    "from": "e2",
    "to": "e4"
  }
}
```

#### Request Game Sync

```json
{
  "type": "chess:sync"
}
```

### Server Responses

#### Game Sync

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

#### Move Applied

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

#### Clock Update

```json
{
  "type": "chess:clock",
  "white": 298500,
  "black": 300000
}
```

#### Game Result

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

#### Error Response

```json
{
  "type": "chess:error",
  "error": "Not your turn"
}
```

---

## Testing with Postman

### Step 1: Get JWT Token

1. Use the HTTP collection (`docs/Game_Http_Requests_Testing.postman_collection.json`) to register/login
2. Copy the JWT token from the response

### Step 2: Create WebSocket Request

1. In Postman, click "New" → "WebSocket Request"
2. Enter the WebSocket URL with your token
3. Click "Connect"

### Step 3: Send Messages

1. Use the message panel to send JSON messages
2. Observe server responses in the message log

### Step 4: Test Multiple Users

1. Open multiple Postman tabs
2. Connect different users to the same WebSocket
3. Test real-time interactions

---

## Testing Scenarios

### Chat Testing

1. **Single User**: Connect and send messages
2. **Multiple Users**: Test join/leave notifications
3. **Typing Indicators**: Test real-time typing feedback
4. **Message Broadcasting**: Verify all users receive messages

### Lobby Testing

1. **Movement**: Test coordinate updates
2. **Multiple Players**: Test position broadcasting
3. **Join/Leave**: Test player presence
4. **Validation**: Test invalid coordinates

### Chess Testing

1. **Matchmaking**: Test queue and match creation
2. **Gameplay**: Test move validation and clock management
3. **Spectators**: Test non-player connections
4. **Game End**: Test checkmate, draw, timeout scenarios

---

## Common Issues

### Connection Problems

- **401 Unauthorized**: Check JWT token validity
- **404 Not Found**: Verify WebSocket URL format
- **Connection refused**: Ensure server is running

### Message Problems

- **Invalid JSON**: Check message format
- **Missing fields**: Verify required parameters
- **Wrong turn**: Ensure it's your turn to move

### Performance Issues

- **High latency**: Check network connection
- **Disconnections**: Monitor server logs
- **Memory leaks**: Restart server if needed

---

## Best Practices

1. **Always validate responses**: Check for error messages
2. **Handle disconnections**: Implement reconnection logic
3. **Rate limiting**: Don't spam messages
4. **Error handling**: Gracefully handle connection failures
5. **Testing**: Test with multiple concurrent users

This guide covers all WebSocket endpoints and provides comprehensive testing instructions for the College Adventure Backend.
