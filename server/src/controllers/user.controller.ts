import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import {
  isValidEmail,
  isValidFullName,
  isValidPassword,
  isValidUsername,
} from "../utils/validationCheck";
import { IUser, User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";
import * as fs from "fs";
import { JwtPayload, verify } from "jsonwebtoken";
import { IncomingHttpHeaders } from "http";

interface Files {
  [fieldname: string]: Express.Multer.File[];
}

interface RequestWithUser extends Request {
  user?: {
    _id: string;
  };
}

// Generate access and refresh tokens
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

// Register user

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

// Login user

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

// Logout user

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

//  Refresh access token

const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = verify(
      incomingRefreshToken,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as JwtPayload;

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "User not found while refreshing access token");
    }

    const isRefreshTokenValid =
      user.refreshTokens.includes(incomingRefreshToken);
    if (!isRefreshTokenValid) {
      throw new ApiError(401, "Invalid refresh token provided");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshTokens } = await generateAccessAndRefreshTokens(
      user?._id
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

// Change current user password

interface RequestWithHeaders extends Request {
  headers: IncomingHttpHeaders & { authorization?: string };
  user?: IUser;
}

// Change current user password
const changeCurrentPassword = asyncHandler(
  async (req: RequestWithHeaders, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body; // currentPassword is the old password

    if (
      [currentPassword, newPassword, confirmPassword].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    } else if (!isValidPassword(newPassword)) {
      throw new ApiError(
        400,
        "Password must be at least 8 characters, contain one lowercase letter, one uppercase letter, one number, and one special character. No spaces allowed"
      );
    } else if (newPassword !== confirmPassword) {
      throw new ApiError(400, "Passwords do not match");
    } else if (currentPassword === newPassword) {
      throw new ApiError(
        400,
        "New password must be different from old password"
      );
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found while changing password");
    }
    const isPasswordCorrect = await user.isPasswordMatch(currentPassword);
    if (!isPasswordCorrect) {
      throw new ApiError(401, "Invalid current password"); // 401: Unauthorized
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed successfully!"));
  }
);

// Get current user
const getCurrentUser = asyncHandler(
  async (req: RequestWithHeaders, res: Response) => {
    const user = await User.findById(req.user?._id).select(
      "-password -refreshTokens"
    );
    if (!user) {
      throw new ApiError(404, "User not found while fetching current user");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "Current user fetched successfully!"));
  }
);

// Update account details
const updateAccountDetails = asyncHandler(
  async (req: RequestWithHeaders, res: Response) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
      throw new ApiError(400, "All fields are required to update account");
    }

    const user = await User.findById(
      req.user?._id,
      {
        $set: { fullName, email },
      },
      { new: true }
    ).select("-password");
    if (!user) {
      throw new ApiError(404, "User not found while updating account details");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Account details updated successfully!")
      );
  }
);

// Update profile picture
const updateUserAvatar = asyncHandler(
  async (req: RequestWithHeaders, res: Response) => {
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is messing while updating!");
    }
    const avatar = await uploadOnCloudinary("avatar", avatarLocalPath);
    if (avatar instanceof ApiError || !avatar.url) {
      throw new ApiError(
        500,
        "Error while uploading avatar file on cloudinary!"
      );
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { avatar: { url: avatar.url } },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar image updated successfully!"));
  }
);

// Update user cover image
const updateUserCoverImage = asyncHandler(
  async (req: RequestWithHeaders, res: Response) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing while updating!");
    }
    const coverImage = await uploadOnCloudinary(
      "coverImage",
      coverImageLocalPath
    );
    if (coverImage instanceof ApiError || !coverImage.url) {
      throw new ApiError(
        500,
        "Error while uploading cover image file on cloudinary!"
      );
    }
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { coverImage: { url: coverImage.url } },
      },
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Cover image updated successfully!"));
  }
);

export {
  userRegister,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
