import { execSync } from "node:child_process";
import { isWindows } from "./scanner.js";

export function killPid(pid) {
  try {
    if (isWindows()) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
    } else {
      execSync(`kill -9 ${pid}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}
