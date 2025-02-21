import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { limiter } from "../middlewares/rateLimiter.middlewares.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router()

router.use(verifyJWT)
router.use(limiter)

router.route('/').get(getAllVideos).post(upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnails",
        maxCount: 1
    }
]), publishAVideo)

router.route('/:videoId').get(getVideoById)
    .patch(updateVideo)
    .delete(deleteVideo)
    
router.route("/toggle/publish/:videoId").patch(togglePublishStatus)



export default router