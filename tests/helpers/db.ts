import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongo:MongoMemoryServer;

export const connect= async ()=>{
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
};

export const clear = async () =>{
    const collections=mongoose.connection.collections;
    for (const key in collections)  await collections[key].deleteMany({});
};

export const disconnect = async () => {
    await mongoose.disconnect();
    await mongo.stop();
}
