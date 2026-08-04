import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log('MongoDB URI not provided. Running in memory / file storage mode.');
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`MongoDB Connection Notice: ${error.message}. Running fallback mode.`);
  }
};

export default connectDB;
