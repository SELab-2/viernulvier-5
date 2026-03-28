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
  const status = `[\x1b[36m${module}\x1b[0m] ${progress}`;
  if (status === lastStatus) return;
  
  lastStatus = status;
  // \r moves to start of line, \x1b[K clears the line
  process.stdout.write(`\r\x1b[K${status}`);
}

export function finishStatus(message: string) {
  process.stdout.write(`\r\x1b[K${message}\n`);
  lastStatus = "";
}