import { NextFunction, Request, Response } from "express";

// 1. Using Promise

export const asyncHandler =
  (theFunc: any) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(theFunc(req, res, next)).catch((error: any) =>
      next(error)
    );
  };

// 2. Using TryCatch

// export const asyncHandler =
//   (fn: any) => async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await fn(req, res, next);
//     } catch (error: any) {
//       res.status(error.status || 500).json({
//         success: false,
//         message: error.message || "Internal Server Error",
//       });
//     }
//   };
