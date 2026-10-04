import jwt from "jsonwebtoken";
import { generateToken, generateRefreshToken } from "../../src/utils/generateToken";

const DAY = 24 * 60 * 60;

describe("generateToken", () => {
  it("contains id and email and verifies with JWT_SECRET", async () => {
    const token = await generateToken("a@a.com", "123");
    const p = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
    expect(p.id).toBe("123");
    expect(p.email).toBe("a@a.com");
  });

  it("expires in 5 days", async () => {
    const p = jwt.decode(await generateToken("a@a.com", "123")) as jwt.JwtPayload;
    expect(p.exp! - p.iat!).toBe(5 * DAY);
  });
});

describe("generateRefreshToken", () => {
  it("verifies with the refresh secret only", async () => {
    const token = await generateRefreshToken("123");
    const p = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as jwt.JwtPayload;
    expect(p.id).toBe("123");
    expect(() => jwt.verify(token, process.env.JWT_SECRET as string)).toThrow();
  });

  it("expires in 30 days", async () => {
    const p = jwt.decode(await generateRefreshToken("123")) as jwt.JwtPayload;
    expect(p.exp! - p.iat!).toBe(30 * DAY);
  });
});