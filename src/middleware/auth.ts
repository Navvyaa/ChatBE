import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export  interface AuthRequest extends Request{
    user?:any;
}

export const protect = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        let token = req.headers.authorization?.startsWith("Bearer") ?
            req.headers.authorization.split(" ")[1] : null;
        if (!token)
            return res.status(400).json({ message: "No token provided." })

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
        const user = await User.findById(decoded.id).select("-password");
        if (!user) { return res.status(401).json({ message: "User not found" }); }
        req.user=user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Not authorized" });
    }
}