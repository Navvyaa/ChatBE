import request from "supertest"
import { io as Client } from "socket.io-client";
import app from "../src/app";
import { startTestServer } from "./helpers/socketServer";

describe("smoke", () => {
    it("serves the swagger docs", async () => {
        const res = await request(app).get("/api-docs/");
        expect(res.status).toBe(200);
    });

    it("rejects a socket connection without a tooken", async () => {
        const t=await startTestServer();
        const socket = Client (t.url , {reconnection:false});

        const err = await new Promise <Error> ((resolve)=>
            socket.on("connect_error",resolve)
        );
        expect(err).toBeDefined();
        socket.close();
        await t.close();
    })
})