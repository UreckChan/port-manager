import { describe, it, expect } from "vitest";
import { parseLsofOutput, parseNetstatOutput, dedupe } from "../src/scanner.js";

describe("parseLsofOutput", () => {
  it("extrae puerto/pid/comando ignorando el token (LISTEN) final", () => {
    const output = [
      "COMMAND   PID   USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME",
      "Python  43660 ugomez    4u  IPv6 0x5f69699944d29e0b      0t0  TCP *:3999 (LISTEN)",
      "postgres  720 ugomez    8u  IPv4 0xe1a81867fc1c711a      0t0  TCP 127.0.0.1:5432 (LISTEN)",
    ].join("\n");

    const rows = parseLsofOutput(output);

    expect(rows).toEqual([
      { port: 3999, pid: "43660", command: "Python", address: "*:3999" },
      { port: 5432, pid: "720", command: "postgres", address: "127.0.0.1:5432" },
    ]);
  });

  it("ignora lineas sin puerto valido", () => {
    const output = [
      "COMMAND   PID   USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME",
      "algo raro sin columnas suficientes",
    ].join("\n");

    expect(parseLsofOutput(output)).toEqual([]);
  });

  it("devuelve vacio si no hay salida", () => {
    expect(parseLsofOutput("")).toEqual([]);
  });
});

describe("parseNetstatOutput", () => {
  it("extrae solo lineas TCP en LISTENING y resuelve el nombre por pid", () => {
    const output = [
      "Proto  Local Address          Foreign Address        State           PID",
      "  TCP    0.0.0.0:3000           0.0.0.0:0              LISTENING       1234",
      "  TCP    127.0.0.1:5000         0.0.0.0:0              ESTABLISHED     5678",
      "  UDP    0.0.0.0:6000           *:*                                    9999",
    ].join("\n");

    const getName = (pid) => (pid === "1234" ? "node.exe" : "?");
    const rows = parseNetstatOutput(output, getName);

    expect(rows).toEqual([
      { port: 3000, pid: "1234", command: "node.exe", address: "0.0.0.0:3000" },
    ]);
  });

  it("llama getName una sola vez por pid (cache)", () => {
    const output = [
      "  TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    1234",
      "  TCP    0.0.0.0:3001    0.0.0.0:0    LISTENING    1234",
    ].join("\n");

    let calls = 0;
    const getName = () => {
      calls++;
      return "node.exe";
    };

    parseNetstatOutput(output, getName);
    expect(calls).toBe(1);
  });
});

describe("dedupe", () => {
  it("colapsa filas con mismo puerto+pid (IPv4/IPv6 duplicados)", () => {
    const rows = [
      { port: 5000, pid: "623", command: "x", address: "*:5000" },
      { port: 5000, pid: "623", command: "x", address: "[::1]:5000" },
      { port: 5432, pid: "720", command: "postgres", address: "127.0.0.1:5432" },
    ];

    expect(dedupe(rows)).toEqual([
      { port: 5000, pid: "623", command: "x", address: "*:5000" },
      { port: 5432, pid: "720", command: "postgres", address: "127.0.0.1:5432" },
    ]);
  });
});
