export const DEBUG_SCRAPER = process.env.DEBUG_SCRAPER === "true";

export function log(message: string, ...args: unknown[]) {
  if (DEBUG_SCRAPER) {
    // Clear the current status line before logging debug info to avoid overlap
    process.stdout.write("\r\x1b[K"); 
    console.log(message, ...args);
  }
}

let lastStatus = "";

export function updateStatus(module: string, progress: string) {
  const status = `[\x1b[36m${module.padEnd(12)}\x1b[0m] ${progress}`;
  if (status === lastStatus) return;
  
  lastStatus = status;
  // \r moves to start of line, \x1b[K clears the line
  process.stdout.write(`\r\x1b[K${status}`);
}

export function createProgressBar(current: number, total: number, width: number = 20): string {
  if (total <= 0) return "";
  const progress = Math.min(1, current / total);
  const filledWidth = Math.round(progress * width);
  const emptyWidth = width - filledWidth;
  
  const filled = "█".repeat(filledWidth);
  const empty = "░".repeat(emptyWidth);
  const percentage = Math.round(progress * 100);
  
  return `[\x1b[32m${filled}${empty}\x1b[0m] ${percentage}% (${current}/${total})`;
}

export function finishStatus(message: string) {
  process.stdout.write(`\r\x1b[K${message}\n`);
  lastStatus = "";
}