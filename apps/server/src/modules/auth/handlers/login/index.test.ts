import { createTestDb, usersTable } from "@homero/db";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test
} from "bun:test";
import argon2 from "argon2";
import { jwtVerify } from "jose";
import { createLoginHandler } from "./index";

let container: Awaited<ReturnType<typeof createTestDb>>;
let testDb: Awaited<ReturnType<typeof createTestDb>>["db"];
let app: ReturnType<typeof createLoginHandler>;

const TEST_USER = {
  username: "testuser",
  email: "test@example.com",
  password: "password123"
};

describe.only("POST /login", () => {
  beforeAll(async () => {
    const testDbInstance = await createTestDb();
    container = testDbInstance;
    testDb = testDbInstance.db;

    app = createLoginHandler({ db: testDb });

    process.env.JWT_SECRET = "test-jwt-secret-key";
    process.env.REFRESH_JWT_SECRET = "test-refresh-jwt-secret-key";
  });

  beforeEach(async () => {
    await testDb.delete(usersTable);

    const hashedPassword = await argon2.hash(TEST_USER.password);
    await testDb.insert(usersTable).values({
      username: TEST_USER.username,
      email: TEST_USER.email,
      passwordHash: hashedPassword
    });
  });

  afterAll(async () => {
    await container?.container.stop();
  });

  describe("validation", () => {
    test.each([
      {
        description: "missing username field",
        body: { password: "password123" }
      },
      {
        description: "missing password field",
        body: { username: "testuser" }
      },
      {
        description: "non-string username",
        body: { username: 123, password: "password123" }
      },
      {
        description: "non-string password",
        body: { username: "testuser", password: 123 }
      }
    ])("should return 422 when $description", async ({ body }) => {
      const response = await app.handle(
        new Request("http://localhost/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("authentication failures", () => {
    test.each([
      {
        description: "user does not exist",
        body: { username: "nonexistent", password: "password123" }
      },
      {
        description: "password is incorrect",
        body: { username: TEST_USER.username, password: "wrongpassword" }
      }
    ])("should return 401 when $description", async ({ body }) => {
      const response = await app.handle(
        new Request("http://localhost/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
      );

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe("Invalid username or password");
    });
  });

  describe("successful login", () => {
    test("should return 200 and user payload when credentials are valid", async () => {
      const request = new Request("http://localhost/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: TEST_USER.username,
          password: TEST_USER.password
        })
      });

      const response = await app.handle(request);

      expect(response.status).toBe(200);

      const json = (await response.json()) as Record<string, unknown>;
      expect(json).toHaveProperty("user");
      expect(json.user).toHaveProperty("userID");
      expect(json.user).toHaveProperty("email", TEST_USER.email);
      expect(json.user).toHaveProperty("username", TEST_USER.username);
    });

    test.skip.each([
      {
        description: "access_token cookie is set with correct properties",
        cookieName: "access_token",
        expectedMaxAge: 900
      },
      {
        description: "refresh_token cookie is set with correct properties",
        cookieName: "refresh_token",
        expectedMaxAge: 604800
      }
    ])(
      "should set $description when login is successful",
      async ({ cookieName, expectedMaxAge }) => {
        const response = await app.handle(
          new Request("http://localhost/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: TEST_USER.username,
              password: TEST_USER.password
            })
          })
        );

        console.log("Cookie headers", response.headers.getSetCookie());

        expect(response.status).toBe(200);

        const setCookieHeaders = response.headers.getSetCookie?.() || [];
        const cookieHeader = setCookieHeaders.find((cookie) =>
          cookie.startsWith(cookieName)
        );

        expect(cookieHeader).toBeDefined();
        expect(cookieHeader).toContain("HttpOnly");
        expect(cookieHeader).toContain("SameSite=Strict");
        expect(cookieHeader).toContain(`Max-Age=${expectedMaxAge}`);
      }
    );

    test.skip("should update user's refresh token in database when login is successful", async () => {
      const response = await app.handle(
        new Request("http://localhost/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: TEST_USER.username,
            password: TEST_USER.password
          })
        })
      );

      expect(response.status).toBe(200);

      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      const refreshTokenCookie = setCookieHeaders.find((cookie) =>
        cookie.startsWith("refresh_token")
      );
      const refreshTokenMatch = refreshTokenCookie?.match(
        /refresh_token=([^;]+)/
      );
      const refreshTokenFromCookie = refreshTokenMatch?.[1];

      expect(refreshTokenFromCookie).toBeDefined();

      const users = await testDb.select().from(usersTable);
      const user = users[0];

      expect(user?.refreshToken).toBeDefined();
      expect(user?.refreshToken).not.toBe(refreshTokenFromCookie);

      const isValidHash = await argon2.verify(
        user!.refreshToken!,
        refreshTokenFromCookie!
      );
      expect(isValidHash).toBe(true);
    });

    test.skip("should generate valid access JWT token when login is successful", async () => {
      const response = await app.handle(
        new Request("http://localhost/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: TEST_USER.username,
            password: TEST_USER.password
          })
        })
      );

      expect(response.status).toBe(200);

      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      const accessTokenCookie = setCookieHeaders.find((cookie) =>
        cookie.startsWith("access_token")
      );
      const accessTokenMatch = accessTokenCookie?.match(/access_token=([^;]+)/);
      const accessToken = accessTokenMatch?.[1];

      expect(accessToken).toBeDefined();

      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(accessToken!, secret);

      expect(payload).toHaveProperty("userID");
      expect(payload).toHaveProperty("email", TEST_USER.email);
      expect(payload).toHaveProperty("username", TEST_USER.username);
    });

    test.skip("should generate valid refresh JWT token when login is successful", async () => {
      const response = await app.handle(
        new Request("http://localhost/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: TEST_USER.username,
            password: TEST_USER.password
          })
        })
      );

      expect(response.status).toBe(200);

      const setCookieHeaders = response.headers.getSetCookie?.() || [];
      const refreshTokenCookie = setCookieHeaders.find((cookie) =>
        cookie.startsWith("refresh_token")
      );
      const refreshTokenMatch = refreshTokenCookie?.match(
        /refresh_token=([^;]+)/
      );
      const refreshToken = refreshTokenMatch?.[1];

      expect(refreshToken).toBeDefined();

      const secret = new TextEncoder().encode(process.env.REFRESH_JWT_SECRET);
      const { payload } = await jwtVerify(refreshToken!, secret);

      expect(payload).toHaveProperty("type", "refresh");
      expect(payload).toHaveProperty("userID");
    });
  });
});
