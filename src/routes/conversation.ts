import { Router } from "express";
import { startConversation, listConversations } from "../controller/conversation";
import { protect } from "../middleware/auth";

const router = Router();
router.post("/", protect, startConversation);
router.get("/", protect, listConversations);
export default router;
