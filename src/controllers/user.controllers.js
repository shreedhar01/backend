import { asyncHandler } from "../utils/asyncHandeler.js";

const registerUser = asyncHandler( async function(req, res, next){
    res.status(200).json({
        message: "Hello world"
    })
})

export {
    registerUser
}