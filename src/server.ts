import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { createServer } from "./config/createServer";

dotenv.config();

const PORT = process.env.PORT || 5000;

const {server}=createServer();

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
  });
});
