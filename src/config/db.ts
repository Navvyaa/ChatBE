import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGO_URI as string);
        console.log(`MongoDB connected: ${connection.connection.host}`)
    } catch (err) {
        console.log("MongoDB disconnected");
        process.exit(1);
    }
}