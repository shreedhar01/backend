import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res, next) => {
    const { videoId } = req?.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId) {
        throw new ApiError(400, "VideoId required")
    }

    const totalComments = await Comment.countDocuments({
        video: mongoose.Types.ObjectId(videoId)
    })

    const comment = await Comment.aggregate([
        {
            $match: { video: mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: "users",
                as: "commentator",
                localField: "owner",
                foreignField: "_id"
            }
        },
        {
            $addFields: {
                owner: { $first: "$commentator" }
            }
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: {
                    avatar: 1,
                    userName: 1
                }
            }
        },
        {
            $skip: (page - 1) * limit
        },
        {
            $limit: parseInt(limit)
        }

    ])

    if (!comment) {
        throw new ApiError(500, "No comment found")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                comment,
                pagination: {
                    page,
                    limit,
                    totalComments,
                    totalPages: Math.ceil(totalComments / limit)
                }
            },
            "Comment fetched successfully")
    )
})

const addComment = asyncHandler(async (req, res, next) => {
    const { content } = req?.body
    const { videoId } = req?.params
    const userId  = req.user?._id

    if (!content?.trim()) {
        throw new ApiError(400, "Content required")
    }

    const isVideoExist = await Video.findById(videoId)
    if (!isVideoExist) {
        throw new ApiError(400, "Video not found")
    }

    const comment = await Comment.create({
        content: content,
        owner: userId,
        video: videoId
    })

    if(!comment){
        throw new ApiError(500, "Comment creation fail")
    }

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment added successfully")
    )
})



const updateComment = asyncHandler(async (req, res, next) => {

})


const deleteComment = asyncHandler(async (req, res, next) => {

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}