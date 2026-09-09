import readline from "node:readline";
import { scanPorts } from "./scanner.js";
import { killPid } from "./killer.js";

const SYSTEM_PORT_LIMIT = 1024;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (answer) => {
    rl.close();
    resolve(answer.trim());
  }));
}

function printTable(rows) {
  if (rows.length === 0) {
    console.log("Ningun puerto en LISTEN encontrado.");
    return;
  }
  const widths = { i: 3, port: 8, pid: 8, command: 20, address: 22 };
  console.log(
    "#".padEnd(widths.i) +
    "PUERTO".padEnd(widths.port) +
    "PID".padEnd(widths.pid) +
    "PROCESO".padEnd(widths.command) +
    "DIRECCION".padEnd(widths.address)
  );
  rows.forEach((r, i) => {
    console.log(
      String(i + 1).padEnd(widths.i) +
      String(r.port).padEnd(widths.port) +
      String(r.pid).padEnd(widths.pid) +
      String(r.command).padEnd(widths.command) +
      String(r.address).padEnd(widths.address)
    );
  });
}

function filterByRange(rows, start, end) {
  return rows.filter((r) => r.port >= start && r.port <= end);
}

async function confirmKill(rows, yes) {
  if (rows.length === 0) {
    console.log("Nada que cerrar.");
    return;
  }
  printTable(rows);
  if (!yes) {
    const ans = await ask(`\nCerrar ${rows.length} proceso(s)? (s/N): `);
    if (ans.toLowerCase() !== "s") {
      console.log("Cancelado.");
      return;
    }
  }
  const uniquePids = [...new Set(rows.map((r) => r.pid))];
  let ok = 0;
  for (const pid of uniquePids) {
    if (killPid(pid)) ok++;
  }
  console.log(`Cerrados ${ok}/${uniquePids.length} procesos.`);
}

export async function runList(opts) {
  let rows = scanPorts();
  if (opts.range) rows = filterByRange(rows, opts.range[0], opts.range[1]);
  if (opts.json) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  printTable(rows);
}

export async function runKill(port, opts) {
  const rows = scanPorts().filter((r) => r.port === port);
  await confirmKill(rows, opts.yes);
}

export async function runKillRange(start, end, opts) {
  const rows = filterByRange(scanPorts(), start, end);
  await confirmKill(rows, opts.yes);
}

export async function runKillAll(opts) {
  let rows = scanPorts();
  if (!opts.allPorts) rows = rows.filter((r) => r.port >= SYSTEM_PORT_LIMIT);
  await confirmKill(rows, opts.yes);
}

export async function runInteractive() {
  const rows = scanPorts();
  if (rows.length === 0) {
    console.log("Ningun puerto en LISTEN encontrado.");
    return;
  }
  printTable(rows);
  const ans = await ask(
    "\nNumeros a cerrar separados por coma, 'a' = todos, 'q' = salir: "
  );
  if (!ans || ans.toLowerCase() === "q") {
    console.log("Cancelado.");
    return;
  }
  let selected;
  if (ans.toLowerCase() === "a") {
    selected = rows;
  } else {
    const indexes = ans.split(",").map((s) => Number(s.trim()) - 1);
    selected = indexes.filter((i) => i >= 0 && i < rows.length).map((i) => rows[i]);
  }
  await confirmKill(selected, false);
}
