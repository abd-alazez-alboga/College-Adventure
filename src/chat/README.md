# Chat Module Guide

This document explains how to test the global chat and how to connect from a simple frontend.

## Prerequisites
- PostgreSQL schema applied (run `setup.sql`).
- Env vars set: `DATABASE_URL`, `JWT_SECRET`, `PORT=8000` (optional).
- Server running: `npm start`.

## Endpoints
- HTTP
  - `POST /auth/register` → { username, email, password }
  - `POST /auth/login` → { email, password } → returns `{ token }`
  - `GET /chat/general/messages` (Bearer token)
  - `POST /chat/general/messages` (Bearer token, { content })
- WebSocket
  - `ws://localhost:8000/chat?token=<JWT>`

## Expected WS Events
- From server to client:
  - `chat:joined` → `{ roomId, me, online: [{ userId, username }] }`
  - `chat:join` → `{ user }`
  - `chat:leave` → `{ user }`
  - `chat:typing` → `{ user, isTyping }`
  - `chat:message` → `{ message: { id, room_id, user_id, content, created_at } }`
- From client to server:
  - `{ "type": "chat:typing", "isTyping": true }`
  - `{ "type": "chat:message", "content": "Hello" }`

## Quick Test with Postman
1. Import `tmp/DU-IT-Simulation-Game.postman_collection.json`.
2. Register (once) and Login → token is saved to collection variable.
3. GET/POST messages via HTTP.
4. Open two WebSocket tabs to `/chat?token={{token}}` and send the sample payloads above. Observe join/typing/message/leave events.

## Quick Test with wscat
```bash
npm i -g wscat
wscat -c "ws://localhost:8000/chat?token=YOUR_JWT"
# then send
{"type":"chat:typing","isTyping":true}
{"type":"chat:message","content":"Hello from wscat"}
```

## Minimal Frontend Integration (Vanilla JS)
Create an `index.html` and open in a browser (replace `YOUR_JWT` with a real JWT):
```html
<!doctype html>
<html>
  <body>
    <div>
      <h3>Global Chat</h3>
      <div id="status"></div>
      <ul id="log"></ul>
      <input id="msg" placeholder="Type a message..." />
      <button id="send">Send</button>
    </div>
    <script>
      const token = 'YOUR_JWT';
      const ws = new WebSocket(`ws://localhost:8000/chat?token=${token}`);
      const log = (m) => {
        const li = document.createElement('li');
        li.textContent = m; document.getElementById('log').appendChild(li);
      };
      ws.onopen = () => log('connected');
      ws.onclose = () => log('disconnected');
      ws.onmessage = (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type === 'chat:joined') {
          document.getElementById('status').textContent = `Online: ${data.online.map(u=>u.username).join(', ')}`;
        } else if (data.type === 'chat:join') {
          log(`${data.user.username} joined`);
        } else if (data.type === 'chat:leave') {
          log(`${data.user.username} left`);
        } else if (data.type === 'chat:typing') {
          log(`${data.user.username} is typing...`);
        } else if (data.type === 'chat:message') {
          log(`#${data.message.id} <${data.message.user_id}>: ${data.message.content}`);
        }
      };
      const input = document.getElementById('msg');
      input.addEventListener('input', () => {
        ws.send(JSON.stringify({ type: 'chat:typing', isTyping: true }));
      });
      document.getElementById('send').onclick = () => {
        const content = input.value.trim();
        if (!content) return;
        ws.send(JSON.stringify({ type: 'chat:message', content }));
        input.value = '';
      };
    </script>
  </body>
</html>
```

## Notes & Next Steps
- Muted users (`user.is_muted`) can be enforced in `chat.ws.js` before saving/sending.
- Consider rate-limiting and content length caps in WS and HTTP routes.
- To preload history in the FE, call `GET /chat/general/messages` on page load.
