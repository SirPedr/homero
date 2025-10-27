import { describe, it, expect } from "bun:test";

describe("add module", () => {
  it("should add two numbers correctly", () => {
    const add = (a: number, b: number): number => a + b;
    expect(add(2, 3)).toBe(5);
  });
});
