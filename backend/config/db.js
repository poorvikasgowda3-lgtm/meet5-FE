import mongoose from 'mongoose';

// Disable buffering so Mongoose calls immediately fail or fallback instead of hanging queries
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log('[BACKEND-DB] MONGO_URI not provided. Using persistent file-database engine.');
      return;
    }
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 1000 });
    console.log(`[BACKEND-DB] Database connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[BACKEND-DB] Database notice (${error.message}). Active mode: persistent file-database engine.`);
  }
};

export default connectDB;
