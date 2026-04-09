const cyan = (s: string) => `\x1b[36m${s}\x1b[39m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[22m`;

export function logDebug(value: string, label?: string): void {
  const prefix = cyan("[DEBUG]");
  if (label) {
    process.stderr.write(`${prefix} ${dim(label)} ${value}\n`);
  } else {
    process.stderr.write(`${prefix} ${value}\n`);
  }
}
