import { isValidEmail, isStrongPassword } from "../../src/utils/validate";

describe("isValidEmail", () => {
    it.each(["a@b.com", "first.last+tag@sub.domain.org", " padded@x.io "])(
        "accepts %p",
        (email) => expect(isValidEmail(email)).toBe(true)
    );

    it.each(["", "plain", "a@b", "a@.com", "@b.com", "a b@c.com"])(
        "rejects %p",
        (email) => expect(isValidEmail(email)).toBe(false)
    );

    it("rejects non-strings", () => {
        expect(isValidEmail(null as any)).toBe(false);
        expect(isValidEmail({ $ne: null } as any)).toBe(false);
    });
})


describe("isStrongPassword", () => {
  it("accepts a password meeting every rule", () => {
    expect(isStrongPassword("Pass@123")).toBe(true);
  });

  it.each([
    ["too short", "Sh0rt!"],
    ["no uppercase", "alllowercase1!"],
    ["no lowercase", "ALLUPPERCASE1!"],
    ["no digit", "NoDigits!!"],
    ["no special character", "NoSpecial123"],
  ])("rejects: %s", (_label, pw) => {
    expect(isStrongPassword(pw)).toBe(false);
  });

  it("supports a custom minimum length", () => {
    expect(isStrongPassword("Pass@123", { minLength: 12 })).toBe(false);
    expect(isStrongPassword("Pass@123456789", { minLength: 12 })).toBe(true);
  });

  it("supports a custom regex", () => {
    expect(isStrongPassword("abc", { regex: /^abc$/ })).toBe(true);
  });
});