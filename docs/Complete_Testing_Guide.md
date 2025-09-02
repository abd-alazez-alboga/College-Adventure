# Complete Testing Guide

This guide provides comprehensive testing instructions for the College Adventure Backend, covering both HTTP endpoints and WebSocket connections.

## 📋 Prerequisites

- Server running on `http://localhost:8000`
- Postman installed (for HTTP testing)
- wscat installed (for WebSocket testing): `npm install -g wscat`
- Valid JWT token (obtained from authentication)

## 🚀 Quick Start

### 1. Start the Server

```bash
npm run dev
```

### 2. Test Basic Connectivity

```bash
curl http://localhost:8000/
# Should return: "College Game Backend is running 🎮"

curl http://localhost:8000/time
# Should return server time in JSON format
```

### 3. Get Authentication Token

Use the Postman collection or curl:

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

## 📡 HTTP Endpoints Testing

### Import Postman Collection

1. Open Postman
2. Click "Import"
3. Import `docs/Game_Http_Requests_Testing.postman_collection.json`

### Authentication Flow

#### Step 1: Register User

- **Request**: `POST /auth/register`
- **Body**:

```json
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123"
}
```

- **Expected Response** (201):

```json
{
  "userId": 123,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Step 2: Login User

- **Request**: `POST /auth/login`
- **Body**:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

- **Expected Response** (200):

```json
{
  "userId": 123,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note**: The Postman collection automatically saves the token to collection variables.

### User Management Testing

#### Get User Profile

- **Request**: `GET /user/profile`
- **Headers**: `Authorization: Bearer {{token}}`
- **Expected Response** (200):

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

- **Request**: `PUT /user/profile/update`
- **Headers**: `Authorization: Bearer {{token}}`
- **Body**:

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

### Chess Game Testing

#### Get Leaderboard (Public)

- **Request**: `GET /chess/leaderboard`
- **Expected Response** (200):

```json
{
  "success": true,
  "leaderboard": [
    {
      "userId": 123,
      "username": "chessmaster",
      "elo": 1850
    }
  ]
}
```

#### Get Match History (Authenticated)

- **Request**: `GET /chess/history`
- **Headers**: `Authorization: Bearer {{token}}`
- **Expected Response** (200):

```json
{
  "success": true,
  "history": []
}
```

#### Get Current Match Info

- **Request**: `GET /chess/matchInfo`
- **Headers**: `Authorization: Bearer {{token}}`
- **Expected Response** (200):

```json
{
  "success": true,
  "match": null
}
```

### Chat System Testing

#### Get Chat Messages

- **Request**: `GET /chat/general/messages`
- **Headers**: `Authorization: Bearer {{token}}`
- **Expected Response** (200):

```json
{
  "roomId": "general",
  "messages": []
}
```

#### Post Chat Message

- **Request**: `POST /chat/general/messages`
- **Headers**: `Authorization: Bearer {{token}}`
- **Body**:

```json
{
  "content": "Hello from the cafeteria!"
}
```

## 🔌 WebSocket Testing

### Method 1: Using wscat (Recommended)

#### Install wscat

```bash
npm install -g wscat
```

#### Test Chat WebSocket

```bash
# Connect to chat
wscat -c "ws://localhost:8000/chat?token=YOUR_JWT_TOKEN"

# Send a message
{"type":"chat:message","content":"Hello from wscat!"}

# Send typing indicator
{"type":"chat:typing","isTyping":true}
```

#### Test Lobby WebSocket

```bash
# Connect to lobby
wscat -c "ws://localhost:8000/lobby?token=YOUR_JWT_TOKEN"

# Send movement
{"type":"lobby:move","coordinates":{"x":10,"y":5,"z":0},"state":"Skin:M_F_0_SK(255,255,255)_SH(255,255,255)_HR(255,255,255)_LG(255,255,255)_H0_SL1_MII1"}
```

#### Test Chess Queue

```bash
# Connect to chess queue (5+0 time control)
wscat -c "ws://localhost:8000/queue/chess?token=YOUR_JWT_TOKEN&base=300&inc=0"
```

#### Test Chess Match

```bash
# Connect to active match (replace with actual matchId)
wscat -c "ws://localhost:8000/match/MATCH_ID?token=YOUR_JWT_TOKEN"

# Send a move
{"type":"chess:move","move":{"from":"e2","to":"e4"}}
```

### Method 2: Using Postman WebSocket Interface

1. **Open Postman**
2. **Click "New" → "WebSocket Request"**
3. **Enter WebSocket URL**: `ws://localhost:8000/chat?token=YOUR_JWT_TOKEN`
4. **Click "Connect"**
5. **Use message panel to send JSON messages**

### Method 3: Using Browser Console

```javascript
// Test chat WebSocket
const ws = new WebSocket("ws://localhost:8000/chat?token=YOUR_JWT_TOKEN");

ws.onopen = () => console.log("Connected to chat");
ws.onmessage = (event) => console.log("Received:", JSON.parse(event.data));
ws.onclose = () => console.log("Disconnected from chat");

// Send a message
ws.send(
  JSON.stringify({
    type: "chat:message",
    content: "Hello from browser!",
  })
);
```

## 🧪 Testing Scenarios

### Scenario 1: Single User Testing

#### HTTP Endpoints

1. Register a new user
2. Login and get token
3. Get user profile
4. Update profile
5. Check leaderboard
6. Get match history
7. Post chat message

#### WebSocket Connections

1. Connect to chat WebSocket
2. Send messages and typing indicators
3. Connect to lobby WebSocket
4. Send movement coordinates
5. Verify server responses

### Scenario 2: Multi-User Testing

#### Setup Multiple Users

1. Register 2-3 different users
2. Get tokens for each user
3. Open multiple terminal windows or Postman tabs

#### Test Real-time Features

1. **Chat Testing**:

   - Connect all users to chat
   - Send messages from different users
   - Verify all users receive messages
   - Test typing indicators

2. **Lobby Testing**:

   - Connect all users to lobby
   - Move users around
   - Verify position updates are broadcast
   - Test join/leave notifications

3. **Chess Testing**:
   - Connect two users to chess queue
   - Verify match creation
   - Test gameplay
   - Verify game results

### Scenario 3: Error Testing

#### Invalid Authentication

```bash
# Test without token
curl http://localhost:8000/user/profile
# Expected: 401 Unauthorized

# Test with invalid token
curl -H "Authorization: Bearer invalid_token" http://localhost:8000/user/profile
# Expected: 403 Forbidden
```

#### Invalid WebSocket Connections

```bash
# Test without token
wscat -c "ws://localhost:8000/chat"
# Expected: Connection refused

# Test with invalid token
wscat -c "ws://localhost:8000/chat?token=invalid"
# Expected: Connection refused
```

#### Invalid Messages

```bash
# Send invalid JSON
wscat -c "ws://localhost:8000/chat?token=YOUR_TOKEN"
# Send: invalid json
# Expected: Error response

# Send invalid coordinates
wscat -c "ws://localhost:8000/lobby?token=YOUR_TOKEN"
# Send: {"type":"lobby:move","coordinates":{"x":"invalid","y":5,"z":0}}
# Expected: Error response
```

## 🔍 Expected Behaviors

### Chat WebSocket

- **Join**: Receive `chat:joined` with online users list
- **Message**: All connected users receive the message
- **Typing**: Other users see typing indicators
- **Leave**: Other users receive `chat:leave` notification

### Lobby WebSocket

- **Join**: Receive `lobby:joined` with current position
- **Move**: Other users see position updates with `serverTs`
- **Validation**: Invalid coordinates return error messages
- **Leave**: Other users receive `lobby:leave` notification

### Chess Queue

- **Connect**: Receive `queue:waiting` confirmation
- **Match Found**: Receive `match:found` with opponent info
- **Invalid Time Control**: Receive `queue:error`

### Chess Match

- **Connect**: Receive `chess:sync` with game state
- **Move**: Valid moves update game state and clocks
- **Invalid Move**: Receive `chess:error`
- **Game End**: Receive `chess:result` with final scores

## 🚨 Troubleshooting

### Common Issues

#### Server Won't Start

```bash
# Check if port is in use
lsof -i :8000

# Check database connection
psql -U college_user -d college_game_db -c "\dt"

# Check environment variables
cat .env
```

#### Authentication Problems

```bash
# Verify JWT token format
echo "YOUR_TOKEN" | cut -d'.' -f2 | base64 -d

# Check token expiration
# Tokens expire after 7 days
```

#### WebSocket Connection Issues

```bash
# Check server logs
npm run dev

# Verify WebSocket URL format
# Must include token parameter

# Test with curl first
curl http://localhost:8000/time
```

#### Database Issues

```bash
# Check if tables exist
psql -U college_user -d college_game_db -c "\dt"

# Apply schema if needed
psql -U college_user -d college_game_db -f setup.sql
```

### Performance Testing

#### Load Testing

```bash
# Test multiple concurrent connections
for i in {1..10}; do
  wscat -c "ws://localhost:8000/chat?token=YOUR_TOKEN" &
done

# Monitor server performance
top -p $(pgrep node)
```

#### Memory Testing

```bash
# Monitor memory usage
node --inspect src/server.js

# Check for memory leaks
# Restart server if needed
```

## 📊 Testing Checklist

### HTTP Endpoints

- [ ] Health check (`GET /`)
- [ ] Time sync (`GET /time`)
- [ ] User registration (`POST /auth/register`)
- [ ] User login (`POST /auth/login`)
- [ ] Get profile (`GET /user/profile`)
- [ ] Update profile (`PUT /user/profile/update`)
- [ ] Get leaderboard (`GET /chess/leaderboard`)
- [ ] Get match history (`GET /chess/history`)
- [ ] Get current match (`GET /chess/matchInfo`)
- [ ] Get chat messages (`GET /chat/general/messages`)
- [ ] Post chat message (`POST /chat/general/messages`)

### WebSocket Endpoints

- [ ] Chat connection and messaging
- [ ] Lobby connection and movement
- [ ] Chess queue connection and matchmaking
- [ ] Chess match connection and gameplay
- [ ] Error handling for invalid messages
- [ ] Multi-user real-time interaction

### Error Scenarios

- [ ] Invalid authentication
- [ ] Invalid request data
- [ ] Database connection issues
- [ ] WebSocket connection failures
- [ ] Invalid message formats

## 🎯 Success Criteria

### Functional Testing

- All HTTP endpoints return correct responses
- WebSocket connections establish successfully
- Real-time features work with multiple users
- Error handling works as expected
- Authentication protects sensitive endpoints

### Performance Testing

- Server handles multiple concurrent connections
- Response times are acceptable (< 100ms for HTTP)
- WebSocket messages are delivered promptly
- Memory usage remains stable
- No connection leaks

### Integration Testing

- Unity frontend can connect to all endpoints
- Database operations work correctly
- JWT authentication flows properly
- Real-time features synchronize across clients

This comprehensive testing guide ensures the College Adventure Backend is thoroughly tested and ready for production use.
