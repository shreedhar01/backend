import { Router } from "express";
import {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.use(verifyJWT)

router.post("/", createPlaylist);
router.get("/user", getUserPlaylists);
router.route("/:playlistId")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);
router.patch("/add/:playlistId", addVideoToPlaylist);
router.patch("/remove/:playlistId", removeVideoFromPlaylist);

export default router;