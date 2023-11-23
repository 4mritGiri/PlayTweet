import { Router } from "express";
import { userRegister } from "../controllers/user.controller";
import { upload } from "../middlewares/multer.middleware";

const userRouter = Router();

userRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImg", maxCount: 1 },
  ]),
  userRegister
);

export { userRouter };
