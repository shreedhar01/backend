const asyncHandler = (requestHandel) => {
    return async (req, res, next) =>{
        Promise.resolve(requestHandel(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler}