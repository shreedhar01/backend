import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async function (req, res, next) {
    //take data from frontend
    //check if data is valid 
    //upload image in cloudinary
    //upload everything in db
    //remove pass and refresh token 
    //return res

    const { userName, fullName, email, password } = req.body

    //checking if any field is empty
    if ([userName, fullName, email, password].some((item) => item?.trim() === "")) {
        throw new ApiError(400, "Some field is empty")
    }

    //3. check for user existance
    const userExist = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (userExist) {
        throw new ApiError(409, "user already exists")
    }

    // Add debug logging
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);

    // Fix file path check
    const avatarLocalPath = req.files?.avatar[0]?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const coverImageLocalPath = req?.files?.coverImage[0]?.path

    //upload on cloudinary
    const avatarCloudPath = await uploadOnCloudinary(avatarLocalPath)
    if (!avatarCloudPath) {
        throw new ApiError(500, "Avatar upload failed")
    }
    const coverImageCloudPath = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null

    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        password,
        avatar: avatarCloudPath.url,
        coverImage: coverImageCloudPath?.url || "",
        email
    })

    //removing sensitive data
    const createdUser = await User.findById(user?._id).select("-refreshToken -password")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    return res.status(200).json(
        new ApiResponse(200, createdUser, "user registeration successfull")
    )
})

export {
    registerUser
}