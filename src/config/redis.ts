import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

export const attachRedisAdapter = async (io: Server, url: string) => {
  const pubClient = createClient({ url });
  const subClient = pubClient.duplicate();
  pubClient.on("error", (e) => console.error("Redis pub error", e));
  subClient.on("error", (e) => console.error("Redis sub error", e));

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  // returned so tests can shut the connections down cleanly
  return async () => {
    await Promise.all([pubClient.quit(), subClient.quit()]);
  };
};