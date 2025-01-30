const asyncHandler = (requestHandel) => {
    return (req, res, next) =>{
        Promise.resolve(requestHandel(req, res, next)).catch((err) => next(err))
    }
}

export {asyncHandler}