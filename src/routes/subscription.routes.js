import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import { limiter } from "../middlewares/rateLimiter.middlewares.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"

const router = Router()
router.use(verifyJWT)

router.route('/get-subscribers').get(limiter, getUserChannelSubscribers)
router.route('/subscribed-channels').get(limiter, getSubscribedChannels)
router.route('/:channelId').post(toggleSubscription)

export default router