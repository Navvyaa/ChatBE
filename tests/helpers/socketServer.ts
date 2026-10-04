import { AddressInfo } from "net";
import { createServer } from "../../src/config/createServer"

export const startTestServer = async () => {
    const { io, server } = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const { port } = server.address() as AddressInfo;
    return {
        url: `http://localhost:${port}`,
        close: () => new Promise<void>((resolve) => io.close(() => resolve()))
    }
}