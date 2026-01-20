import {register,login,refresh} from "../controller/auth"
import express from "express"

const router=express.Router();

router.post("/register",register);
router.post("/login",login);
router.post("/refresh",refresh)

export default router;