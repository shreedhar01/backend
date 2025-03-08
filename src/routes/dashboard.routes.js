import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { limiter } from "../middlewares/rateLimiter.middlewares.js";
import {
    getChannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js"

const router = Router()

router.use(verifyJWT)
router.use(limiter)

router.route("/").get(getChannelStats)
router.route("/:channelId").get(getChannelVideos)

export default router