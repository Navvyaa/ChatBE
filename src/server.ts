import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoute from "./routes/auth"
import { connectDB } from "./config/db";

dotenv.config();
const app=express();


app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use("/api/auth",authRoute)
const PORT=process.env.PORT||5000;
connectDB().then(()=>{
        app.listen( PORT,()=>console.log(`Server is running at ${PORT}`))
})

