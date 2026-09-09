#!/usr/bin/env node
import { runList, runKill, runKillRange, runKillAll, runInteractive } from "../src/cli.js";

const HELP = `portctl - escanea y cierra puertos abiertos (dev servers zombie)

Uso:
  portctl                     Menu interactivo (lista y elige que cerrar)
  portctl list                Lista todos los puertos en LISTEN
  portctl list --json         Lista en JSON (para IA/scripts)
  portctl list --range A-B    Lista solo el rango A-B
  portctl kill <puerto>       Cierra el proceso que escucha ese puerto
  portctl killrange A B       Cierra todo en el rango A-B
  portctl killall             Cierra todos los puertos >= 1024 (evita puertos de sistema)
  portctl killall --all-ports Cierra TODO, incluye puertos < 1024 (requiere permisos)

Flags:
  -y, --yes    No pedir confirmacion (uso en scripts/IA)

Ejemplos:
  portctl kill 3000 -y
  portctl killall -y
  portctl killrange 3000 3010 -y
`;

function parseRange(str) {
  const [a, b] = str.split("-").map(Number);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return [a, b];
}

async function main() {
  const args = process.argv.slice(2);
  const yes = args.includes("-y") || args.includes("--yes");
  const json = args.includes("--json");
  const allPorts = args.includes("--all-ports");
  const cmd = args[0];

  if (!cmd || cmd === "interactive") {
    return runInteractive();
  }

  if (cmd === "help" || cmd === "-h" || cmd === "--help") {
    console.log(HELP);
    return;
  }

  if (cmd === "list") {
    const rangeArg = args.find((a) => a.startsWith("--range="));
    const range = rangeArg ? parseRange(rangeArg.split("=")[1]) : null;
    return runList({ json, range });
  }

  if (cmd === "kill") {
    const port = Number(args[1]);
    if (!port) {
      console.error("Falta el puerto. Ej: portctl kill 3000");
      process.exit(1);
    }
    return runKill(port, { yes });
  }

  if (cmd === "killrange") {
    const start = Number(args[1]);
    const end = Number(args[2]);
    if (!start || !end) {
      console.error("Uso: portctl killrange <inicio> <fin>");
      process.exit(1);
    }
    return runKillRange(start, end, { yes });
  }

  if (cmd === "killall") {
    return runKillAll({ yes, allPorts });
  }

  console.error(`Comando desconocido: ${cmd}\n`);
  console.log(HELP);
  process.exit(1);
}

main();
