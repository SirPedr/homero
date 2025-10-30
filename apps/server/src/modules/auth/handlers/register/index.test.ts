import { db, usersTable } from "@homero/db";
import { describe, expect, spyOn, test } from "bun:test";
import { testDb } from "../../../../../test/test-setup";
import { app } from "../../../../index";

describe("POST /register", () => {
  test("creates a new user successfully", async () => {
    const response = await app.handle(
      new Request("http://localhost/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          email: "test@example.com",
          password: "password123"
        })
      })
    );

    expect(response.status).toBe(200);

    const users = await testDb.select().from(usersTable);

    expect(users).toHaveLength(1);
    expect(users[0]!.username).toBe("testuser");
    expect(users[0]!.email).toBe("test@example.com");
  });

  test("returns 409 when user already exists", async () => {
    await app.handle(
      new Request("http://localhost/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          email: "test@example.com",
          password: "password123"
        })
      })
    );

    const response = await app.handle(
      new Request("http://localhost/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "testuser",
          email: "test@example.com",
          password: "password123"
        })
      })
    );

    expect(response.status).toBe(409);
    const text = await response.text();
    expect(text).toBe("User already exists");
  });

  describe("validation", () => {
    test.each([
      {
        description: "empty username",
        body: {
          username: "",
          email: "test@example.com",
          password: "password123"
        }
      },
      {
        description: "whitespace-only username",
        body: {
          username: "   ",
          email: "test@example.com",
          password: "password123"
        }
      },
      {
        description: "username longer than 255 characters",
        body: {
          username: "a".repeat(256),
          email: "test@example.com",
          password: "password123"
        }
      },
      {
        description: "invalid email format",
        body: {
          username: "testuser",
          email: "invalid-email",
          password: "password123"
        }
      },
      {
        description: "email without @ symbol",
        body: {
          username: "testuser",
          email: "notanemail.com",
          password: "password123"
        }
      },
      {
        description: "email longer than 255 characters",
        body: {
          username: "testuser",
          email: `${"a".repeat(250)}@test.com`,
          password: "password123"
        }
      },
      {
        description: "password shorter than 8 characters",
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "short"
        }
      },
      {
        description: "password with exactly 7 characters",
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "1234567"
        }
      },
      {
        description: "password longer than 100 characters",
        body: {
          username: "testuser",
          email: "test@example.com",
          password: "a".repeat(101)
        }
      },
      {
        description: "missing username field",
        body: { email: "test@example.com", password: "password123" }
      },
      {
        description: "missing email field",
        body: { username: "testuser", password: "password123" }
      },
      {
        description: "missing password field",
        body: { username: "testuser", email: "test@example.com" }
      },
      {
        description: "multiple invalid fields",
        body: { username: "", email: "invalid-email", password: "short" }
      }
    ])("rejects $description", async ({ body }) => {
      const response = await app.handle(
        new Request("http://localhost/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
      );

      expect(response.status).toBe(422);
    });

    test("accepts password with exactly 8 characters", async () => {
      const response = await app.handle(
        new Request("http://localhost/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser8",
            email: "test8@example.com",
            password: "12345678"
          })
        })
      );

      expect(response.status).toBe(200);
    });

    test("trims whitespace from username", async () => {
      const response = await app.handle(
        new Request("http://localhost/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "  trimtest  ",
            email: "trim@example.com",
            password: "password123"
          })
        })
      );

      expect(response.status).toBe(200);

      const users = await testDb.select().from(usersTable);
      const trimUser = users.find((u) => u.email === "trim@example.com");
      expect(trimUser?.username).toBe("trimtest");
    });
  });

  describe("error handling", () => {
    test("returns 500 when database operation fails with non-duplicate error", async () => {
      const insertSpy = spyOn(db, "insert");

      insertSpy.mockReturnValue({
        values: async () => {
          throw new Error("Database connection failed");
        }
      } as any);

      const response = await app.handle(
        new Request("http://localhost/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "erroruser",
            email: "error@example.com",
            password: "password123"
          })
        })
      );

      expect(response.status).toBe(500);

      insertSpy.mockRestore();
    });
  });
});
