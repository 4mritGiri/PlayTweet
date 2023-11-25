import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (folder: string, localFilePath: string) => {
  try {
    // if (!localFilePath) return null;
    if (!localFilePath) throw new ApiError(400, "No file provided for upload");
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: `PlayTweet/${folder}`,
      resource_type: "auto",
    });
    // file has been uploaded on cloudinary

    // remove file from local storage
    if (localFilePath === "public\\Images\\default_cover_image_url.png") {
      // do nothing
    } else {
      fs.unlinkSync(localFilePath);
    }
    return response;
  } catch (error: any) {
    // remove file from local storage if it fails to upload on cloudinary
    fs.unlinkSync(localFilePath); 
    return new ApiError(500, "CLOUDINARY ERROR:: ", error.message, error.stack);
  }
};

export { uploadOnCloudinary };
