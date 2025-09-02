# College Adventure Backend

A comprehensive Node.js backend for a multiplayer educational game that recreates our university campus in Unity. Features real-time WebSocket gameplay, matchmaking, social interaction, and educational mini-games.

## 🎮 Game Overview

This backend powers a gamified educational simulation of our college campus, featuring:

- **Campus Exploration**: Real-time multiplayer lobby where students can walk around the virtual campus
- **Social Interaction**: Cafeteria chat room for real-time communication
- **Educational Mini-Games**:
  - **Chess**: Full multiplayer system with matchmaking, Elo ranking, and replays
  - **Ping Pong**: Local offline mini-game
  - **Programming Challenges**: Educational puzzles for problem-solving practice
- **Core Goal**: Complete all mini-games while experiencing social and educational aspects

## 🚀 Quick Setup

### 1. Prerequisites

- **Node.js 20 LTS** (recommended)
- **PostgreSQL 15+**
- **Git**

### 2. Clone and Install

```bash
git clone <your-repo-url>
cd <project-directory>
npm install
```

### 3. Database Setup

#### Create Database and User

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database and user
CREATE USER college_user WITH PASSWORD 'your_password_here';
CREATE DATABASE college_game_db OWNER college_user;
GRANT ALL PRIVILEGES ON DATABASE college_game_db TO college_user;
\q
```

#### Apply Schema

```bash
# Apply the complete schema
psql -U college_user -d college_game_db -f setup.sql
```

**Alternative: Manual Schema Application**

If the above doesn't work, connect to your database and run the schema manually:

```bash
psql -U college_user -d college_game_db
```

Then copy and paste the contents of `setup.sql` into the psql terminal.

### 4. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=8000
DATABASE_URL=postgres://college_user:your_password_here@localhost:5432/college_game_db
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here
```

### 5. Start the Server

```bash
npm run dev
```

You should see:

```
🧠 HTTP + WS server running on http://localhost:8000
✅ Connected to PostgreSQL
```

### 6. Test the Setup

```bash
# Test server is running
curl http://localhost:8000/

# Test time sync endpoint
curl http://localhost:8000/time

# Test database connection (should return empty array initially)
curl http://localhost:8000/chess/leaderboard
```

## 📡 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### User Management

- `GET /user/profile` - Get user profile (requires auth)
- `PUT /user/profile/update` - Update user profile (requires auth)

### Chess Game

- `GET /chess/leaderboard` - Get chess leaderboard (public)
- `GET /chess/history` - Get user's match history (requires auth)
- `GET /chess/matchInfo` - Get current active match (requires auth)
- `GET /chess/replay/:matchId` - Get match replay (public)

### Chat System

- `GET /chat/general/messages` - Get cafeteria chat messages (requires auth)
- `POST /chat/general/messages` - Post message to cafeteria chat (requires auth)

### System

- `GET /time` - Get server time for clock synchronization
- `GET /` - Health check endpoint

## 🔌 WebSocket Endpoints

### Chess Matchmaking & Gameplay

- `ws://localhost:8000/queue/chess?token=<jwt>&base=300&inc=0` - Join matchmaking queue
- `ws://localhost:8000/match/<matchId>?token=<jwt>` - Join active chess match

### Social Features

- `ws://localhost:8000/chat?token=<jwt>` - Join cafeteria chat room
- `ws://localhost:8000/lobby?token=<jwt>` - Join campus lobby for player movement

## 🎯 Core Features

### JWT Authentication

- Secure user registration and login
- Token-based authentication for all protected endpoints
- 7-day token expiration with automatic refresh

### Real-time Chess System

- **Matchmaking**: Elo-based pairing with ±200 rating window
- **Time Controls**: Support for bullet, blitz, rapid, and classical time controls
- **Elo Rating**: Fair color assignment based on previous games
- **Game Engine**: Server-authoritative move validation and clock management
- **Replays**: Complete game history with PGN export
- **Leaderboards**: Real-time ranking system

### Social Features

- **Cafeteria Chat**: Real-time messaging with typing indicators
- **Campus Lobby**: Real-time player movement and presence
- **User Profiles**: Customizable display names and cosmetic data

