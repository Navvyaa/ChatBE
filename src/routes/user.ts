import { Router } from "express";
import { protect } from "../middleware/auth";
import {
    getUserStatus,
    getUserProfile,
    searchUsers,
    updateUserStatus
} from "../controller/user";

const router = Router();

router.get("/search", protect, searchUsers);
router.get("/:userId/status", protect, getUserStatus);
router.get("/:userId", protect, getUserProfile);
router.put("/updatestatus", protect, updateUserStatus);

export default router;
