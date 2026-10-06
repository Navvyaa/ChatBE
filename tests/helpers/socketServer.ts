import { AddressInfo } from "net";
import { createServer } from "../../src/config/createServer"
import { attachRedisAdapter } from "../../src/config/redis";

export const startTestServer = async (redisUrl?: string) => {
  const { server, io } = createServer();
  const detachRedis = redisUrl ? await attachRedisAdapter(io, redisUrl) : undefined;
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://localhost:${port}`,
    close: async () => {
      await new Promise<void>((resolve) => io.close(() => resolve()));
      await detachRedis?.();
    },
  };
};