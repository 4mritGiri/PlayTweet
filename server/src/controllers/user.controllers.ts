import { Request, Response, NextFunction } from "express";

const userRegister = (req: Request, res: Response, next: NextFunction) => {
   res.json({
      success: true,
      message: "User Register Controllers! ",
   });
}

export { userRegister };