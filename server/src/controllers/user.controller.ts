import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { isValidEmail, isValidPassword } from "../utils/validationCheck";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

interface Files {
  [fieldname: string]: Express.Multer.File[];
}
const userRegister = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    // 1. Get user details from fronted ✅
    const { fullName, username, email, password } = req.body;

    // 2. validation - not empty ✅
    if (
      [fullName, username, email, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required❌");
    }
    // 3. validation - email format ✅
    else if (!isValidEmail(email)) {
      throw new ApiError(400, "Invalid email format❌");
    }
    // 4. validation - password length ✅
    else if (!isValidPassword(password)) {
      throw new ApiError(
        400,
        "Password must be at least 8 characters, At least one lowercase letter, one uppercase letter, one number, and one special character, No spaces allowed❌"
      );
    }

    // 5. validation - password match

    // 6. check if user already exists: username, email
    const isUserExisted = User.findOne({
      $or: [{ username }, { email }],
    });
    if (await isUserExisted) {
      throw new ApiError(409, "User with email already exists!❌");
    }

    // 7. check for images, check for avatar
    const files = req.files as Files;
    const avatarLocalPath = files?.avatar?.[0]?.path;
    const coverImgLocalPath = files?.coverImg?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required!❌");
    }
    // 8. upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImgLocalPath);

    if (!avatar) {
      throw new ApiError(500, "Avatar file is required!❌");
    }

    // 9. create user object - create entry in db
    let coverImgUrl = "";
    let avatarImg = "";
    if ("url" in coverImage!) {
      coverImgUrl = coverImage.url;
    } else if ("url" in avatar) {
      avatarImg = avatar.url;
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: avatarImg,
      coverImg: coverImgUrl || "",
    });

    // 10. remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
      "-password -refreshTokens"
    );
    // 11. check for user creation
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while register user!❌");
    }

    // 12. return response
    return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered Successfully!✅")
    );
  }
);
export { userRegister };
