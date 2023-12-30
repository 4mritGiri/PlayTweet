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

userRouter.get("/get-current-user", getCurrentUser);

userRouter.put('/update-user-details', verifyJWT, updateAccountDetails);

userRouter.put('/update-user-avatar', verifyJWT, updateUserAvatar);

userRouter.put('/update-user-cover-image', verifyJWT, updateUserCoverImage);

// fetch using /username
userRouter.get("/:username", getUserChannelProfile);


 

export { userRouter };
