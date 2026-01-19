import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth";
import conversationRoutes from "./routes/conversation";
import messageRoutes from "./routes/message";
import userRoutes from "./routes/user";

import { errorHandler } from "./middleware/error";

dotenv.config();

const app = express();

app.use(cors({ origin: "*", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.get("/", (_req, res) => {
  res.json({ status: "OK", message: "Realtime Chat API Running" });
});


app.use(errorHandler);

export default app;
