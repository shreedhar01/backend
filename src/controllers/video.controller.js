import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    if (!['desc', 'asc'].includes(sortType.toLowerCase())) {
        throw new ApiError(400, 'provide valid sorttype')
    }

    if (!["createdAt", "views", "title"].includes(sortBy.toLowerCase())) {
        throw new ApiError(400, 'provide valid sorting')
    }

    const option = {
        page: Math.max(1, parseInt(page)),
        limit: Math.max(1, Math.min(parseInt(limit), 100)),
        sort: { [sortBy]: sortType.toLowerCase() === "desc" ? -1 : 1 }
    }

    const videoAggregation = Video.aggregate([
        {
            $match: {
                title: query ? {
                    $regex: query,
                    $options: 'i'
                } : { $exists: true } //return all video if query doesnt match
            }
        },
        {
            $lookup: {
                from: "users",
                as: "videoprovider",
                localField: "owner",
                foreignField: "_id"
            }
        },
        {
            $addFields: {
                providerInfo: { $first: "$videoprovider" }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnails: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                providerInfo: {
                    userName: 1,
                    avatar: 1
                }
            }
        }
    ])

    const result = await Video.aggregatePaginate(videoAggregation, option)
    if (!result) {
        throw new ApiError(400, "Video doesnt get")
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

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const userId = req.user?._id

    const videoLocalPath = req.files?.video[0]?.path
    const thumbnailsLocalPath = req.files?.thumbnails[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video is not in localpath")
    }

    const videoCloudPath = await uploadOnCloudinary(videoLocalPath)
    const thumbnailsCloudPath = await uploadOnCloudinary(thumbnailsLocalPath)

    const publish = await Video.create({
        videoFile: videoCloudPath.url,
        thumbnails: thumbnailsCloudPath.url || "",
        owner: userId,
        title: title,
        description: description,
        duration: videoCloudPath.duration,
        views: 0,
        isPublish: true
    })

    if (!publish) {
        throw new ApiError(400, "video not publish")
    }

    return res.status(200).json(
        new ApiResponse(200, publish, "video publish successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId?.trim() || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "invalid video id")
    }

    const isUpdated = await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    })
    if (!isUpdated) {
        throw new ApiError(400, "view is not updated")
    }

    const video = await Video.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $lookup: {
                from: "users",
                as: "ownerinfo",
                localField: "owner",
                foreignField: "_id"
            }
        },
        {
            $addFields: {
                ownerInfo: { $first: "$ownerinfo" }
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnails: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                ownerInfo: {
                    userName: 1,
                    avatar: 1
                }
            }
        }
    ])

    if (!video?.length) {
        throw new ApiError(400, "video not found")
    }

    return res.status(200).json(
        new ApiResponse(200, video[0], "video fetch successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const userId = req.user?._id
    console.log(title);
    
    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "some data is messing")
    }

    // const { thumbnails } = req.files[0]?.thumbnails?.path
    // const uploadedThumblails = await uploadOnCloudinary(thumbnails)
    // if (!uploadedThumblails) {
    //     throw new ApiError(400, "video not uploaded")
    // }


    const result = await Video.findOneAndUpdate(
        {
            _id: videoId,
            owner: userId
        },
        {
            $set: {
                // thumbnails: uploadedThumblails,
                title: title?.trim(),
                description: description?.trim()
            }
        },
        {
            new: true
        }
    )
    if (!result) {
        throw new ApiError(400, "video not updated")
    }

    return res.status(200).json(
        new ApiResponse(200, result, "video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id

    const deleteVideo = await Video.findOneAndDelete({
        owner: userId,
        _id: videoId
    })
    if (!deleteVideo) {
        throw new ApiError(400, "video not delete")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "video delete successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user?._id

    const statusUpdated =await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId),
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $set:{
                isPublish:  {$not: "$isPublish"}
            }
        }
    ])
    if (!statusUpdated) {
        throw new ApiError(400, "publish is not change")
    }

    return res.status(200).json(
        new ApiResponse(200, statusUpdated[0], "isPublish toggle successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}