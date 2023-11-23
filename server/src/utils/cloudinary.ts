import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError, ErrorHandler } from "./ApiError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: "PlayTweet",
      resource_type: "auto",
    });
    // file has been uploaded on cloudinary

    return response;
  } catch (error: any) {
    fs.unlinkSync(localFilePath); // remove file from local storage if it fails to upload on cloudinary

    return new ApiError( 500, "CLOUDINARY ERROR:: ", error.message, error.stack);
  }
};

export { uploadOnCloudinary };
