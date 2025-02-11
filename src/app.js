import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//import routes
import userRoutes from "./routes/user.routes.js"
import commentRouter from "./routes/comment.routes.js"

//routes decleration
app.use("/api/v1/user",userRoutes)
app.use("/api/v1/comment",commentRouter)


export {app}