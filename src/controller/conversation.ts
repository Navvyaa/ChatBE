import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Conversation } from "../models/Conversation";

export const startConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.body;
        const currentUserId = req.user?._id;
        if (!userId) {
            return res.status(400).json({ message: "Participant id not provided" })
        }
        if (userId.toString() === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot start a conversation with yourself." })
        }
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, userId], $size: 2 }
        })

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, userId]
            })
        }

        res.json(conversation);
    } catch (err) {
        console.log(err)
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
            const searchRegex = new RegExp(search, 'i');
            const users = await require('../models/User').User.find({
                username: searchRegex
            }).select('_id');
            const userIds = users.map((u: any) => u._id);
            query.participants = { $in: [req.user._id, ...userIds] };
        }

        const total = await Conversation.countDocuments(query);
        const conversations = await Conversation.find(query)
            .populate("participants", "username email")
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