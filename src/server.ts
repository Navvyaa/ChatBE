import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app";
import { connectDB } from "./config/db";
import { registerSocketHandlers } from "./socket";

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

registerSocketHandlers(io);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  });
});
