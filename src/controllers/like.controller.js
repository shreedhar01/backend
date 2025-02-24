import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import mongoose from "mongoose";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { likeId } = req.query
    const userId = req.user?._id
    const { videoId } = req.params

    const isVideoExist = await Video.findById(videoId)
    if (!isVideoExist) {
        throw new ApiError(403, "video not found")
    }

    const likeExist = await Like.findOneAndDelete({
        _id: likeId,
        likedby: userId
    })
    if (!likeExist) {
        const likeCreated = await Like.create({
            likedby: userId,
            video: videoId
        })
        if (!likeCreated) {
            throw new ApiError(400, "like was not created")
        }

        return res.status(200).json(
            new ApiResponse(200, likeCreated, "video is liked")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "video is disliked")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { likeId } = req.query
    const userId = req.user?._id
    const { commentId } = req.params

    const isCommentExist = await Comment.findById(commentId)
    if (!isCommentExist) {
        throw new ApiError(403, "Comment dont exist")
    }

    const unlike = await Like.findOneAndDelete({
        _id: likeId,
        likedby: userId
    })
    if (!unlike) {
        const like = await Like.create({
            likedby: userId,
            comment: commentId,
        })
        if (!like) {
            throw new ApiError(400, "like not created")
        }
        return res.status(200).json(
            new ApiResponse(200, like, "like created")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "successfully dislike")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { likeId } = req.query
    const { tweetId } = req.params

    const dislike = await Like.findOne({
        _id: likeId,
        likedby: userId
    })
    if (!dislike) {
        const createLike = await Like.create({
            likedby: userId,
            tweet: tweetId
        })
        if (!createLike) {
            throw new ApiError(400, "like not created")
        }
        return res.status(200).json(
            new ApiResponse(200, createLike, "tweet is successfully like")
        )
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "tweet successfully dislike")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sortBy, sortType } = req.query
    const userId = req.user?._id

    if (!['desc', 'asc'].includes(sortType.toLowerCase())) {
        throw new ApiError(400, 'provide valid sorttype')
    }

    if (!["createdAt", "views", "title"].includes(sortBy.toLowerCase())) {
        throw new ApiError(400, 'provide valid sorting')
    }

    const option = {
        page: page,
        limit: limit,
        sort: { [sortBy]: sortType.toLowerCase() === "asc" ? -1 : 1 }
    }

    const likeVideos = Like.aggregate([
        {
            $match: {
                likedby: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                as: "videoData",
                localField: "video",
                foreignField: "_id"
            }
        },
        {
            $unwind: "$videoData"
        }
    ])

    const result = await Like.aggregatePaginate(likeVideos, option)
    if (!result) {
        throw new ApiError(400, "no videos found")
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
        }, "videos fetch successfully")
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}