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
    });

    socket.on("disconnect", () => {
        console.log("user disconnected", userId)
    })
}