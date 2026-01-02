import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Conversation } from "../models/Conversation";

export const registerChatHandlers = (io: Server, socket: Socket) => {
    const userId = socket.data.userId;
    socket.join(userId);
    socket.on("joinConversation", async ({ conversationId }) => {
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
            socket.emit("error", { message: "Conversation not found" });
            return;
        }
        if (!conversation.participants.some(p => p.equals(userId))) {
            socket.emit("error", { message: "Access Denied" });
            return;
        }

        socket.data.conversationId = conversationId;
        socket.join(conversationId);
        socket.emit("joined", { conversationId });
    })

    socket.on("leaveConversation", () => {
        if (socket.data.conversationId) {
            socket.leave(socket.data.conversationId);
            socket.data.conversationId = null;
        }
    })

    socket.on("sendMessage", async ({ content }) => {
        const conversationId = socket.data.conversationId;

        if (!conversationId || !content) {
            socket.emit("error", {
                message: "Content is required and you must join a conversation first.",
            });
            return;
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.some(p => p.equals(userId))) {
            socket.emit("error", { message: "Access Denied" });
            return;
        }

        const receiverId = conversation.participants.find(p => !p.equals(userId));
        if (!receiverId) {
            socket.emit("error", { message: "Receiver not found" });
            return;
        }


        const message = await Message.create({
            conversation: conversationId,
            sender: userId,
            receiver: receiverId,
            content,
        });

        io.to(conversationId).emit("private-message", message);

        const receiverSocketId = Array.from(io.sockets.sockets.values())
            .find(s => s.data.userId?.toString() === receiverId.toString())?.id;

        if (receiverSocketId) {
            message.delivered = true;
            message.deliveredAt = new Date();
            await message.save();

            io.to(conversationId).emit("message-delivered", {
                messageId: message._id,
                deliveredAt: message.deliveredAt
            });
        }
    });

    socket.on("markAsRead", async ({ messageIds }) => {
        if (!messageIds || !Array.isArray(messageIds)) {
            socket.emit("error", { message: "messageIds array required" });
            return;
        }

        try {
            const now = new Date();
            await Message.updateMany(
                {
                    _id: { $in: messageIds },
                    receiver: userId,
                    read: false
                },
                {
                    $set: { read: true, readAt: now }
                }
            );

            const messages = await Message.find({ _id: { $in: messageIds } });
            const conversationIds = [...new Set(messages.map(m => m.conversation.toString()))];

            conversationIds.forEach(convId => {
                io.to(convId).emit("messages-read", {
                    messageIds,
                    readAt: now,
                    readBy: userId
                });
            });
        } catch (err) {
            console.error("Error marking messages as read:", err);
            socket.emit("error", { message: "Failed to mark messages as read" });
        }
    });

    socket.on("joinedMultipleConversations", async ({ conversationIds }) => {
        if (!conversationIds || Array.isArray(conversationIds)) {
            socket.emit("error", { message: "conversationIds array required." });
            return;
        }
        const results = [];
        for (const conversationId of conversationIds) {
            const conversation = await Conversation.findById(conversationId);
            if (conversation && conversation.participants.some(p => p.equals(userId))) {
                socket.join(conversationId);
                results.push({ conversationId, status: "joined" });
            } else {
                results.push({ conversationId, status: "denied" });
            }
        }
        socket.emit("joinedMultiple", { results });
    }
    )


    socket.on("disconnect", () => {
        console.log("user disconnected", userId)
    })
}