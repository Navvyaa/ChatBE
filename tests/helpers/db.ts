import mongoose from "mongoose";

export const connect = async () => {
  await mongoose.connect(process.env.TEST_MONGO_URI!, {
    dbName: `chatTest_${process.env.JEST_WORKER_ID ?? "0"}`,
  });
};

export const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
};

export const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};