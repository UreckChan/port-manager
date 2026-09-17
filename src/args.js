export function parseRange(str) {
  const parts = str.split("-").map(Number);
  if (parts.length !== 2 || !parts.every(Number.isFinite)) return null;
  return parts;
}
