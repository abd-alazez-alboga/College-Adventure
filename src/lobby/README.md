# Lobby Movement System

This module handles real-time player movement in the game lobby. Players can broadcast their coordinates and see other players' positions in real-time.

## WebSocket Endpoint

- `ws://localhost:8000/lobby?token=<JWT>`

## Message Types

### From Server to Client

#### `lobby:joined`

Sent when a player successfully joins the lobby.

```json
{
  "type": "lobby:joined",
  "me": {
    "userId": 123,
    "username": "player1"
  },
  "coordinates": {
    "x": 0,
    "y": 0,
    "z": 0
  }
}
```

#### `lobby:join`

Sent when another player joins the lobby.

```json
{
  "type": "lobby:join",
  "user": {
    "userId": 456,
    "username": "player2"
  },
  "coordinates": {
    "x": 10,
    "y": 5,
    "z": 0
  },
  "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"
}
```

#### `lobby:positions`

Sent when a player joins to show current lobby state, or when positions are updated.

```json
{
  "type": "lobby:positions",
  "players": [
    {
      "userId": 456,
      "username": "player2",
      "coordinates": {
        "x": 10,
        "y": 5,
        "z": 0
      },
      "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"
    }
  ]
}
```

#### `lobby:move`

Sent when a player moves to new coordinates.

```json
{
  "type": "lobby:move",
  "user": {
    "userId": 456,
    "username": "player2"
  },
  "coordinates": {
    "x": 15,
    "y": 8,
    "z": 0
  },
  "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1",
  "serverTs": 1690000000000
}
```

#### `lobby:leave`

Sent when a player leaves the lobby.

```json
{
  "type": "lobby:leave",
  "user": {
    "userId": 456,
    "username": "player2"
  }
}
```

#### `lobby:error`

Sent when there's an error processing a message.

```json
{
  "type": "lobby:error",
  "error": "Invalid lobby:move",
  "details": "state is required and must be a non-empty string <= 256"
}
```

### From Client to Server

#### `lobby:move`

Send player movement coordinates and state.

```json
{
  "type": "lobby:move",
  "coordinates": {
    "x": 15,
    "y": 8,
    "z": 0
  },
  "state": "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"
}
```

## Testing

### Using wscat

```bash
npm i -g wscat
wscat -c "ws://localhost:8000/lobby?token=YOUR_JWT"
# then send
{"type":"lobby:move","coordinates":{"x":10,"y":5,"z":0},"state":"Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"}
```

### Using JavaScript

```javascript
const ws = new WebSocket(`ws://localhost:8000/lobby?token=${token}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Received:", data);
};

// Move player
ws.send(
  JSON.stringify({
    type: "lobby:move",
    coordinates: { x: 10, y: 5, z: 0 },
    state:
      "Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1",
  })
);
```

## Features

- **Real-time position broadcasting**: All players see each other's movements instantly
- **Automatic cleanup**: Players are removed from lobby state when they disconnect
- **Default coordinates**: New players start at (0, 0, 0)
- **Coordinate validation**: Ensures coordinates are valid numbers
- **State validation**: Ensures state is a non-empty string ≤ 256 characters
- **Heartbeat system**: Maintains connection health

## Notes

- Coordinates and state are stored in memory only (not persisted to database)
- Players start at coordinates (0, 0, 0) with default state when joining
- All coordinate values must be finite numbers
- State must be a non-empty string ≤ 256 characters
- The lobby state is reset when the server restarts
