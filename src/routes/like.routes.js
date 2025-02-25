import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { limiter } from "../middlewares/rateLimiter.middlewares.js";

const router = Router()
router.use(verifyJWT)

router.route("/getlikedvideos").get(getLikedVideos)
    
router.route("/video/:videoId").patch(toggleVideoLike)
router.route("/comment/:videoId").patch(toggleCommentLike)
router.route("/tweet/:videoId").patch(toggleTweetLike)

export default router