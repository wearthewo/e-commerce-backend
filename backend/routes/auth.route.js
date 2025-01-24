import express from "express";
import {
  signup,
  signin,
  logout,
  refreshToken,
} from "../controllers/auth.controller.js";

const router = express.Router();
router.post("/signup", signup);

router.post("/login", signin);

router.post("/logout", logout);

router.post("/refresh-token", refreshToken);

export default router;
