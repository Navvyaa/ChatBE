const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  if (process.env.TEST_MONGO_URI) return; // an external DB was provided (Docker/CI)
  const mongo = await MongoMemoryServer.create();
  process.env.TEST_MONGO_URI = mongo.getUri();
  globalThis.__MONGO__ = mongo;
};