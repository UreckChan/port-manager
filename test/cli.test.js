import { describe, it, expect, vi, beforeEach } from "vitest";

const scanPorts = vi.fn();
const killPid = vi.fn();
let nextAnswer = "s";

vi.mock("../src/scanner.js", () => ({ scanPorts: (...a) => scanPorts(...a) }));
vi.mock("../src/killer.js", () => ({ killPid: (...a) => killPid(...a) }));
vi.mock("node:readline", () => ({
  default: {
    createInterface: () => ({
      question: (_q, cb) => cb(nextAnswer),
      close: () => {},
    }),
  },
}));

const { filterByRange, runKill, runKillAll } = await import("../src/cli.js");

beforeEach(() => {
  scanPorts.mockReset();
  killPid.mockReset();
  killPid.mockReturnValue(true);
  nextAnswer = "s";
});

describe("filterByRange", () => {
  it("filtra puertos dentro del rango inclusivo", () => {
    const rows = [{ port: 2999 }, { port: 3000 }, { port: 3010 }, { port: 3011 }];
    expect(filterByRange(rows, 3000, 3010)).toEqual([{ port: 3000 }, { port: 3010 }]);
  });
});

describe("runKill", () => {
  it("con -y no pregunta y mata el pid del puerto pedido", async () => {
    scanPorts.mockReturnValue([
      { port: 3000, pid: "1", command: "node", address: "*:3000" },
      { port: 4000, pid: "2", command: "node", address: "*:4000" },
    ]);

    await runKill(3000, { yes: true });

    expect(killPid).toHaveBeenCalledOnce();
    expect(killPid).toHaveBeenCalledWith("1");
  });

  it("sin -y y el usuario responde 'n': no mata nada", async () => {
    nextAnswer = "n";
    scanPorts.mockReturnValue([{ port: 3000, pid: "1", command: "node", address: "*:3000" }]);

    await runKill(3000, { yes: false });

    expect(killPid).not.toHaveBeenCalled();
  });
});

describe("runKillAll", () => {
  it("por default excluye puertos de sistema (<1024)", async () => {
    scanPorts.mockReturnValue([
      { port: 80, pid: "1", command: "sys", address: "*:80" },
      { port: 3000, pid: "2", command: "node", address: "*:3000" },
    ]);

    await runKillAll({ yes: true, allPorts: false });

    expect(killPid).toHaveBeenCalledOnce();
    expect(killPid).toHaveBeenCalledWith("2");
  });

  it("con --all-ports incluye tambien los de sistema", async () => {
    scanPorts.mockReturnValue([
      { port: 80, pid: "1", command: "sys", address: "*:80" },
      { port: 3000, pid: "2", command: "node", address: "*:3000" },
    ]);

    await runKillAll({ yes: true, allPorts: true });

    expect(killPid).toHaveBeenCalledTimes(2);
  });
});
