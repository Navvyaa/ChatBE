import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Message } from "../models/Message";
import { Conversation } from "../models/Conversation";
import { io } from "../server";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { conversationId, content } = req.body;
  if(!conversationId || !content || conversationId===""){
    return res.status(400).json({message:"conversationId and content are required"})
  }
  if(content===""){
    return res.status(400).json({message:"Empty content cannot be send"})
  }
  const senderId = req.user._id;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({ message: "Conversation not found" });
  }

  if (!conversation.participants.some(p => p.equals(senderId))) {
    return res.status(403).json({ message: "Access denied" });
  }

 const receiverId = conversation.participants.find(p => !p.equals(senderId));
  if (!receiverId) {
    return res.status(400).json({ message: "Receiver not found" });
  }
  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    content
  });

  io.to(receiverId.toString()).emit("private-message", message);

  res.status(201).json(message);
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  const messages = await Message.find({
    conversation: req.params.conversationId
  }).sort({ createdAt: 1 });

  res.json(messages);
};
