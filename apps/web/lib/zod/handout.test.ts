import { describe, expect, test } from "vitest";
import { HandoutCreate, HandoutUpdate, HexColor, HttpsUrl } from "./handout";

describe("HandoutCreate", () => {
  test("accepts a minimal handout", () => {
    const r = HandoutCreate.safeParse({ title: "T", description: "" });
    expect(r.success).toBe(true);
  });

  test("rejects empty title", () => {
    const r = HandoutCreate.safeParse({ title: "", description: "" });
    expect(r.success).toBe(false);
  });

  test("rejects title over 120 chars", () => {
    const r = HandoutCreate.safeParse({
      title: "x".repeat(121),
      description: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("HexColor", () => {
  test.each(["#fff", "#FFFFFF", "#abc123"])("accepts %s", (c) => {
    expect(HexColor.safeParse(c).success).toBe(true);
  });
  test.each(["", "fff", "#xyz", "#12345"])("rejects %s", (c) => {
    expect(HexColor.safeParse(c).success).toBe(false);
  });
});

describe("HttpsUrl", () => {
  test("accepts empty string", () => {
    expect(HttpsUrl.safeParse("").success).toBe(true);
  });
  test("accepts https URL", () => {
    expect(HttpsUrl.safeParse("https://example.com/x").success).toBe(true);
  });
  test("rejects http URL", () => {
    expect(HttpsUrl.safeParse("http://example.com").success).toBe(false);
  });
});

describe("HandoutUpdate", () => {
  test("accepts partial update", () => {
    expect(HandoutUpdate.safeParse({ title: "New title" }).success).toBe(true);
  });

  test("accepts theme enum values", () => {
    expect(HandoutUpdate.safeParse({ readerTheme: "dark" }).success).toBe(true);
  });

  test("rejects invalid theme", () => {
    expect(HandoutUpdate.safeParse({ readerTheme: "purple" }).success).toBe(
      false,
    );
  });
});
