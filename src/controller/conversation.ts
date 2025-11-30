import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Conversation } from "../models/Conversation";

export const startConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.body;
        const currentUserId = req.user?._id;
        if(!userId){
            return res.status(400).json({message:"Participant id not provided"})
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
        const conversations = await Conversation.find({
            participants: req.user._id
        }).populate("participants", "username");

        res.json(conversations);
    } catch (err) {
        console.log(err);
    }
}