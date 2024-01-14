import mongoose from "mongoose";
import User from "@/models/User";

const connectMongo = async () => {
  // if (!process.env.MONGODB_URI) {
  //   throw new Error(
  //     "Add the MONGODB_URI environment variable inside .env.local to use mongoose"
  //   );
  // }
  console.log("Mongo")
  return mongoose
    .connect("mongodb+srv://krishuser_07:uOtys4QRRdYGNTED@cluster0.les6bxu.mongodb.net/?retryWrites=true&w=majority")
    .catch((e) => console.error("Mongoose Client Error: " + e.message));
};

export default connectMongo;
