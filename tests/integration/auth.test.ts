import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app";
import { User } from "../../src/models/User";
import { connect ,clear,disconnect} from "../helpers/db";
import {validUser,registerAndLogin} from "../helpers/auth"

beforeAll(connect);
afterEach(clear);
afterAll(disconnect);

const register=(body:object)=>request(app).post("/api/auth/register").send(body);
const login=(body:object)=>request(app).post("/api/auth/login").send(body);
const refresh=(body:object)=>request(app).post("/api/auth/refresh").send(body);


describe("POST /api/auth/register", () => {
  it("creates a user and never returns the password", async () => {
    const res = await register(validUser());
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Registration Successful");
    expect(res.body.user).toMatchObject({ email: "alice@example.com", username: "alice" });
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("stores a bcrypt hash, not the plain password", async () => {
    await register(validUser());
    const user = await User.findOne({ email: "alice@example.com" }).select("+password");
    expect(user!.password).not.toBe("Pass@1234");
    expect(user!.password).toMatch(/^\$2[aby]\$/);
  });

  it.each(["username", "email", "password"])("rejects a missing %s", async (field) => {
    const body: any = validUser();
    delete body[field];
    expect((await register(body)).status).toBe(400);
  });

  it("rejects an invalid email", async () => {
    const res = await register(validUser({ email: "not-an-email" }));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Enter a valid email");
  });

  it.each(["Sh0rt!", "alllowercase1!", "ALLUPPERCASE1!", "NoDigits!!", "NoSpecial123"])(
    "rejects the weak password %p",
    async (password) => {
      expect((await register(validUser({ password }))).status).toBe(400);
    }
  );

  it("rejects a duplicate email", async () => {
    await register(validUser());
    const res = await register(validUser({ username: "other" }));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already Exists");
  });

   it("rejects non-string input (NoSQL injection attempt)", async () => {
    const res = await register({ username: "x", email: { $ne: null }, password: "Pass@1234" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    await register(validUser());
  });

  it("returns the user and valid tokens", async () => {
    const res = await login({ email: "alice@example.com", password: "Pass@1234" });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ username: "alice", email: "alice@example.com" });

    const access = jwt.verify(res.body.accessToken, process.env.JWT_SECRET!) as jwt.JwtPayload;
    expect(access.id).toBe(res.body.user.id);
    const refreshPayload = jwt.verify(
      res.body.refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as jwt.JwtPayload;
    expect(refreshPayload.id).toBe(res.body.user.id);
  });

  it("rejects a wrong password", async () => {
    const res = await login({ email: "alice@example.com", password: "Wrong@1234" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid Credentials");
  });

  it("rejects an unknown email", async () => {
    const res = await login({ email: "nobody@example.com", password: "Pass@1234" });
    expect(res.status).toBe(400);
  });

  it("rejects malformed credentials", async () => {
    const res = await login({ email: "alice@example.com", password: "weak" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid Email or Password");
  });

  it("requires both fields", async () => {
    expect((await login({ email: "alice@example.com" })).status).toBe(400);
    expect((await login({ password: "Pass@1234" })).status).toBe(400);
  });
});

describe("POST /api/auth/refresh", () => {
  it("issues a new access token for a valid refresh token", async () => {
    const { refreshToken, id } = await registerAndLogin();
    const res = await refresh({ refreshToken });
    expect(res.status).toBe(200);
    const payload = jwt.verify(res.body.accessToken, process.env.JWT_SECRET!) as jwt.JwtPayload;
    expect(payload.id).toBe(id);
  });

  it("requires a refresh token", async () => {
    expect((await refresh({})).status).toBe(400);
  });

  it("rejects a garbage token", async () => {
    expect((await refresh({ refreshToken: "garbage" })).status).toBe(401);
  });

  it("rejects an access token used as a refresh token", async () => {
    const { accessToken } = await registerAndLogin();
    expect((await refresh({ refreshToken: accessToken })).status).toBe(401);
  });

  it("rejects a refresh token for a deleted user", async () => {
    const { refreshToken } = await registerAndLogin();
    await User.deleteMany({});
    expect((await refresh({ refreshToken })).status).toBe(401);
  });

  it("reports an expiresIn that matches the access token's real lifetime", async () => {
    const { refreshToken } = await registerAndLogin();
    const res = await refresh({ refreshToken });
    const payload = jwt.decode(res.body.accessToken) as jwt.JwtPayload;
    expect(res.body.expiresIn).toBe(payload.exp! - payload.iat!);
  });
});