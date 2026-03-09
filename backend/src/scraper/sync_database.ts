import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import Scraper from './scraper';

// contains the data of the last sync
const TIMESTAMP_FILE = join(dirname(fileURLToPath(import.meta.url)), 'scraper_timestamp.txt');

function readCutoffTimestamp(): Date | undefined {
  if (!existsSync(TIMESTAMP_FILE)) {
    console.log('unable to read timestamp from file, reverted to standard: enter everything');
    return undefined;
  }

  const read_timestamp = readFileSync(TIMESTAMP_FILE, 'utf-8').trim();
  const ts = new Date(read_timestamp);

  if (Number.isNaN(ts.getTime())) {
    console.log('unable to read timestamp from file, reverted to standard: enter everything');
    return undefined;
  }

  console.log('Timestamp read from file:', ts.toISOString());
  return ts;
}

export async function main() {
  const cutoff_timestamp = readCutoffTimestamp();
  const timestamp = new Date().toISOString();

  await Scraper.sync_locations(cutoff_timestamp);
  await Scraper.sync_spaces(cutoff_timestamp);
  await Scraper.sync_hall(cutoff_timestamp);

  await Scraper.sync_uit_keywords(cutoff_timestamp);
  await Scraper.sync_uit_themes(cutoff_timestamp);
  await Scraper.sync_uit_types(cutoff_timestamp);

  await Scraper.sync_crops(cutoff_timestamp);
  await Scraper.sync_items(cutoff_timestamp);
  await Scraper.sync_galleries(cutoff_timestamp);
  await Scraper.sync_genres(cutoff_timestamp);
  await Scraper.sync_productions(cutoff_timestamp);
  await Scraper.sync_events(cutoff_timestamp);
  await Scraper.sync_event_prices(cutoff_timestamp);
  await Scraper.sync_tags(cutoff_timestamp);

  writeFileSync(TIMESTAMP_FILE, timestamp);
  console.log('Timestamp written to scraper_timestamp.txt:', timestamp);
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error('Error running scraper sync:', error);
    process.exit(1);
  });
}