import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:child_process", () => ({ execSync: vi.fn() }));
vi.mock("../src/scanner.js", () => ({ isWindows: vi.fn() }));

import { execSync } from "node:child_process";
import { isWindows } from "../src/scanner.js";
import { killPid } from "../src/killer.js";

beforeEach(() => {
  execSync.mockReset();
  isWindows.mockReset();
});

describe("killPid", () => {
  it("usa kill -9 en unix", () => {
    isWindows.mockReturnValue(false);
    const ok = killPid("1234");
    expect(ok).toBe(true);
    expect(execSync).toHaveBeenCalledWith("kill -9 1234", { stdio: "ignore" });
  });

  it("usa taskkill /F en windows", () => {
    isWindows.mockReturnValue(true);
    const ok = killPid("1234");
    expect(ok).toBe(true);
    expect(execSync).toHaveBeenCalledWith("taskkill /PID 1234 /F", { stdio: "ignore" });
  });

  it("devuelve false si execSync falla (proceso ya no existe)", () => {
    isWindows.mockReturnValue(false);
    execSync.mockImplementation(() => {
      throw new Error("No such process");
    });
    expect(killPid("1234")).toBe(false);
  });
});
