import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Conversation } from "../models/Conversation";
import { User } from "../models/User";
import mongoose from "mongoose";

export const startConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.body;
        const currentUserId = req.user?._id;
        if (!userId) {
            return res.status(400).json({ message: "Participant id not provided" })
        }
        if (userId.toString() === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot start a conversation with yourself" })
        }
        if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ message: "Invalid user id" });
        
        if (!(await User.exists({ _id: userId }))) return res.status(404).json({ message: "User not found" });
        
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, userId], $size: 2 }
        })
        
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, userId]
            })
        }

        // Populate participants with user details
        await conversation.populate("participants", "_id username email");

        res.json(conversation);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }

}

export const listConversations = async (req: AuthRequest, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const search = req.query.search as string;
        const skip = (page - 1) * limit;

        let query: any = {
            participants: req.user._id
        };

        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const users = await User.find({
                username: new RegExp(escaped, "i"),
                _id: { $ne: req.user._id },
            }).select("_id");
            query = {
                $and: [
                    { participants: req.user._id },
                    { participants: { $in: users.map((u) => u._id) } },
                ],
            };
        }

        const total = await Conversation.countDocuments(query);
        const conversations = await Conversation.find(query)
            .populate("participants", "_id username email")
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            data: conversations,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: skip + conversations.length < total
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
}