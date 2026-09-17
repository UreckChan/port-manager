import { execSync } from "node:child_process";
import os from "node:os";

const platform = os.platform();

function safeExec(cmd) {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch (err) {
    // lsof/netstat devuelven exit code != 0 cuando no hay resultados, no es error real
    return err.stdout ? err.stdout.toString() : "";
  }
}

export function parseLsofOutput(output) {
  const lines = output.split("\n").filter(Boolean);
  const rows = [];
  for (const line of lines.slice(1)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;
    const command = parts[0];
    const pid = parts[1];
    // lsof agrega "(LISTEN)" como token final tras la direccion; buscamos
    // de derecha a izquierda el primer token con ":puerto" real.
    let name = null;
    let match = null;
    for (let i = parts.length - 1; i >= 0; i--) {
      const m = parts[i].match(/:(\d+)$/);
      if (m) {
        name = parts[i];
        match = m;
        break;
      }
    }
    if (!match) continue;
    rows.push({ port: Number(match[1]), pid, command, address: name });
  }
  return rows;
}

export function parseNetstatOutput(output, getName) {
  const lines = output.split("\n").filter(Boolean);
  const rows = [];
  const nameCache = new Map();
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;
    const [proto, local, , state, pid] = parts;
    if (proto !== "TCP" || state !== "LISTENING") continue;
    const match = local.match(/:(\d+)$/);
    if (!match) continue;
    if (!nameCache.has(pid)) nameCache.set(pid, getName(pid));
    rows.push({ port: Number(match[1]), pid, command: nameCache.get(pid), address: local });
  }
  return rows;
}

function scanUnix() {
  return parseLsofOutput(safeExec("lsof -iTCP -sTCP:LISTEN -n -P"));
}

function tasklistName(pid) {
  const out = safeExec(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`);
  const firstLine = out.split("\n").find(Boolean);
  if (!firstLine) return "?";
  const field = firstLine.split('","')[0];
  return field.replace(/^"/, "") || "?";
}

function scanWindows() {
  return parseNetstatOutput(safeExec("netstat -ano -p TCP"), tasklistName);
}

export function dedupe(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.port}:${r.pid}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function scanPorts() {
  const rows = platform === "win32" ? scanWindows() : scanUnix();
  rows.sort((a, b) => a.port - b.port);
  return dedupe(rows);
}

export function isWindows() {
  return platform === "win32";
}
