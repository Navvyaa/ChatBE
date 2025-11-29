import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { generateToken } from "../utils/generateToken";
import { isValidEmail, isStrongPassword } from "../utils/validate";

export const register = async (req: Request, res: Response) => {
    try {
        let { username, email, password } = req.body as { username?: any; email?: any; password?: any };
        username = typeof username === 'string' ? username.trim() : '';
        email = typeof email === 'string' ? email.trim() : '';
        password = typeof password === 'string' ? password.trim() : '';
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required." })
        }
        if (!isValidEmail(email))
            return res.status(400).json({message:"Enter a valid email"});
        if (!isStrongPassword(password))
            return res.status(400).json({ message: "Password must be 8 characters with a lower case, a upper case alphabet ,a special character and a digit" })
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "User already Exists" });
        }
        const user = await User.create({ email, username, password });
        return res.json({ message: "Registration Successful", user: { id: user._id, email, username } })
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: 'Server error' });
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        let { email, password } = req.body as { email?: any; password?: any };
        email = typeof email === 'string' ? email.trim() : '';
        password = typeof password === 'string' ? password.trim() : '';
        if (!email || !password)
            return res.status(400).json({ message: "Email and password are required." })
        if (!isValidEmail(email) || !isStrongPassword(password))
            return res.status(400).json({ message: "Invalid Email or Password" })
        const user = await User.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User does not exist .Please register" })
        const match = await user.comparePassword(password)
        if (!match)
            return res.status(400).json({ message: "Invalid Credentials" });
        // generateToken expects (email: string, id: string)
        const token = await generateToken(user.email, user._id.toString());
        return res.json({
            message: "Login successful",
            user: { id: user._id, username: user.username, email: user.email },
            token: token
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: 'Server error' });
    }
}