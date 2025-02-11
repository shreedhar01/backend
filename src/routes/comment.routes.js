import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"
import {
    addComment,
    getVideoComments,
    deleteComment,
    updateComment
} from "../controllers/comment.controller.js"

const router = Router()

router.use(verifyJWT)

router.route('/:videoId').get(getVideoComments).post(addComment)
router.route('/:commentId').delete(deleteComment).patch(updateComment)
export default router