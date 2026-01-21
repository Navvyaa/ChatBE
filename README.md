# 💬 Real-Time Chat Application Backend

A production-ready real-time chat backend built with Node.js, Express, Socket.IO, MongoDB, and TypeScript featuring JWT authentication, message delivery receipts, typing indicators, and comprehensive API documentation.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-9.0-green)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-5.1-lightgrey)](https://expressjs.com/)

## 🌐 Live Demo with Interactive Documentation

- **REST API (Swagger)**: https://chatbe-owor.onrender.com/api-docs
- **WebSocket API (AsyncAPI)**: https://chatbe-owor.onrender.com/socket-docs
- **Socket.IO Tester**: https://chatbe-owor.onrender.com/socket-tester.html

## ✨ Key Features

### 🔐 Authentication & Security
- JWT-based authentication (Access + Refresh tokens)
- Bcrypt password hashing (10 rounds)
- Rate limiting (100 req/15min general, 7 req/15min auth)
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

### 👥 User Management
- User registration & login
- User search by username/email
- Real-time **presence system** (online/offline/away)
- Last seen timestamps
- User profile management

### 📱 Conversation Features
- Start new conversations
- List conversations with pagination
- Search conversations
- Automatic participant population

### 📨 Message Features
- Send messages with validation
- Retrieve messages with pagination
- Backward/forward pagination support
- Message timestamps
- Unread message tracking

## 🏗️ Architecture

```
┌─────────────┐
│   Client    │
│ (Web/Mobile)│
└──────┬──────┘
       │
       ├─────── HTTP/REST ────────┐
       │                          │
       │                          ▼
       │                   ┌─────────────┐
       │                   │   Express   │
       │                   │   Server    │
       │                   └──────┬──────┘
       │                          │
       └─── WebSocket (JWT) ──────┤
                                  │
                           ┌──────▼──────┐
                           │  Socket.IO  │
                           │   Server    │
                           └──────┬──────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
              [Conversation] [Typing]  [User Rooms]
                    │             │             │
                    └─────────────┴─────────────┘
                                  │
                                  ▼
                           ┌─────────────┐
                           │   MongoDB   │
                           └─────────────┘
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
- Node.js 20+
- MongoDB (local or cloud)
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd chat

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/chatApp

# Server
PORT=5000
NODE_ENV=development

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# API URL (for documentation)
API_URL=http://localhost:5000

# WebSocket URL
WS_HOST=localhost:5000

# CORS (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Run Development Server

```bash
npm run dev
# Server runs on http://localhost:5000
```

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── config/
│   ├── db.ts                 # MongoDB connection
│   └── swagger.ts            # Swagger configuration
├── controller/
│   ├── auth.ts               # Authentication logic
│   ├── conversation.ts       # Conversation management
│   ├── message.ts            # Message handling
│   └── user.ts               # User operations
├── middleware/
│   ├── auth.ts               # JWT authentication
│   └── error.ts              # Error handler
├── models/
│   ├── User.ts               # User schema
│   ├── Conversation.ts       # Conversation schema
│   └── Message.ts            # Message schema
├── routes/
│   ├── auth.ts               # Auth routes
│   ├── conversation.ts       # Conversation routes
│   ├── message.ts            # Message routes
│   ├── user.ts               # User routes
│   ├── asyncapi.ts           # AsyncAPI docs route
│   └── swagger.ts            # Swagger annotations
├── socket/
│   ├── index.ts              # Socket.IO setup
│   ├── auth.middleware.ts    # Socket auth
│   └── chat.ts               # Chat event handlers
├── utils/
│   ├── generateToken.ts      # JWT generation
│   └── validate.ts           # Input validation
├── app.ts                    # Express app setup
└── server.ts                 # Server entry point
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express 5.1, TypeScript 5.9
- **Real-time**: Socket.IO 4.8
- **Database**: MongoDB 9.0 (Mongoose ODM)
- **Authentication**: JWT, bcrypt
- **Security**: express-rate-limit, CORS
- **Documentation**: Swagger/OpenAPI, AsyncAPI
- **Deployment**: Render

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Protected routes with middleware
- ✅ Input validation (email, password strength)
- ✅ CORS whitelist configuration
- ✅ Rate limiting (prevents abuse)
- ✅ Environment variable management

## 🚀 Deployment

### Deploy to Render

1. Push to GitHub
2. Create Web Service on Render
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

### Docker Deployment

```bash
# Build image
docker build -t chat-backend .

# Run container
docker run -p 5000:5000 --env-file .env chat-backend
```
## 🧪 Testing

### Test with Swagger UI
1. Open https://chatbe-owor.onrender.com/api-docs
2. Register/Login to get JWT token
3. Click "Authorize" and paste token
4. Test all endpoints interactively

### Test WebSocket with Socket.IO Tester
1. Open https://chatbe-owor.onrender.com/socket-tester.html
2. Paste JWT token
3. Connect and test all events
4. View real-time event logs

---

**Built with ❤️ using Node.js, TypeScript, Express, Socket.IO, and MongoDB**
