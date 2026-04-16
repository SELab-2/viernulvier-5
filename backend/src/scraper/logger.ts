export const DEBUG_SCRAPER = process.env.DEBUG_SCRAPER === "true";

export function log(message: string, ...args: unknown[]) {
  if (DEBUG_SCRAPER) {
    console.log(message, ...args);
  }
}