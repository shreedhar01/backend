import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    if(!['desc','asc'].includes(sortType.toLowerCase())){
        throw new ApiError(400,'provide valid sorttype')
    }

    if(!["createdAt", "views", "title"].includes(sortBy.toLowerCase())){
        throw new ApiError(400,'provide valid sorting')
    }

    const option = {
        page: Math.max(1, parseInt(page)),
        limit: Math.max(1, Math.min(parseInt(limit), 100)),
        sort: { [sortBy]: sortType.toLowerCase() === "desc" ? -1 : 1 }
    }

    const videoAggregation = await Video.aggregate([
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

const publishAVideo = asyncHandler(async (req, res)=>{
    const {title, description} = req.body
    const userId = req.user?._id

    const videoLocalPath = req.files?.video[0]?.path
    const thumbnailsLocalPath = req.files?.thumbnails[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400,"Video is not in localpath")
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

    if(!publish){
        throw new ApiError(400,"video not publish")
    }

    return res.status(200).json(
        new ApiResponse(200, publish, "video publish successfully")
    )
})

export {
    getAllVideos,
    publishAVideo
}