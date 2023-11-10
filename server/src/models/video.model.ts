import mongoose, { Schema, Document } from "mongoose";
import  mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


export interface IOwner {
  _id: string;
  username: string;
  avatar: string;
}

export interface IVideo extends Document {
  title: string;
  description: string;
  owner: IOwner;
  thumbnail: string;
  videoFile: string;
  duration: number;
  views: number;
  isPublished: boolean;
}

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: [true, "Title is required!"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required!"],
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnail: {
      type: String,
      required: [true, "Thumbnail is required!"],
    },
    videoFile: {
      type: String, // Cloudinary URL for the video
      required: [true, "Video file is required!"],
    },
    duration: {
      type: Number, //
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model<IVideo>("Video", videoSchema);
