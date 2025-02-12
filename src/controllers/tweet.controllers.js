import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";
import mongoose from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { content } = req.body
    if (!content?.trim()) {
        throw new ApiError(400, "No content to add")
    }

    const tweet = await Tweet.create({
        owner: userId,
        content: content.trim()
    })
    if (!tweet) {
        throw new ApiError(500, "Failed to create tweet")
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
})

const getUserTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    const tweets = await Tweet.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId) }
        },
        {
            $project: {
                _id: 1,
                createdAt: 1,
                content: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        }
    ])
    if (!tweets) {
        throw new ApiError(400, "Either owner and tweet id dont match or tweet dont exist")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            tweets,
            "tweet get successfully"
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { tweetId } = req.params
    const userId = req.user?._id

    if (!content?.trim()) {
        throw new ApiError(400, "Sorry Content is required")
    }


    const updatedTweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: userId
        },
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true
        }
    )



    if (!updatedTweet) {
        throw new ApiError(400, "Tweet not found or you don't have permission to update")
    }
    return res.status(200).json(
        new ApiResponse(200, updatedTweet, "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const userId = req.user?._id

    if (!tweetId?.trim()) {
        throw new ApiError(400, "sorry tweetid not found")
    }

    const deletedTweet = await Tweet.deleteOne(
        {
            _id: tweetId,
            owner: userId
        }
    )

    if (!deletedTweet.acknowledged) {
        throw new ApiError(400, "Tweet not found or you don't have permission to delete")
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet deleted successfully")
    )
})



export {
    createTweet,
    getUserTweet,
    updateTweet,
    deleteTweet
}