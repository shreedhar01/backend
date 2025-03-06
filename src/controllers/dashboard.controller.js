import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/likes.model.js";


//Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res)=>{
    const userId = req.user._id;

    const videoStats = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:null,
                totalvideo : {$count:{}},
                totalviews: {$sum: "$views"}
            }
        }
    ])

    const susStats = await Subscription.aggregate([
        {
            $match:{
                channel : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id: null,
                totalsubs : {$count: {}}
            }
        }
    ])

    const likeStats = await Like.aggregate([
        {
            $lookup:{
                from: "videos",
                localField:"video",
                foreignField: "_id",
                as : "videoDetails"
            }
        },
        {
            $match:{
                "$videoDetails.owner" : new mongoose.Types.ObjectId(userId),
                video : {$exists:true, $ne: null}
            }
        },
        {
            $group:{
                _id: null,
                totalLikes: {$count:{}}
            }
        }
    ])

    const stats = {
        totalVideos : videoStats[0]?.totalvideo || 0,
        totalViews : videoStats[0]?.totalviews || 0,
        totalSubscribers : susStats[0]?.totalsubs || 0,
        totalLikes : likeStats[0]?.totalLikes || 0
    }

    return res.status(200).json(
        new ApiResponse(200,stats,"")
    )
})

export {
    getChannelStats,
}
