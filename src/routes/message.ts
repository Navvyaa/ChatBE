import { Router } from "express";
import { sendMessage, getMessages } from "../controller/message";
import { protect } from "../middleware/auth";

const router = Router();
router.post("/", protect, sendMessage);
router.get("/:conversationId", protect, getMessages);
export default router;
