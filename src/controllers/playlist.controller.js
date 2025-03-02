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
    const { page = 1, limit = 10 } = req?.query

    const schema = {
        page: Math.max(1, parseInt(page)),
        limit: Math.max(1, Math.min(parseInt(limit), 100))
    }

    const userPlaylist = Playlists.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                as: "videodetails",
                localField: "video",
                foreignField: "_id"
            }
        }
    ])

    const result = await Playlists.aggregatePaginate(userPlaylist, schema)
    if (!result.docs) {
        throw new ApiError(400, "data not get")
    }

    return res.status(200).json(
        new ApiResponse(200, {
            data: result.docs,
            pagination: {
                currentPage: result.page,
                totalVideo: result.totalDocs,
                totalPages: result.totalPages,
                hasNextPage: result.hasNextPage,
                hasPrevPage: result.hasPrevPage,
            }
        }, "user playlist fetch successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const userId = req.user?._id

    if (!mongoose.isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID format")
    }

    const result = await Playlists.findOne({
        _id: playlistId,
        owner: userId
    })
    if (!result) {
        throw new ApiError(404, "playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200, result, "playlist fetch successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req?.params
    const userId = req.user?._id
    const { videoId } = req.query

    if (!mongoose.ObjectId.isValid(playlistId) || !mongoose.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "id is not valid")
    }

    const videoExist = await Video.findById(videoId)
    if(!videoExist){
        throw new ApiError(400,"video doesnt exist")
    }

    const addVideo = await Playlists.findOneAndUpdate(
        {
            _id: playlistId,
            owner: userId
        },
        {
            $addToSet:{ video: videoId }
        },
        {
            new: true
        }
    )
    if(!addVideo){
        throw new ApiError(400,"video not added to playlist")
    }
    return res.status(200).json(
        new ApiResponse(200,addVideo,"video added successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist
}