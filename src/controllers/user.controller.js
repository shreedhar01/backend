import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (validUserId) => {
    try {
        const validUser = await User.findById(validUserId)
        const accessToken = validUser.generateAccessToken()
        const refreshToken = validUser.generateRefreshToken()


        validUser.refreshToken = refreshToken
        await validUser.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        console.log("Error :: err while generating access and refresh token: ", error);
        throw new ApiError(500, "Something went wrong while generating access and refresh token")
    }
}

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
    // console.log("Request body:", req.body);
    // console.log("Request files:", req.files);

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

    // console.log(req.body);

    const { userName, email, password } = req.body
    // console.log("userName: ", userName);

    if (!(userName || email)) {
        throw new ApiError(400, "Need userName or Email requires")
    }

    const validUser = await User.findOne({
        $or: [{ userName }, { email }]
    })
    if (!validUser) {
        throw new ApiError(400, "Enter a valid username or email")
    }
    const validUserPassword = await validUser.isPasswordCorrect(password)
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
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
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

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    const userFromDb = await User.findById(req.user?._id)
    if (!userFromDb) {
        throw new ApiError(500, "Error while getting user from Db")
    }

    const validPassword = await userFromDb.isPasswordCorrect(oldPassword)
    if (!validPassword) {
        throw new ApiError(400, "Not a Valid Password")
    }

    userFromDb.password = newPassword
    await userFromDb.save({ validateBeforeSave: false })

    return res.status(200)
        .json(
            new ApiResponse(200, {}, "password updated successful")
        )
})

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res.status(200).json(
        new ApiResponse(200, req.user, "user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req, res, next) => {
    const { fullName, email } = req.body

    if (!(fullName || email)) {
        throw new ApiError(400, "To change AccoutnDetails you must provide any one field")
    }

    const validUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password -refreshToken")
    if (!validUser) {
        throw new ApiError(400, "Not a valid user")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                validUser,
                "Detail update successfully"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res, next) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "There is not a avatarLocalPath")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Error while uploading to cloudinary")
    }
    const validUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                validUser,
                "Avatar image update successfully"
            )
        )
})

const updateUserCoverImage = asyncHandler(async (req, res, next) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "There is not a avatarLocalPath")
    }

    const avatar = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar) {
        throw new ApiError(400, "Error while uploading to cloudinary")
    }
    const validUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                validUser,
                "cover image update successfully"
            )
        )
})

const getUserChannelProfile = asyncHandler(async (req, res, next) => {
    const { userName } = req.params
    if (!userName) {
        throw new ApiError(400, "user not found")
    }

    const channel = await User.aggregate([
        {
            $match: { userName: userName?.trim() }
        },
        {
            $lookup: {
                from: "subscriptions",
                as: "follower",
                localField: "_id",
                foreignField: "subscriber"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                as: "followed",
                localField: "_id",
                foreignField: "channel",
            }
        },
        {
            $addFields: {
                countFollowers: {
                    $size: "$follower"
                },
                countFollowed: {
                    $size: "$followed"
                },
                isFollowed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$follower.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                countFollowed: 1,
                countFollowers: 1,
                isFollowed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    if (!channel.length) {
        throw new ApiError(400, "Error while getting channel")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, channel[0], "user data fetch successfully")
        )
})

const getWatchHistory = asyncHandler(async (req, res, next) => {
    const history = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                as: "history",
                localField: "watchHistory",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            as: "getusers",
                            localField: "owner",
                            foreignField: "_id",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        avatar: 1,
                                        userName: 1,
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$getusers"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, history[0].watchHistory, "watch history is fetch successfully")
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}