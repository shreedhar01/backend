import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
// import dotenv from "dotenv"

// dotenv.config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) return null;

        // console.log("uploading to cloudinary:", localFilePath);
        // console.log(`cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        // console.log(`api_key: ${process.env.CLOUDINARY_API_KEY}`);
        // console.log(`api_secret: ${process.env.CLOUDINARY_CLOUD_NAME}`);
        

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //console.log(`Response after file upload in cloudinary ${response.url}`)
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return response
    } catch (error) {
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        console.error("cloudinary error:", error);
        return null
    }
}

export { uploadOnCloudinary }