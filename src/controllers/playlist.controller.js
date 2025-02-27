import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlists } from '../models/playlists.model.js'
import { asyncHandler } from "../utils/asyncHandeler.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";

const createPlaylist = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { videoId } = req?.params
    const { name, description } = req?.body

    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Provide name and description")
    }

    const isVideoExist = await Video.findById(videoId)
    if (!isVideoExist) {
        throw new ApiError(400, "Video doesnt exist")
    }
    const playlistCreated = await Playlists.create({
        name,
        description,
        video: [videoId],
        owner: userId

    })
    if (!playlistCreated) {
        throw new ApiError(400, "Playlist is not created")
    }

    return res.status(200).json(
        new ApiResponse(200, playlistCreated, "playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const {page=1, limit=10} = req?.query

    const schema = {
        page: Math.max(1, parseInt(page)),
        limit: Math.max(1, Math.min(parseInt(limit),100))
    }

    const userPlaylist = Playlists.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                as: "videodetails",
                localField:"video",
                foreignField:"_id"
            }
        }
    ])

    const result = await Playlists.aggregatePaginate(userPlaylist, schema)
    if(!result.docs){
        throw new ApiError(400,"data not get")
    }

    return res.status(200).json(
        new ApiResponse(200, {
            data: result.docs,
            pagination:{
                currentPage: result.page,
                totalVideo: result.totalDocs,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage,
            }
        }, "user playlist fetch successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists
}