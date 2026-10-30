import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Message } from "../models/Message";
import { Conversation } from "../models/Conversation";
import { getIO } from "../socket/io";
import mongoose from "mongoose";

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId, content } = req.body;
    if (!conversationId || !content || conversationId === "") {
      return res.status(400).json({ message: "conversationId and content are required" })
    }
    if (content === "") {
      return res.status(400).json({ message: "Empty content cannot be send" })
    }
    const senderId = req.user._id;
    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ message: "Invalid conversation id" });


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
    await Conversation.updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } });

    getIO().to(receiverId.toString()).emit("private-message", message);

    res.status(201).json(message);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" })
  }
  
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const conversationId = req.params.conversationId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before ? parseInt(req.query.before as string) : null;
    const after = req.query.after ? parseInt(req.query.after as string) : null;
    const skip = (page - 1) * limit;

    if (!mongoose.isValidObjectId(conversationId)) return res.status(400).json({ message: "Invalid conversation id" });
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
          getIO().to(msg.sender._id.toString()).emit("message-delivered", {
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


const findOwnMessage =async (req:AuthRequest,res:Response)=>{
  try {
    const {messageId}=req.params;
  if(!mongoose.isValidObjectId(messageId)){
    res.status(400).json({message:"Invalid message id"});
    return null;
  }
  const message=await Message.findById(messageId);
    const userId = req.user._id.toString();
    const isSender = !!message && String(message.sender) === userId;
    const isReceiver = !!message && String(message.receiver) === userId;
    if (!message || (!isSender && !isReceiver)) {
    res.status(404).json({ message: "Message not found" });
    return null;
  }
  if (!isSender) {
    res.status(403).json({ message: "Only the sender can modify this message" });
    return null;
  }
  return message;
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  } 

}

const notifyParticipants = (
  message: { sender: unknown; receiver: unknown },
  event: string,
  payload: object
) => {
  getIO()
    .to([String(message.sender), String(message.receiver)])
    .emit(event, payload);
};


export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const message = await findOwnMessage(req, res);
    if (!message) return;
 
    const content = req.body?.content; // req.body can be undefined in Express 5
    if (typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (message.deleted) {
      return res.status(409).json({ message: "Deleted messages cannot be edited" });
    }
 
    message.content = content;
    message.edited = true;
    message.editedAt = new Date();
    await message.save();
 
    notifyParticipants(message, "message-edited", {
      messageId: message._id,
      conversationId: message.conversation,
      content: message.content,
      editedAt: message.editedAt,
    });
 
    return res.json(message);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};


export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const message = await findOwnMessage(req, res);
    if (!message) return;
 
    // Soft delete: keep the row (pagination and receipts stay consistent) but
    // wipe the text so it can never be fetched again. The filter makes this
    // idempotent and ensures the event is only sent by the request that
    // actually performed the delete.
    const deletedAt = new Date();
    const result = await Message.updateOne(
      { _id: message._id, deleted: { $ne: true } },
      { $set: { deleted: true, deletedAt, content: "" } }
    );
    const didDelete = result.modifiedCount === 1;
 
    if (didDelete) {
      notifyParticipants(message, "message-deleted", {
        messageId: message._id,
        conversationId: message.conversation,
        deletedAt,
      });
    }
 
    return res.json({
      _id: message._id,
      deleted: true,
      deletedAt: didDelete ? deletedAt : message.deletedAt,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