### Educational Integration

- **Programming Challenges**: Framework for educational mini-games
- **Progress Tracking**: User activity logging and achievements
- **Multiplayer Learning**: Collaborative problem-solving environment

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov
```

## 📁 Project Structure

```
backend-node/
├── README.md                                    # Main project documentation
├── docs/                                        # Documentation and testing files
│   ├── Documentation_Summary.md                 # Documentation overview
│   ├── Complete_Testing_Guide.md               # Comprehensive testing instructions
│   ├── Game_Endpoints.md                       # Complete API reference
│   ├── Game_WebSocket_Testing_Guide.md         # WebSocket testing guide
│   ├── Game_Vision.md                          # High-level game concept
│   └── Game_Http_Requests_Testing.postman_collection.json  # HTTP testing collection
├── src/                                         # Source code
│   ├── auth/           # Authentication controllers and middleware
│   ├── chat/           # Cafeteria chat system
│   │   ├── data/       # Chat repositories
│   │   └── README.md   # Chat testing guide
│   ├── chess/          # Chess game logic
│   │   ├── data/       # Database repositories
│   │   ├── domain/     # Business logic and services
│   │   ├── engine/     # Game engine and state management
│   │   └── ws/         # WebSocket utilities
│   ├── config/         # Configuration files
│   ├── lobby/          # Campus movement system
│   │   └── README.md   # Lobby testing guide
│   ├── tests/          # Test files
│   ├── user/           # User management
│   ├── utils/          # Utility functions
│   └── server.js       # Main server file
├── package.json                                 # Project dependencies
├── setup.sql                                    # Database schema
└── .gitignore                                   # Git ignore rules
```

## 🔧 Development

### Adding New Features

1. Create feature files in appropriate directories
2. Update this README with new endpoints
3. Update `docs/Game_Endpoints.md` with new API specifications
4. Update `docs/Game_Http_Requests_Testing.postman_collection.json` with new test requests
5. Ensure database schema supports new features
6. Add comprehensive tests

### Database Schema

The database includes tables for:

- User accounts and profiles
- Chess matches and history
- Chat messages and rooms
- Activity logging and moderation
- Invite system for private games

## 🚨 Troubleshooting

### "relation 'user' does not exist"

This means the database schema wasn't applied. Fix:

1. **Verify database connection:**

   ```bash
   psql -U college_user -d college_game_db -c "\dt"
   ```

2. **If no tables exist, apply schema:**

   ```bash
   psql -U college_user -d college_game_db -f setup.sql
   ```

3. **Verify tables were created:**
   ```bash
   psql -U college_user -d college_game_db -c "\dt"
   ```

### Database Connection Issues

1. **Check PostgreSQL is running:**

   ```bash
   # Windows
   net start postgresql-x64-16

   # Linux/macOS
   sudo systemctl status postgresql
   ```

2. **Verify connection string in .env:**

   ```env
   DATABASE_URL=postgres://college_user:your_password@localhost:5432/college_game_db
   ```

3. **Test connection manually:**
   ```bash
   psql "postgres://college_user:your_password@localhost:5432/college_game_db"
   ```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or change PORT in .env
```

## 📚 Documentation

- [Game Endpoints Reference](./docs/Game_Endpoints.md) - Complete API reference
- [WebSocket Testing Guide](./docs/Game_WebSocket_Testing_Guide.md) - WebSocket testing instructions
- [Game Vision](./docs/Game_Vision.md) - High-level game concept overview
- [Complete Testing Guide](./docs/Complete_Testing_Guide.md) - Comprehensive testing instructions
- [Postman Collection](./docs/Game_Http_Requests_Testing.postman_collection.json) - HTTP endpoint testing collection

## 🎓 Educational Goals

This project serves as both a technical demonstration and an educational tool:

- **Real-world Application**: Practical implementation of web technologies
- **Multiplayer Systems**: Understanding real-time communication
- **Game Development**: Integration of Unity with backend services
- **Database Design**: Complex relational data modeling
- **API Design**: RESTful and WebSocket endpoint development

The backend provides a solid foundation for expanding the educational mini-games and social features, making learning both engaging and collaborative.
