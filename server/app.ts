require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
import { ErrorMiddleware } from "./src/middlewares/error";
import cookieParser from "cookie-parser";
import cors from "cors";
import { userRouter } from "./src/routes/user.route";

export const app = express();

// Body parser
app.use(express.json({ limit: "50kb" }));

// url encoded
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// static files
app.use(express.static("public"));

// cookie parser
app.use(cookieParser());

// corse => Cross Origin Resource Sharing
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// routes
app.use(`${process.env.ROUTE}`, userRouter);

// testing api
app.get("/ping", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: `Server is up and running on port ${process.env.PORT}`,
  });
});

// Unknown route handler
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(ErrorMiddleware);
