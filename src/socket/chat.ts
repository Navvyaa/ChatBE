import { Server, Socket } from "socket.io";
import { Message } from "../models/Message";
import { Conversation } from "../models/Conversation";
import { User } from "../models/User";

export const registerChatHandlers = (io: Server, socket: Socket) => {
    const userId = socket.data.userId;
    socket.join(userId);
    User.findByIdAndUpdate(userId, {
        status: 'ONLINE',
        lastSeen: new Date()
    }).then(() => {
        socket.broadcast.emit("user-status-changed", {
            userId,
            status: 'ONLINE',
            timestamp: Date.now()
        });
    });
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

        try {
            const now = new Date();
            const result = await Message.updateMany(
                {
                    conversation: conversationId,
                    receiver: userId,
                    read: false
                },
                {
                    $set: { read: true, readAt: now }
                }
            );

            if (result.modifiedCount > 0) {
                io.to(conversationId).emit("messages-read", {
                    conversationId,
                    readBy: userId,
                    readAt: now,
                    count: result.modifiedCount
                });
            }
        } catch (err) {
            console.error("Error marking messages as read on join:", err);
        }

        socket.emit("joined", { conversationId });
    })

    socket.on("leaveConversation", () => {
        if (socket.data.conversationId) {
            socket.leave(socket.data.conversationId);
            socket.data.conversationId = null;
        }
    });

    socket.on("typing-start", async () => {
        const conversationId = socket.data.conversationId;
        if (!conversationId) {
            socket.emit("error", { message: "Join a conversation first." })
            return;
        }

        socket.to(conversationId).emit("user-typing", {
            conversationId,
            userId,
            isTyping: true,
            timestamp: Date.now()
        });
    });

    socket.on("typing-stop", async () => {
        const conversationId = socket.data.conversationId;
        if (!conversationId) {
            socket.emit("error", { message: "Join a conversation first." })
            return;
        }

        socket.to(conversationId).emit("user-typing", {
            conversationId,
            userId,
            isTyping: false,
            timestamp: Date.now()
        });
    })

    socket.on("sendMessage", async ({ content }) => {
        const conversationId = socket.data.conversationId;

        if (!conversationId) {
            socket.emit("error", {
                message: "You must join a conversation first.",
            });

            return;
        }
        if (!content) {
            socket.emit("error", {
                message: "Content is required"
            })
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


    socket.on("joinedMultipleConversations", async ({ conversationIds }) => {
        if (!conversationIds || !Array.isArray(conversationIds)) {
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


    socket.on("disconnect", async () => {
        console.log("user disconnected", userId);
        await User.findByIdAndUpdate(userId, {
            status: 'OFFLINE',
            lastSeen: new Date()
        });
        socket.broadcast.emit("user-status-changed", {
            userId,
            status: 'OFFLINE',
            lastSeen: Date.now(),
            timestamp: Date.now()
        });
    })
}