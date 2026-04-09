import pc from "picocolors";

export function logDebug(value: string, label?: string): void {
  const prefix = pc.cyan("[DEBUG]");
  if (label) {
    process.stderr.write(`${prefix} ${pc.dim(label)} ${value}\n`);
  } else {
    process.stderr.write(`${prefix} ${value}\n`);
  }
}
