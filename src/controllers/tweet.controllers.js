import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";

const createTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const {content} = req.body
    if(!content?.trim()){
        throw new ApiError(400, "No content to add")
    }

    const tweet = await Tweet.create({
        owner: userId,
        content: content.trim()
    })
    if(!tweet){
        throw new ApiError(500, "Failed to create tweet")
    }

    return res.status(200).json(
        new ApiResponse(200, tweet, "Tweet created successfully")
    )
})

export {
    createTweet,
}