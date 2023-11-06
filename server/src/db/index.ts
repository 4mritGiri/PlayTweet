import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectToDB = async () => {
   console.log("MongoDB Connecting ⏳⏳...  ")
  try {
    const connection = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `MongoDb Connected Successfully🚀✅! \nFollow the following link for Testing:  http://${connection.connection.host}:${process.env.PORT}/ping`
    );
  } catch (err: any) {
    console.log("MONGODB connection FAILED❌ ", err.message);
    setTimeout(connectToDB, 5000);
    process.exit(1);
  }
};

export default connectToDB;
