import {  Router } from "express";
import { userRegister } from "../controllers/user.controllers";

const userRouter = Router();

userRouter.post("/register", userRegister);

export { userRouter };