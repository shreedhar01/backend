import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { limiter } from "../middlewares/rateLimiter.middlewares.js";

const router = Router()

router.route('/register').post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    },
]), registerUser)

router.route('/login').post(loginUser)

//secure routes
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken) // not done from postman
router.route('/changepass').post(verifyJWT,limiter, changeCurrentPassword)

router.route('/updatedetail').patch(verifyJWT, updateAccountDetails)
router.route('/updateavatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatar)
router.route('/updatecoverimage').patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)

router.route('/currentuser').get(verifyJWT, getCurrentUser)
router.route('/channeldetail/:userName').get(verifyJWT, getUserChannelProfile)
router.route('/watchhistory').get(verifyJWT, getWatchHistory)
export default router