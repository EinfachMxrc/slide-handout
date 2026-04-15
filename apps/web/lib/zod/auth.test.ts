import { describe, expect, test } from "vitest";
import { LoginPayload, RegisterPayload } from "./auth";

describe("RegisterPayload", () => {
  test("accepts minimal valid input", () => {
    const r = RegisterPayload.safeParse({
      email: "a@b.co",
      password: "1234567890",
      displayName: "Alice",
    });
    expect(r.success).toBe(true);
  });

  test("rejects invalid email", () => {
    const r = RegisterPayload.safeParse({
      email: "not-an-email",
      password: "1234567890",
      displayName: "Alice",
    });
    expect(r.success).toBe(false);
  });

  test("rejects password under 10 chars", () => {
    const r = RegisterPayload.safeParse({
      email: "a@b.co",
      password: "short",
      displayName: "Alice",
    });
    expect(r.success).toBe(false);
  });

  test("rejects empty displayName", () => {
    const r = RegisterPayload.safeParse({
      email: "a@b.co",
      password: "1234567890",
      displayName: "",
    });
    expect(r.success).toBe(false);
  });

  test("rejects displayName over 80 chars", () => {
    const r = RegisterPayload.safeParse({
      email: "a@b.co",
      password: "1234567890",
      displayName: "x".repeat(81),
    });
    expect(r.success).toBe(false);
  });
});

describe("LoginPayload", () => {
  test("accepts any non-empty password", () => {
    const r = LoginPayload.safeParse({ email: "a@b.co", password: "x" });
    expect(r.success).toBe(true);
  });

  test("rejects empty password", () => {
    const r = LoginPayload.safeParse({ email: "a@b.co", password: "" });
    expect(r.success).toBe(false);
  });
});
