import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import rateLimit from "express-rate-limit"
import authRoutes from "./routes/auth";
import conversationRoutes from "./routes/conversation";
import messageRoutes from "./routes/message";
import userRoutes from "./routes/user";
import asyncapiRoutes from "./routes/asyncapi";

import { errorHandler } from "./middleware/error";

dotenv.config();

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Request-Id']
}));

app.use(express.json());
app.use(express.static("public"));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 7,
  message: {
    status: 429,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const messageLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 50,
  message: {
    status: 429,
    message: 'You are sending messages too quickly. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


app.use('/api/', generalLimiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Chat API Documentation"
}));

app.use("/socket-docs", asyncapiRoutes);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageLimiter, messageRoutes);
app.use("/api/users", userRoutes);
app.use(errorHandler);

export default app;
