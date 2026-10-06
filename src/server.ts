import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { createServer } from "./config/createServer";
import { attachRedisAdapter } from "./config/redis";

dotenv.config();

const PORT = process.env.PORT || 5000;

const { server, io } = createServer();
const start = async () => {
  await connectDB();
  if (process.env.REDIS_URL) {
    await attachRedisAdapter(io, process.env.REDIS_URL);
    console.log("Socket.IO Redis adapter enabled");
  }
  server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  }); 
}
start();
