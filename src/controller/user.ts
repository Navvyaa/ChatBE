import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

export const getUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("status lastSeen username");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            userId: user._id,
            username: user.username,
            status: user.status,
            lastSeen: user.lastSeen
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || typeof q !== 'string') {
            return res.status(400).json({ message: "Search query required" });
        }

        const searchRegex = new RegExp(q, 'i');
        const users = await User.find({
            $or: [
                { username: searchRegex },
                { email: searchRegex }
            ],
            _id: { $ne: req.user._id } 
        })
            .select("username email status lastSeen")
            .limit(parseInt(limit as string));
            if(!users || users.length==0){
               return  res.status(404).json({message:"No User found"});
            }

        res.json({ data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.body;

        if (!status || !['ONLINE', 'OFFLINE', 'AWAY'].includes(status)) {
            return res.status(400).json({
                message: "Valid status required (ONLINE, OFFLINE, AWAY)"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                status,
                lastSeen: new Date()
            },
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
