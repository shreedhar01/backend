import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandeler.js";
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler(async (req, res, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            throw new ApiError(400, "Unauthorized request")
        }
        const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const userFromDb = await User.findById(decodedData._id).select("-password -refreshToken")
        if(!userFromDb){
            throw new ApiError(400, "Invalid Access Token")
        }
        req.user = userFromDb
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access Token")
    }
})

export { verifyJWT }