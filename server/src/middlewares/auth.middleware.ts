import { Request, Response, NextFunction } from "express";
import { IncomingHttpHeaders } from "http";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { JwtPayload, verify } from "jsonwebtoken";
import { User } from "../models/user.model";
import { IUser } from "../models/user.model";

interface RequestWithHeaders extends Request {
    headers: IncomingHttpHeaders & { authorization?: string };
    user?: IUser;
}

export const verifyJWT = asyncHandler(async (req: RequestWithHeaders, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;

        const user = await User.findById(decodedToken._id).select("-password -refreshTokens")

        if (!user) {
            // 
            throw new ApiError(404, "Invalid user access token");
        }

        req.user = user;
        next();
    } catch (error: any) {
        throw new ApiError(401, error?.message || "Invalid user access token");
    }
});