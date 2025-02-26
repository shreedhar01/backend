import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlists } from '../models/playlists.model.js'
import { asyncHandler } from "../utils/asyncHandeler.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const {videoId} = req?.params
    const {name, description} = req?.body

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400,"Provide name and description")
    }

    const isVideoExist = await Video.findById(videoId)
    if(!isVideoExist){
        throw new ApiError(400,"Video doesnt exist")
    }
    const playlistCreated = await Playlists.create({
        name,
        description,
        video: [videoId],
        owner: userId

    })
    if(!playlistCreated){
        throw new ApiError(400,"Playlist is not created")
    }

    return res.status(200).json(
        new ApiResponse(200,playlistCreated,"playlist created successfully")
    )
})

export {
    createPlaylist,
}