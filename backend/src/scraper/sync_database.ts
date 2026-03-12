import { fileURLToPath } from 'node:url';
import { prisma } from "./prisma";
import { log } from "./logger";

import Scraper from './scraper';

// contains the data of the last sync with the API, the scraper will only add data updated or created after this timestamp


async function readCutoffTimestamp(): Promise<Date | undefined> {
  const last_scraped = await prisma.last_scraped.findFirst()
  if (!last_scraped) {
    log('unable to read timestamp from database, reverted to standard: enter everything');
    return undefined;
  }
  const ts = new Date(last_scraped.time)

  if (Number.isNaN(ts.getTime())) {
    log('unable to read timestamp from database, reverted to standard: enter everything');
    return undefined;
  }

  log('Timestamp read from database:', ts.toISOString());
  return ts;
}

export async function main() {
  const cutoff_timestamp = await readCutoffTimestamp();
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

  await prisma.last_scraped.deleteMany({});
  await prisma.last_scraped.create({
    data: {
      time: timestamp
    }
  });
  log("Timestamp written to database table 'last_scraped' :", timestamp);
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

if (isMainModule) {
  main().catch((error) => {
    console.error('Error running scraper sync:', error);
    process.exit(1);
  });
}