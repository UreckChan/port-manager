# port-manager (`portctl`)

[![CI](https://github.com/UreckChan/port-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/UreckChan/port-manager/actions/workflows/ci.yml)

CLI para escanear y cerrar puertos abiertos en macOS, Linux y Windows. Node puro,
sin dependencias externas — usa `lsof` (mac/linux) o `netstat`+`taskkill` (windows).

Pensado para el caso: dev servers zombie (proyectos con `npm run dev` en 3000,
3001, etc. que quedaron abiertos porque se cerró la consola sin matar el
proceso, o los abrió la IA y no los cerró).

## Instalación (comando global)

```bash
cd port-manager
npm link
```

Esto deja el comando `portctl` disponible en cualquier terminal. Para
desinstalar: `npm unlink -g port-manager`.

## Uso

```bash
portctl                     # menu interactivo: lista y elige que cerrar
portctl list                # lista todos los puertos en LISTEN
portctl list --json         # salida JSON (para que la IA la lea sin gastar tokens en preguntar)
portctl list --range=3000-9000

portctl kill 3000           # cierra el proceso que escucha el puerto 3000 (pide confirmacion)
portctl kill 3000 -y        # sin confirmacion

portctl killrange 3000 3010 -y   # cierra todo en el rango
portctl killall -y               # cierra TODOS los puertos >= 1024 (evita puertos de sistema)
portctl killall --all-ports -y   # cierra TODO, incluye < 1024 (puede requerir sudo/admin)
```

## Por que existe

En vez de pedirle a la IA "revisa y cierra los puertos abiertos" (gasta
tokens cada vez), corres `portctl` directo. La IA tambien puede llamarlo con
`--json` y `-y` si necesita automatizar el cierre sin preguntar.

## Tests

```bash
npm install
npm test
```

Suite con vitest: parseo de `lsof`/`netstat` (incluye el caso `(LISTEN)` que
rompe el parseo naive), `dedupe`, `parseRange`, y la lógica de comandos
(`kill`, `killall`) con `scanPorts`/`killPid` mockeados — no ejecuta
procesos reales. CI corre esta suite en `ubuntu`/`macos`/`windows` × Node
18/20/22 en cada push/PR a `main`.

## Notas

- En macOS/Linux el cierre es `kill -9` (SIGKILL, no da chance de cleanup).
- `killall` por default excluye puertos < 1024 (suelen ser del sistema y
  requieren permisos). Usa `--all-ports` si de verdad quieres incluirlos.
- Si un puerto no aparece pero sabes que esta abierto: puede ser que el
  proceso corra con otro usuario (necesitas `sudo portctl ...`) o que el
  firewall/sandbox de tu entorno oculte el estado real del socket.
