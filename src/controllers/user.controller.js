import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = asyncHandler(async (validUserId) => {
    try {
        const validUser = await User.findById(validUserId)
        const accessToken = await validUser.generateAccessToken()
        const refreshToken = await validUser.generateRefreshToken()

        validUser.refreshToken = refreshToken
        await validUser.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.log("Error :: err while generating access and refresh token: ", error);
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
})

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

const loginUser = asyncHandler(async (req, res, next) => {
    //get data from req
    //check for valid data
    //check if user exist
    //check if password is correct
    //attage access and refresh token to cookie
    //send cookie

    const { userName, email, password } = req.body
    if (!(userName || email)) {
        throw new ApiError(400, "Need userName or Email requires")
    }

    const validUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!validUser) {
        throw new ApiError(400, "Enter a valid username or email")
    }
    const validUserPassword = await User.isPasswordCorrect(password)
    if (!validUserPassword) {
        throw new ApiError(400, "Enter a correct password")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(validUser._id)

    const validUserAfterRefreshTokenAdded = await User.findById(validUser._id).select("-password -refreshToken")
    if (!validUserAfterRefreshTokenAdded) {
        throw new ApiError(400, "something went wrong while getting User After Refresh Token Added ")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: validUserAfterRefreshTokenAdded, refreshToken, accessToken
            }, "Loggin Success")
        )
})

const logoutUser = asyncHandler(async (req, res, next) => {
    //find the user
    //update refreshtoken field
    //retrun that in db
    //clear cookies in 
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true //return update value to db
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const refreshTokenFromCookie = req.cookies.refreshToken

    try {
        const decodedToken = jwt.verify(refreshTokenFromCookie, process.env.REFRESH_TOKEN_SECRET)
        if (!decodedToken) {
            throw new ApiError(400, "Unable to Decode token")
        }
        const userFromDb = await User.findById(decodedToken?._id)
        if (userFromDb.refreshToken !== decodedToken.refreshToken) {
            throw new ApiError(400, "You are not valid user")
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userFromDb._id)
        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "new accessToken is successfully generated"
                )
            )
    } catch (error) {

    }
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}