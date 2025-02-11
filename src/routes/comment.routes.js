import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middlewares.js"

const router = Router()

router.use(verifyJWT)

export default router