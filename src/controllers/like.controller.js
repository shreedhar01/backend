import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import { Like } from "../models/likes.model.js";
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";

const toggleVideoLike = asyncHandler(async (req, res)=>{
    const {likeId} = req.query
    const userId = req.user?._id
    const {videoId} = req.params

    const isVideoExist = await Video.findById(videoId)
    if(!isVideoExist){
        throw new ApiError(403,"video not found")
    }

    const likeExist = await Like.findOneAndDelete({
        _id: likeId,
        likedby: userId
    })
    if(!likeExist){
        const likeCreated = await Like.create({
            likedby:userId,
            video: videoId
        })
        if(!likeCreated){
            throw new ApiError(400,"like was not created")
        }

        return res.status(200).json(
            new ApiResponse(200, likeCreated, "video is liked")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "video is disliked")
    )
})

export {
    toggleVideoLike,
}