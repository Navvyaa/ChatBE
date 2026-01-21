import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";

import authRoutes from "./routes/auth";
import conversationRoutes from "./routes/conversation";
import messageRoutes from "./routes/message";
import userRoutes from "./routes/user";
import asyncapiRoutes from "./routes/asyncapi";

import { errorHandler } from "./middleware/error";

dotenv.config();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());
app.use(express.static("public"));

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "Chat API Documentation"
}));

// AsyncAPI Documentation for Socket.IO
app.use("/socket-docs", asyncapiRoutes);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/", (_req, res) => {
  res.json({
    status: "OK",
    message: "Realtime Chat API Running",
    documentation: {
      restAPI: "http://localhost:5000/api-docs",
      socketIO: "http://localhost:5000/socket-docs",
      socketTester: "http://localhost:5000/socket-tester.html"
    }
  });
});


app.use(errorHandler);

export default app;
