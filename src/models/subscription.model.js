import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //where subscriber is subscribing
        ref: "User"
    }
}, { timestamps: true })

subscriptionSchema.plugin(mongooseAggregatePaginate)

export const Subscription = mongoose.model("Subscription", subscriptionSchema)