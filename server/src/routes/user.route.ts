import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  userRegister,
} from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";
import { verifyJWT } from "../middlewares/auth.middleware";

const userRouter = Router();

userRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  userRegister
);

userRouter.post("/login", loginUser);

// secure route
userRouter.post("/logout", verifyJWT, logoutUser);
userRouter.post("/refresh-token", refreshAccessToken);

userRouter.post("/change-password", verifyJWT, changeCurrentPassword);

userRouter.get("/current-user", verifyJWT, getCurrentUser);

userRouter.patch("/update-account", verifyJWT, updateAccountDetails);

userRouter.patch(
  "/update-user-avatar",
  verifyJWT,
  upload.single("avatar"),
  updateUserAvatar
);

userRouter.patch(
  "/update-user-cover-image",
  verifyJWT,
  upload.single("coverImage"),
  updateUserCoverImage
);

// fetch using /username
userRouter.get("/c/:username", verifyJWT, getUserChannelProfile);

// watch history
userRouter.get("/watch-history", verifyJWT, getUserChannelProfile);

export { userRouter };
