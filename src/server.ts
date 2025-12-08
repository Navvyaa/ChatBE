import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import app from "./app";
import { connectDB } from "./config/db";
import { Message } from "./models/Message";
import { Conversation } from "./models/Conversation"; 

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    socket.data.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error("Unauthorized socket"));
  }
});


io.on("connection", (socket) => {
  const userId = socket.data.userId;
  socket.join(userId);
  console.log("User connected:", userId);

  socket.on("joinConversation", async (data) => {
     console.log("Raw data received:", data); 
  console.log("Data type:", typeof data);
    const { conversationId } = data;
    console.log(conversationId)
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.equals(userId))) {
      socket.emit("error", { message: "Accessjhhb denied" });
      return;
    }
    
    socket.join(conversationId);
    socket.emit("joined", { conversationId });
  });

  socket.on("sendMessage", async (data) => {
    console.log("data"+data)
    const { content } = data;
    console.log("content is :"+ content)
    if (!content || content === "") {
      socket.emit("error", { message: "Content required" });
      return;
    }

    const rooms = Array.from(socket.rooms);
    const conversationId = rooms.find(room => room !== socket.id && room !== userId);
    
    if (!conversationId) {
      socket.emit("error", { message: "Join conversation first" });
      return;
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.participants.some(p => p.equals(userId))) {
      socket.emit("error", { message: "Access denied" });
      return;
    }
    
    const receiverId = conversation.participants.find(p => !p.equals(userId));
    const message = await Message.create({
      conversation: conversationId,    
      sender: userId,                 
      receiver: receiverId,          
      content
    });
    
    io.to(conversationId).emit("private-message", message);
    socket.emit("message-sent", message);
  });
});


connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  });
});
