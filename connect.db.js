import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
const userName = process.env.db_USER_NAME;
const password = encodeURIComponent(process.env.db_PASSWORD);

const dbName = process.env.db_NAME;
const dbURL = `mongodb+srv://${userName}:${password}@cluster0.ke3mn7e.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=Cluster0`;
const connectDB = async () => {
  try {
    await mongoose.connect(dbURL);
    console.log(`Database connected successfully`);
  } catch (error) {
    console.log(error.message);
    console.log(`Database Connection error`);
  }
};

export default connectDB;
