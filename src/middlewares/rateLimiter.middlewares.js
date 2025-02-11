import {rateLimit} from "express-rate-limit";

export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, //How long to remember requests for, in milliseconds.
    max: 5,
    message: {
        status: 429,
        message:"Too many request. Please ! hold"
    },
    standardHeaders: true,
    legacyHeaders: false
})