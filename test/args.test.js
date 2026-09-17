import { describe, it, expect } from "vitest";
import { parseRange } from "../src/args.js";

describe("parseRange", () => {
  it("parsea 'A-B' a [A, B]", () => {
    expect(parseRange("3000-3010")).toEqual([3000, 3010]);
  });

  it("devuelve null si no son numeros validos", () => {
    expect(parseRange("abc-def")).toBeNull();
    expect(parseRange("3000")).toBeNull();
  });
});
