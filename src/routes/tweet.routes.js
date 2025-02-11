import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    createTweet
} from "../controllers/tweet.controllers.js";
import { limiter } from "../middlewares/rateLimiter.middlewares.js";

const router = Router()

router.use(verifyJWT)
router.route('/').post(limiter, createTweet)

export default router