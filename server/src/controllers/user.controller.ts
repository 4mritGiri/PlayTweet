import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import {
  isValidEmail,
  isValidFullName,
  isValidPassword,
  isValidUsername,
} from "../utils/validationCheck";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as fs from "fs";
import { JwtPayload, verify } from "jsonwebtoken";

interface Files {
  [fieldname: string]: Express.Multer.File[];
}

interface RequestWithUser extends Request {
  user?: {
    _id: string;
  };
}

const generateAccessAndRefreshTokens = async (userId: any) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const accessToken = user.generateAccessToken();
    const refreshTokens = user.generateRefreshToken();

    user.refreshTokens = refreshTokens;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshTokens };
  } catch (error: any) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token."
    );
  }
};

const userRegister = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { fullName, username, email, password } = req.body;

    if (
      [fullName, username, email, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    } else if (!isValidFullName(fullName)) {
      throw new ApiError(
        400,
        "Full name can only contain alphabets and spaces"
      );
    } else if (!isValidUsername(username)) {
      throw new ApiError(
        400,
        "Username can only contain alphanumeric characters and underscores"
      );
    } else if (!isValidEmail(email)) {
      throw new ApiError(400, "Invalid email format");
    } else if (!isValidPassword(password)) {
      throw new ApiError(
        400,
        "Password must be at least 8 characters, contain one lowercase letter, one uppercase letter, one number, and one special character. No spaces allowed"
      );
    }

    const isUserExisted = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (isUserExisted) {
      throw new ApiError(
        409,
        `User with Email:${email} or Username:${username} already exists!`
      );
    }

    const files = req.files as Files;
    const avatarLocalPath = files?.avatar?.[0]?.path;
    const coverImgLocalPath = files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar is required!");
    }

    const avatar = await uploadOnCloudinary("avatar", avatarLocalPath);

    let coverImage;
    if (coverImgLocalPath) {
      if (!fs.existsSync(coverImgLocalPath)) {
        throw new ApiError(
          404,
          `Cover image file not found: ${coverImgLocalPath}`
        );
      }
      coverImage = await uploadOnCloudinary("coverImage", coverImgLocalPath);
    } else {
      const path = require("path");
      const defaultCoverImagePath = path.join(
        __dirname,
        "../../public/Images/default_cover_image_url.jpeg"
      );
      if (!fs.existsSync(defaultCoverImagePath)) {
        throw new ApiError(
          404,
          `Default cover image file not found: ${defaultCoverImagePath}`
        );
      }
      coverImage = await uploadOnCloudinary(
        "coverImage",
        defaultCoverImagePath
      );
    }

    if (!avatar) {
      throw new ApiError(500, "Avatar file is required!");
    }

    let coverImgUrl = "";
    let avatarImg = "";

    if (coverImage && "url" in coverImage) {
      coverImgUrl = coverImage.secure_url;
    }

    if (avatar && "url" in avatar) {
      avatarImg = avatar.secure_url;
    } else {
      throw new ApiError(400, "Avatar URL is required");
    }

    const user = await User.create({
      fullName,
      username: username.toLowerCase(),
      email,
      password,
      avatar: { url: avatarImg },
      coverImage: { url: coverImgUrl },
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshTokens"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering user!");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully!"));
  }
);

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;

  if (!(email || username)) {
    throw new ApiError(400, "Username or password is required!");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  const isPasswordValid = await user.isPasswordMatch(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials!");
  }

  const { accessToken, refreshTokens } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshTokens"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // Set cookies in the response
  res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshTokens", refreshTokens, options)
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshTokens },
        "User logged in successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req: RequestWithUser, res: Response) => {
  if (req.user) {
    await User.findByIdAndUpdate(
      req.user._id,
      { $set: { refreshToken: undefined } },
      { new: true }
    );
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshTokens", options)
    .json(new ApiResponse(200, {}, "User logged out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
  
    if (incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
  
    const decodedToken = verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;
  
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
  
    const isRefreshTokenValid = user.refreshTokens.includes(incomingRefreshToken);
    if (!isRefreshTokenValid) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    const { accessToken, refreshTokens } = await generateAccessAndRefreshTokens(
      user._id
    );
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshTokens", refreshTokens, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshTokens },
          "Access token refreshed successfully!"
        )
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token"); 
  }
});

export { userRegister, loginUser, logoutUser, refreshAccessToken };
