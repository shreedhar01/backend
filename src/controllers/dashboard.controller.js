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
                "videoDetails.owner" : new mongoose.Types.ObjectId(userId),
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

//all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res)=>{
    const {channelId} = req.params
    const { page = 1, limit = 10 } = req.query

    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400,"not a valid channel id")
    }

    const option = {
        page: Math.max(1, parseInt(page)),
        limit: Math.max(1, Math.min(parseInt(limit), 100))
    }

    const allVideo = Video.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(channelId)
            }
        }
    ])

    const result = await Video.aggregatePaginate(allVideo, option)

    if(!result.docs){
        throw new ApiError(404,"videos not found")
    }

    return res.status(200).json(
        new ApiResponse(200, {
            result: result.docs,
            pagination: {
                currentPage: result.page,
                totalVideo: result.totalDocs,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage,
                hasPrePage: result.hasPrePage,
            }
        }, 'video fetch successfully')
    )
})

export {
    getChannelStats,
    getChannelVideos
}
