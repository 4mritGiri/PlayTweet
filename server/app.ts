require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
import { ErrorMiddleware } from "./src/middlewares/error";
import cookieParser from "cookie-parser";
import cors from "cors";

export const app = express();

// Body parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// corse => Cross Origin Resource Sharing
app.use(
  cors({
    origin: process.env.ORIGIN,
    // credentials: true,
  })
);

// routes
// app.use("/api/v1");

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
