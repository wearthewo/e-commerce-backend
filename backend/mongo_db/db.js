import mongoose from "mongoose";
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO);
    // console.log(`MONGO HOST ${conn.connection.host}`);
  } catch (error) {
    console.log("Error connected to Mongo:", error.message);
    process.exit(1);
  }
};
