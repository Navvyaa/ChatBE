# 💬 Real-Time Chat Application Backend

A real-time chat backend built with Node.js, Express, Socket.IO, MongoDB, and TypeScript featuring JWT authentication, message delivery receipts, typing indicators, and comprehensive API documentation.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.0-green)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey)](https://expressjs.com/)

## 🌐 Live Demo with Interactive Documentation

- **REST API (Swagger)**: https://chatbe-owor.onrender.com/api-docs
- **WebSocket API (AsyncAPI)**: https://chatbe-owor.onrender.com/socket-docs
- **Socket.IO Tester**: https://chatbe-owor.onrender.com/socket-tester.html
> The demo runs on Render's free tier, which sleeps after inactivity. The first request can take around a minute while it wakes up.

## 📌 Highlights
 
- **Reliable under load**: 0% message loss and 0 failed connections at every load-test size, up to 1,000 concurrent WebSocket connections
- **Fast at realistic scale**: p95 delivery latency under 60 ms up to 400 concurrent connections (see [Load Testing](#-load-testing))
- **Horizontally scalable**: optional Redis adapter lets multiple server instances behave as one, with cross-instance delivery, receipts, and presence covered by tests
- **Tested**: unit, integration, and WebSocket tests run in GitHub Actions against real MongoDB and Redis
- **Well documented**: Swagger for REST and AsyncAPI for WebSocket events, both served live

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication (Access + Refresh tokens)
- Bcrypt password hashing (10 rounds)
- Rate limiting: 100 requests/15 min in general, 5 failed attempts/15 min on auth routes, 50 messages/min
- Protected routes with middleware
- CORS with whitelist configuration

### 💬 Real-Time Messaging
- **Socket.IO WebSocket** connections
- Private one-to-one conversations
- Real-time message delivery
- ✓✓ **Delivery & Read Receipts**
- **Typing indicators** with start/stop events
- Auto-mark messages as read on join
- Multi-conversation support
- Presence (online/offline) with last-seen timestamps, correct across multiple tabs and devices
  
### 📱 Conversations & Messages
- Start conversations (an existing one is reused, never duplicated)
- List conversations with pagination, most recently active first
- Search conversations by participant username
- Retrieve message history with page-based and cursor-based (`before`/`after`) pagination
- Unread and undelivered tracking
  
### 🧪 Engineering
- Unit, integration, and WebSocket tests
- GitHub Actions CI (build, tests against real MongoDB and Redis, Docker image build)
- Multi-stage Dockerfile and Docker Compose for local development
- WebSocket load-test script

## 🏗️ Architecture
```
            ┌──────────────┐
            │    Client    │
            │ (Web/Mobile) │
            └──────┬───────┘
                   │  REST (HTTP)  +  WebSocket (JWT)
                   ▼
        ┌─────────────────────┐        ┌───────────────────┐
        │  Server instance 1  │◄──────►│  Redis (optional) │
        │  Express+Socket.IO  │ pub/sub│  pub/sub bus for  │
        └──────────┬──────────┘        │  live events only │
                   │                   └─────────▲─────────┘
                   │                             │ pub/sub
                   │                  ┌──────────┴──────────┐
                   │                  │  Server instance N  │
                   │                  └──────────┬──────────┘
                   ▼                             ▼
        ┌──────────────────────────────────────────────────┐
        │   MongoDB: users, conversations, messages        │
        │   (source of truth, incl. delivered/read state)  │
        └──────────────────────────────────────────────────┘
```

### Database Schema

```
User                    Conversation              Message
├── _id                 ├── _id                   ├── _id
├── username            ├── participants[]        ├── conversation
├── email               ├── createdAt             ├── sender
├── password            └── updatedAt             ├── receiver
├── status                                        ├── content
├── lastSeen                                      ├── delivered
├── createdAt                                     ├── deliveredAt
└── updatedAt                                     ├── read
                                                  ├── readAt
                                                  ├── createdAt
                                                  └── updatedAt
```
## 🚀 Quick Start
 
### Prerequisites
- Node.js 22
- MongoDB (local or Atlas), or Docker
- npm
### Option A: Docker Compose (easiest)
 
```bash
git clone https://github.com/Navvyaa/ChatBE.git
cd ChatBE
 
cp .env.example .env
# Edit .env and set JWT_SECRET and JWT_REFRESH_SECRET
 
docker compose up --build
```
 
The API is at http://localhost:5000, with docs at http://localhost:5000/api-docs. Compose starts the app, MongoDB, and Redis together.
 
### Option B: Run directly
 
```bash
git clone https://github.com/Navvyaa/ChatBE.git
cd ChatBE
 
npm install
 
cp .env.example .env
# Edit .env with your configuration
 
npm run dev
# Server runs on http://localhost:5000
```
 
### Environment Variables
 
```env
# Database
MONGO_URI=mongodb://localhost:27017/chatApp
 
# Server
PORT=5000
NODE_ENV=development
 
# JWT secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
 
# API URL (for documentation)
API_URL=http://localhost:5000
 
# WebSocket URL
WS_HOST=localhost:5000
 
# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
 
# Optional: enables the Redis adapter for multi-instance deployments.
# Leave unset to run as a single instance.
# REDIS_URL=redis://localhost:6379
```
 
### Build for Production
 
```bash
npm run build
npm start
```
 
## 🧪 Testing
 
The suite covers three layers:
 
- **Unit**: validation helpers and token generation
- **Integration** (Jest + Supertest, real MongoDB): registration, login, refresh, the auth middleware, conversations, messages, pagination, and access control
- **WebSocket** (`socket.io-client` against a real server): connection auth, joining, messaging, delivery and read receipts, typing indicators, presence, and cross-instance delivery through Redis
```bash
npm test
```
 
The first run downloads an in-memory MongoDB binary, which takes a few minutes. After that it is cached. To use an existing MongoDB instead, set `TEST_MONGO_URI`.
 
The Redis tests start two server instances sharing one Redis and check that messages, receipts, and presence work across them. They run only when `REDIS_URL` is set and are skipped otherwise:
 
```powershell
# PowerShell
$env:REDIS_URL="redis://127.0.0.1:6379"
npm test
```
 
Run the whole suite inside Docker (MongoDB and Redis included):
 
```bash
docker compose run --rm test
```
### Continuous Integration
 
Every push to `main` and every pull request runs GitHub Actions:
 
1. Starts MongoDB and Redis service containers
2. Installs dependencies and builds the TypeScript
3. Runs the full test suite
4. Builds the production Docker image
### Manual testing
 
- **Swagger UI**: open `/api-docs`, register and log in to get a JWT, click "Authorize", and try the endpoints
- **Socket.IO Tester**: open `/socket-tester.html`, paste a JWT, connect, and watch the event log
## 📈 Scaling with Redis
 
With one server, Socket.IO knows every connected user. With several servers behind a load balancer, a user on server A cannot reach a user on server B, and "is the receiver online?" only sees the sockets on the current server.
 
When `REDIS_URL` is set, the app attaches the [Socket.IO Redis adapter](https://socket.io/docs/v4/redis-adapter/):
 
- Events emitted on one instance are forwarded to clients connected to the others
- Receiver presence is checked across all instances (`fetchSockets()`), so delivery receipts stay correct
- A user is only marked offline when their last connection, on any instance, closes
MongoDB remains the source of truth for messages and delivered/read state. Redis pub/sub is at-most-once, so an event missed during a brief Redis outage is recovered when the client reloads history from the database.
 
Running multiple instances behind a load balancer requires WebSocket-only transport (`transports: ["websocket"]`) or sticky sessions.
 
## 📊 Load Testing
 
`loadtest/run.js` opens real WebSocket connections in sender/receiver pairs. Every sender emits one message per second for 60 seconds, and each receiver measures the time from send to arrival. That latency includes the MongoDB write and the Redis adapter hop.
 
**Test setup:** a single server instance with the Redis adapter enabled, MongoDB and Redis in Docker, on an Intel Core i7-1355U laptop (2 performance + 8 efficiency cores, 12 threads), Docker Desktop on WSL2 with 7.6 GiB of memory. The server, MongoDB, Redis, and the load generator all ran on the same machine, so the results are conservative compared to dedicated hardware.
 
| Connections | Msgs/s | Connect p95 | Latency p50 | Latency p95 | Latency p99 | Message loss |
|---|---|---|---|---|---|---|
| 100 (50 pairs) | 49 | 23 ms | 10 ms | 22 ms | 34 ms | 0% |
| 200 (100 pairs) | 98 | 27 ms | 12 ms | 21 ms | 26 ms | 0% |
| 400 (200 pairs) | 195 | 27 ms | 34 ms | 57 ms | 82 ms | 0% |
| 800 (400 pairs) | 392 | 134 ms | 205 ms | 2,128 ms | 2,863 ms | 0% |
| 1,000 (500 pairs) | 490 | 175 ms | 533 ms | 3,531 ms | 3,651 ms | 0% |
 
**What the results show**
 
- Up to 400 concurrent connections, p95 delivery latency stays under 60 ms.
- Between 400 and 800 connections, tail latency climbs sharply: at 800, the median is still about 200 ms, but 1 in 20 messages waits over 2 seconds.
- Under overload the server slows down instead of failing: no messages were lost and no connections were refused at any size.
- At 1,000 connections the app container sat at roughly one full CPU core in `docker stats`, while MongoDB used about half a core and Redis almost nothing. That is consistent with a single Node process becoming the bottleneck, which is the case the Redis adapter is meant to address by running more instances.
  
**Limits of this test:** each size was run once, every simulated user sends a message every second (heavier than typical chat usage), and the load generator is itself a single Node process sharing the machine with the server. The numbers show how the system behaves, not a production capacity guarantee.
 
**Run it yourself**
 
```powershell
# PowerShell: start the stack with rate limiting off and a disposable database.
# Never do this on a real deployment.
$env:DISABLE_RATE_LIMIT="true"
$env:MONGO_URI="mongodb://mongo:27017/chatLoad"
docker compose up -d --build
 
# 100 pairs (200 connections), 1 msg/s each, 60 seconds
$env:PAIRS="100"; $env:DURATION="60"; $env:RATE="1"
node loadtest/run.js
```
 
```bash
# bash
DISABLE_RATE_LIMIT=true MONGO_URI=mongodb://mongo:27017/chatLoad docker compose up -d --build
PAIRS=100 DURATION=60 RATE=1 node loadtest/run.js
```
 
The script creates test users, so point it at a disposable database and never at production. Results are printed to the console and written to `loadtest/result-<N>pairs.json` (git-ignored).

---

## 🚀 Deployment
 
### Deploy to Render
 
1. Push to GitHub
2. Create a Web Service on Render
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. Add environment variables:
```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   API_URL=https://your-app.onrender.com
   WS_HOST=your-app.onrender.com
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend.com
```
6. Deploy
Render does not host MongoDB, so use a hosted database such as MongoDB Atlas for `MONGO_URI`. `REDIS_URL` is only needed when running more than one instance, so leave it unset for a single-instance deployment. Never set `DISABLE_RATE_LIMIT` in production.
 
### Docker
 
```bash
# Build the production image
docker build -t chat-backend .
 
# Run it
docker run -p 5000:5000 --env-file .env chat-backend
```


## 🛠️ Tech Stack
 
- **Backend**: Node.js, Express 5.1, TypeScript 5.9
- **Real-time**: Socket.IO 4.8, Redis adapter
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT, bcrypt
- **Security**: express-rate-limit, CORS
- **Testing**: Jest, Supertest, socket.io-client, mongodb-memory-server
- **DevOps**: Docker, Docker Compose, GitHub Actions
- **Documentation**: Swagger/OpenAPI, AsyncAPI
- **Deployment**: Render

---

