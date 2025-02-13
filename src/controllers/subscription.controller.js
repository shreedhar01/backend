import { asyncHandler } from "../utils/asyncHandeler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from "../models/subscription.model.js";
import mongoose from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req?.params
    const userId = req.user?._id
    const { message } = req.body

    if (!['subscribe', 'unsubscribe'].includes(message?.trim().toLowerCase())) {
        throw new ApiError(400, "give valid request")
    }


    let subscribeStatus;

    if (message === "subscribe") {
        const isSubscribed = await Subscription.findOne({
            subscriber: userId,
            channel: channelId
        })
        if (isSubscribed) {
            throw new ApiError(400, "Already Subscribe")
        }
        subscribeStatus = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
    } else {
        subscribeStatus = await Subscription.findOneAndDelete({
            subscriber: userId,
            channel: channelId
        })
    }

    if (!subscribeStatus) {
        throw new ApiError(400, "subscription status not change")
    }

    return res.status(200).json(
        new ApiResponse(200, subscribeStatus, "subscriptin status change")
    )
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { page = 1, limit = 10 } = req.query

    const option = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
    }

    const aggregateQuery = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                as: "subscriberDetail",
                localField: "subscriber",
                foreignField: "_id",
            }
        },
        {
            $addFields: {
                subscriberInfo: { $first: "$subscriberDetail" } 
            }
        },
        {
            $project: {
                _id: 1,
                createdAt: 1,
                subscriberInfo: {
                    _id: 1,
                    userName: 1,
                    avatar: 1,
                    email: 1
                }
            }
        }
    ])

    const result = await Subscription.aggregatePaginate(aggregateQuery, option)

    if (!result) {
        throw new ApiError(400, "channel subscriber not get")
    }

    return res.status(200).json(
        new ApiResponse(200, {
            subscribers: result.docs,
            pagination: {
                currentPage: result.page,
                totalPages: result.totalPages,
                totalSubscribers: result.totalDocs,
                hasNextPage: result.hasNextPage,
                hasPrePage: result.hasPrevPage
            }
        }, "user channel subscribers fetch successfully")
    )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    const { page = 1, limit = 10 } = req.query
    const option = {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { createdAt: -1 }
    }

    const aggregateQuery = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                as: "channelDetail",
                localField: "channel",
                foreignField: "_id",
            }
        },
        {
            $addFields: {
                channelInfo: { $first: "$channelDetail" } 
            }
        },
        {
            $project: {
                subscriber: 1,
                createdAt: 1,
                channelInfo: {
                    userName: 1,
                    avatar: 1,
                }
            }
        }
    ])

    const result = await Subscription.aggregatePaginate(aggregateQuery, option)
    if(!result){
        throw new ApiError(400, "Subscriber not found")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                channels: result.docs,
                pagination: {
                    currentPage: result.page,
                    totalPages: result.totalPages,
                    totalSubscribeChannel: result.totalDocs,
                    hasNextPage: result.hasNextPage,
                    hasPrevPage: result.hasPrevPage
                }
            }
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}