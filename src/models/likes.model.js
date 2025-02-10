import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "comment"
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "video"
    },
    likedby: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "tweet"
    },
}, { timestamps: true })

export const Like = mongoose.model("Like", likeSchema)