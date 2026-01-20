import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Message } from "../models/Message";
import { Conversation } from "../models/Conversation";
import { io } from "../server";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const { conversationId, content } = req.body;
  if (!conversationId || !content || conversationId === "") {
    return res.status(400).json({ message: "conversationId and content are required" })
  }
  if (content === "") {
    return res.status(400).json({ message: "Empty content cannot be send" })
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
  try {
    const conversationId = req.params.conversationId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? parseInt(req.query.before as string) : null;
    const after = req.query.after ? parseInt(req.query.after as string) : null;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!conversation.participants.some(p => p.equals(req.user._id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    let query: any = { conversation: conversationId };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    } else if (after) {
      query.createdAt = { $gt: new Date(after) };
    }

    const total = await Message.countDocuments({ conversation: conversationId });
    const messages = await Message.find(query)
      .populate("sender", "username email")
      .populate("receiver", "username email")
      .sort({ createdAt: before ? -1 : 1 })
      .skip(skip)
      .limit(limit);

    const undeliveredMessageIds = messages.filter(m =>
      m.receiver._id.toString() === req.user._id.toString() && !m.delivered
    ).map(m=>m._id)

    if (undeliveredMessageIds.length > 0) {
      const now = new Date();
      await Message.updateMany(
        { _id: { $in: undeliveredMessageIds } },
        {
          $set: {
            delivered: true,
            deliveredAt: now
          }
        }
      );

      undeliveredMessageIds.forEach(msgId => {
        const msg = messages.find(m => m._id.toString() === msgId.toString());
        if (msg) {
          io.to(msg.sender._id.toString()).emit("message-delivered", {
            messageId: msgId,
            deliveredAt: now
          });
        }
      });
    }

    if (before) {
      messages.reverse();
    }

    res.json({
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + messages.length < total
      }
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
