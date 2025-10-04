import {
  describe,
  it,
  expect,
  beforeAll,
  vi,
  afterEach,
  beforeEach,
} from "vitest";
import {
  checkPasswordHash,
  hashPassword,
  makeJWT,
  validateJWT,
  getBearerToken,
  ReqLike,
} from "./auth.js";
import { UnauthorizedError } from "./api/errors.js";

describe("Auth", () => {
  const password1 = "correctPassword123!";
  const password2 = "anotherPassword456!";
  const userId = "9a50b12a-5734-46ea-82f3-65de8ef1cb85";
  const expiresIn1 = 3_600_000;
  const expiresIn2 = 100;
  const jwtSecret = "asdkgfh123";

  let hash1: string;
  let hash2: string;

  const FIXED_NOW_MS = 1_700_000_000_000;

  beforeAll(async () => {
    hash1 = await hashPassword(password1);
    hash2 = await hashPassword(password2);
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FIXED_NOW_MS));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Password Hashing", () => {
    it("returns true for correct passwords", async () => {
      await expect(checkPasswordHash(password1, hash1)).resolves.toBe(true);
      await expect(checkPasswordHash(password2, hash2)).resolves.toBe(true);
    });

    it("returns false for incorrect password", async () => {
      await expect(checkPasswordHash(password1, hash2)).resolves.toBe(false);
    });
  });

  describe("JWT", () => {
    it("creates and validates a non-expired JWT", async () => {
      const token = await makeJWT(userId, expiresIn1, jwtSecret);
      const result = await validateJWT(token, jwtSecret);

      expect(result).toMatchObject({ sub: userId });
    });

    it("rejects when token is expired", async () => {
      const token = await makeJWT(userId, expiresIn2, jwtSecret);

      vi.advanceTimersByTime((expiresIn2 + 1) * 1000);

      await expect(validateJWT(token, jwtSecret)).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("rejects when signature is invalid (wrong secret)", async () => {
      const token = await makeJWT(userId, expiresIn1, jwtSecret);
      await expect(validateJWT(token, "wrong-secret")).rejects.toThrow(
        UnauthorizedError
      );
    });

    it("rejects when token is tampered/malformed", async () => {
      const token = await makeJWT(userId, expiresIn1, jwtSecret);
      const parts = token.split(".");
      parts[1] =
        parts[1].slice(0, -1) + (parts[1].slice(-1) === "A" ? "B" : "A");
      const tampered = parts.join(".");

      await expect(validateJWT(tampered, jwtSecret)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("Get Bearer Token", () => {
    it("returns token when Authorization: Bearer <token>", async () => {
      const req = makeReq({ Authorization: "Bearer abc.123.xyz" });
      await expect(getBearerToken(req)).resolves.toBe("abc.123.xyz");
    });

    it("rejects when authorization header isn't present", async () => {
      const req = makeReq({ Otherheader: "hello" });
      await expect(getBearerToken(req)).rejects.toThrow(
        /missing authorization header/i
      );
    });

    it("rejects when bearer isn't present", async () => {
      const req = makeReq({ Authorization: "should throw" });
      await expect(getBearerToken(req)).rejects.toThrow(/invalid scheme/i);
    });

    it("is case insensitive and tolerates extra spaces", async () => {
      const req = makeReq({ Authorization: "bearer       token123" });
      await expect(getBearerToken(req)).resolves.toBe("token123");
    });

    it("rejects when no headers are present", async () => {
      const req = makeReq({});
      await expect(getBearerToken(req)).rejects.toThrow(
        /missing authorization header/i
      );
    });

    it("rejects when token is empty", async () => {
      const req = makeReq({ Authorization: "Bearer " });
      console.log(req);
      await expect(getBearerToken(req)).rejects.toThrow(/invalid scheme/i);
    });
  });
});

function makeReq(headers: Record<string, string>): ReqLike {
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  return {
    headers: lower as any,
    get(name: string) {
      return (lower as any)[name.toLowerCase()];
    },
  };
}
