import mongoose, { Document, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export interface IUser extends Document {
  username: string;
  email: string;
  fullName: string;
  avatar: {
    public_id: string;
    url: string; // Cloudinary URL for the image
  };
  coverImage: {
    public_id: string;
    url: string; // Cloudinary URL for the image
  };
  password: string;
  refreshTokens: string;
  watchHistory: string[];
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username is required!"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Fullname is required!"],
      trim: true,
      index: true,
    },
    avatar: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
        required: true,
      },
    },
    coverImage: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshTokens: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.isPasswordMatch = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  const accessSecret = process.env.ACCESS_TOKEN_SECRET as string;
  if (!accessSecret) {
    throw new Error("ACCESS_TOKEN_SECRET is not defined");
  }

  const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRY as string;
  if (!accessExpiresIn) {
    throw new Error("ACCESS_TOKEN_EXPIRY is not defined");
  }

  const accessToken = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    accessSecret,
    {
      expiresIn: accessExpiresIn,
    }
  );
  return accessToken;
};

userSchema.methods.generateRefreshToken = function () {
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET as string;
  if (!refreshSecret) {
    throw new Error("REFRESH_TOKEN_SECRET is not defined");
  }

  const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRY as string;
  if (!refreshExpiresIn) {
    throw new Error("REFRESH_TOKEN_EXPIRY is not defined");
  }

  const refreshToken = jwt.sign({ _id: this._id }, refreshSecret, {
    expiresIn: refreshExpiresIn,
  });
  return refreshToken;
};

export const User = mongoose.model<IUser>("User", userSchema);
