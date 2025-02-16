import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { limiter } from "../middlewares/rateLimiter.middlewares.js";
import { publishAVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router()

router.use(verifyJWT)
router.use(limiter)

router.route('/').post(upload.fields([
    {
        name:"video",
        maxCount: 1
    },
    {
        name: "thumbnails",
        maxCount: 1
    }
]), publishAVideo)



export default router