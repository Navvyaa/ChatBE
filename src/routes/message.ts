import { Router } from "express";
import { sendMessage, getMessages,deleteMessage,editMessage } from "../controller/message";
import { protect } from "../middleware/auth";

const router = Router();
router.post("/", protect, sendMessage);
router.get("/:conversationId", protect, getMessages);
router.patch("/:messageId", protect, editMessage);
router.delete("/:messageId", protect, deleteMessage);
export default router;
