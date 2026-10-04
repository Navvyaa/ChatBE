import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { connect, disconnect, clear } from "../helpers/db"
import app from "../../src/app";
import { User } from "../../src/models/User";
import { registerAndLogin } from "../helpers/auth";


beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const hit = (authorization?: string) => {
    const req = request(app).get("/api/conversations");
    return authorization ? req.set("Authorization", authorization) : req;
};

describe("protect middleware", () => {
    it("rejects a request with no Authorization header", async () => {
        const res = await hit();
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("No token provided.");
    });

    it("rejects a non-Bearer scheme", async () => {
        expect((await hit("Basic abc123")).status).toBe(400);
    });

    it("rejects a malformed token", async () => {
        expect((await hit("Bearer garbage")).status).toBe(401);
    });

    it("rejects a token signed with the wrong secret", async () => {
        const id = new mongoose.Types.ObjectId().toString();
        const token = jwt.sign({ id }, "some-other-secret");
        expect((await hit(`Bearer ${token}`)).status).toBe(401);
    });
    it("rejects an expired token", async () => {
        const { id } = await registerAndLogin();
        const token = jwt.sign(
            { id, exp: Math.floor(Date.now() / 1000) - 10 },
            process.env.JWT_SECRET!
        );
        expect((await hit(`Bearer ${token}`)).status).toBe(401);
    });

    it("rejects a refresh token used as an access token", async () => {
        const { refreshToken } = await registerAndLogin();
        expect((await hit(`Bearer ${refreshToken}`)).status).toBe(401);
    });

    it("rejects a valid token whose user no longer exists", async () => {
        const { accessToken } = await registerAndLogin();
        await User.deleteMany({});
        const res = await hit(`Bearer ${accessToken}`);
        expect(res.status).toBe(401);
        expect(res.body.message).toBe("User not found");
    });

    it("accepts a valid token", async () => {
        const { accessToken } = await registerAndLogin();
        expect((await hit(`Bearer ${accessToken}`)).status).toBe(200);
    });
})