import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { prisma } from '../../../src/scraper/prisma';

/*
!!!!!! READ THIS IF THESE TESTS FAIL !!!!!!!!!

- `npm test` should start the dedicated test database and sync the schema automatically
- Make sure Docker is running locally
- Make sure `backend/.env.test` exists and contains `DATABASE_URL`
- Make sure `DATABASE_URL` points to your test database (URL must contain 'test')
*/


/** Write a temp CSV file and return its path. Cleaned up in afterAll. */
const tempFiles: string[] = [];
function writeTempCsv(content: string): string {
  const filePath = path.join(os.tmpdir(), `legacy-test-${Date.now()}-${Math.random()}.csv`);
  fs.writeFileSync(filePath, content, 'utf-8');
  tempFiles.push(filePath);
  return filePath;
}

import { main } from '../../../src/import/import-legacy-csv';

async function runImport(args: string[]) {
  const original = process.argv;
  process.argv = ['node', 'import-legacy-csv.ts', ...args];

  await main();

  process.argv = original;
}


async function clearLegacyData() {
  await prisma.event.deleteMany({ where: { apiId: { startsWith: 'legacy-event-' } } });
  await prisma.genre_production.deleteMany();
  await prisma.production.deleteMany({ where: { apiId: { startsWith: 'legacy-' } } });
  await prisma.genre.deleteMany({ where: { apiId: { startsWith: 'legacy-genre-' } } });
  await prisma.hall.deleteMany({ where: { apiId: { startsWith: 'legacy-hall-' } } });
}


beforeAll(async () => {
  const testDatabaseUrl = process.env.DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error('Missing DATABASE_URL. Create .env.test with a valid test database URL.');
  }

  if (!/test/i.test(testDatabaseUrl)) {
    throw new Error(
        'Unsafe DATABASE_URL detected. Use a dedicated test database (URL should clearly indicate "test").'
    );
  }

  await clearLegacyData();
});

afterAll(async () => {
  await clearLegacyData();

  // Remove temp CSV files
  for (const f of tempFiles) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }

  await prisma.$disconnect();
});


describe('legacy CSV importer', () => {

  //productions
  describe('importProductions', () => {

    it('creates a production with all fields mapped correctly', async () => {
      const csv = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Mijn Voorstelling,Een ondertitel,Eerste beschrijving,Tweede beschrijving,Theater,1001,legacy-1001',
      ].join('\n');

      const file = writeTempCsv(csv);
      await runImport(['--productions', file]);

      const prod = await prisma.production.findUnique({ where: { apiId: 'legacy-1001' } });
      expect(prod).not.toBeNull();

      expect(prod?.title).toEqual({ nl: 'Mijn Voorstelling' });

      expect(prod?.tagline).toEqual({ nl: 'Een ondertitel' });

      expect(prod?.description).toEqual({ nl: 'Eerste beschrijving' });

      expect(prod?.description_2).toEqual({ nl: 'Tweede beschrijving' });

      // vendor_id should contain the planning ID
      expect(prod?.vendor_id).toBe('legacy-1001');
    });

    it('creates and links a genre via genre_production', async () => {
      const csv = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Theatershow,,,,LegacyTheater,1002,legacy-1002',
      ].join('\n');

      const file = writeTempCsv(csv);
      await runImport(['--productions', file]);

      const prod = await prisma.production.findUnique({ where: { apiId: 'legacy-1002' } });
      expect(prod).not.toBeNull();

      const genre = await prisma.genre.findUnique({
        where: { apiId: 'legacy-genre-legacytheater' },
      });
      expect(genre).not.toBeNull();
      expect(genre?.name).toEqual({ nl: 'LegacyTheater' });

      const link = await prisma.genre_production.findUnique({
        where: {
          genre_id_production_id: {
            genre_id: genre!.id,
            production_id: prod!.id,
          },
        },
      });
      expect(link).not.toBeNull();
    });

    it('reuses an existing genre instead of creating a duplicate', async () => {
      const csv1 = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Show A,,,,Concert,1003,legacy-1003',
      ].join('\n');
      const csv2 = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Show B,,,,Concert,1004,legacy-1004',
      ].join('\n');

      await runImport(['--productions', writeTempCsv(csv1)]);
      await runImport(['--productions', writeTempCsv(csv2)]);

      const genreCount = await prisma.genre.count({
        where: { apiId: 'legacy-genre-concert' },
      });
      expect(genreCount).toBe(1);
    });

    it('handles a row with no genre without crashing', async () => {
      const csv = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Geen Genre Show,,,,,1005,legacy-1005',
      ].join('\n');

      await runImport(['--productions', writeTempCsv(csv)]);

      const prod = await prisma.production.findUnique({ where: { apiId: 'legacy-1005' } });
      expect(prod).not.toBeNull();

      // No genre link should exist for this production
      const links = await prisma.genre_production.findMany({
        where: { production_id: prod!.id },
      });
      expect(links).toHaveLength(0);
    });

    it('skips rows without an ID', async () => {
      const csv = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Geen ID Show,,,,,,' ,  // empty ID
      ].join('\n');

      await runImport(['--productions', writeTempCsv(csv)]);

      // A row with no ID should never be stored — there's no valid apiId to find
      const prod = await prisma.production.findFirst({
        where: { title: { equals: { nl: 'Geen ID Show' } } },
      });
      expect(prod).toBeNull();
    });

    it('updates an existing production instead of creating a duplicate', async () => {
      const csv1 = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Originele Titel,,,,Theater,1006,legacy-1006',
      ].join('\n');
      const csv2 = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Gewijzigde Titel,,,,Theater,1006,legacy-1006',
      ].join('\n');

      await runImport(['--productions', writeTempCsv(csv1)]);
      await runImport(['--productions', writeTempCsv(csv2)]);

      const count = await prisma.production.count({ where: { apiId: 'legacy-1006' } });
      expect(count).toBe(1);

      const prod = await prisma.production.findUnique({ where: { apiId: 'legacy-1006' } });
      expect(prod?.title).toEqual({ nl: 'Gewijzigde Titel' });
    });

    it('handles null/empty optional fields without crashing', async () => {
      const csv = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        ',,,,,1007,',
      ].join('\n');

      await runImport(['--productions', writeTempCsv(csv)]);

      const prod = await prisma.production.findUnique({ where: { apiId: 'legacy-1007' } });
      expect(prod).not.toBeNull();
      expect(prod?.title).toBeNull();
      expect(prod?.tagline).toBeNull();
      expect(prod?.description).toBeNull();
    });

    it('handles a UTF-8 BOM at the start of the file without corrupting the first column name', async () => {
      // Excel and some legacy tools prepend a BOM (\uFEFF) when saving UTF-8 CSVs.
      // If unhandled, the first column becomes '\uFEFFTitel' and every row reads
      // undefined for Titel, silently importing empty productions.
      const bom = '\uFEFF';
      const csv = [
        bom + 'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'BOM Show,,,,Theater,1100,legacy-1100',
      ].join('\n');

      await runImport(['--productions', writeTempCsv(csv)]);

      const prod = await prisma.production.findUnique({ where: { apiId: 'legacy-1100' } });
      expect(prod).not.toBeNull();
      // Title must be populated — if BOM corrupted the column name it would be null
      expect(prod?.title).toEqual({ nl: 'BOM Show' });
    });

  });

  // Events
  describe('importEvents', () => {

    // Seed a production for the event tests to link to
    const PROD_ID = '9001';
    const PROD_API_ID = `legacy-${PROD_ID}`;

    beforeAll(async () => {
      await prisma.production.upsert({
        where: { apiId: PROD_API_ID },
        update: {},
        create: { apiId: PROD_API_ID, title: { nl: 'Test Productie' }, draft: false },
      });
    });

    it('creates an event linked to the correct production', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        `2006-09-15 20:00:00,2006-09-15 22:00:00,Theaterzaal,${PROD_ID}`,
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      const prod = await prisma.production.findUnique({ where: { apiId: PROD_API_ID } });
      const event = await prisma.event.findFirst({
        where: { production_id: prod!.id, apiId: { startsWith: 'legacy-event-' } },
      });

      expect(event).not.toBeNull();
      expect(event?.starts_at?.toISOString()).toBe('2006-09-15T18:00:00.000Z'); // UTC offset from CET
      expect(event?.ends_at?.toISOString()).toBe('2006-09-15T20:00:00.000Z');
    });

    it('creates a hall when the hall name is unknown', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        `2006-10-01 20:00:00,0000-00-00 00:00:00,Nieuwe Onbekende Zaal,${PROD_ID}`,
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      const hall = await prisma.hall.findUnique({
        where: { apiId: 'legacy-hall-nieuwe-onbekende-zaal' },
      });
      expect(hall).not.toBeNull();
      expect(hall?.name).toEqual({ nl: 'Nieuwe Onbekende Zaal' });
    });

    it('reuses an existing hall for the same name', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        `2006-10-02 20:00:00,,Gedeelde Zaal,${PROD_ID}`,
        `2006-10-03 20:00:00,,Gedeelde Zaal,${PROD_ID}`,
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      const hallCount = await prisma.hall.count({
        where: { apiId: 'legacy-hall-gedeelde-zaal' },
      });
      expect(hallCount).toBe(1);
    });

    it('stores NULL for placeholder end dates (0000-00-00 and 1970-01-01)', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        `2006-11-01 20:00:00,0000-00-00 00:00:00,Balzaal,${PROD_ID}`,
        `2006-11-02 20:00:00,1970-01-01 00:00:00,Balzaal,${PROD_ID}`,
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      const events = await prisma.event.findMany({
        where: {
          production_id: (await prisma.production.findUnique({ where: { apiId: PROD_API_ID } }))!.id,
          starts_at: {
            in: [new Date('2006-11-01T19:00:00Z'), new Date('2006-11-02T19:00:00Z')],
          },
        },
      });

      expect(events).toHaveLength(2);
      for (const e of events) {
        expect(e.ends_at).toBeNull();
      }
    });

    it('skips events whose production does not exist', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        '2006-12-01 20:00:00,,Balzaal,99999', // production 99999 does not exist
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      const event = await prisma.event.findFirst({
        where: { apiId: { startsWith: 'legacy-event-99999-' } },
      });
      expect(event).toBeNull();
    });

    it('skips event rows with missing production ID', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        '2006-12-05 20:00:00,,Balzaal,',
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      // 2006-12-05 20:00 CET = 19:00 UTC
      const event = await prisma.event.findFirst({
        where: { starts_at: new Date('2006-12-05T19:00:00Z') },
      });
      expect(event).toBeNull();
    });

    it('does not duplicate events when the same CSV is imported twice', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        // 2007-01-01 is in CET (UTC+1), so 20:00 local = 19:00 UTC → apiId ends in 20070101T190000000Z
        `2007-01-01 20:00:00,2007-01-01 22:00:00,Concertzaal,${PROD_ID}`,
      ].join('\n');

      const file = writeTempCsv(csv);
      await runImport(['--events', file]);
      await runImport(['--events', file]);

      const prod = await prisma.production.findUnique({ where: { apiId: PROD_API_ID } });
      const count = await prisma.event.count({
        where: {
          production_id: prod!.id,
          apiId: `legacy-event-${PROD_ID}-20070101T190000000`,
        },
      });
      expect(count).toBe(1);
    });

    it('handles events with no hall gracefully', async () => {
      const csv = [
        'Starttime,Endtime,Hall,Production',
        `2007-02-01 20:00:00,,,${PROD_ID}`,
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      const prod = await prisma.production.findUnique({ where: { apiId: PROD_API_ID } });
      const event = await prisma.event.findFirst({
        where: {
          production_id: prod!.id,
          // 2007-02-01 is in CET (UTC+1), so 20:00 local = 19:00 UTC
          starts_at: new Date('2007-02-01T19:00:00Z'),
        },
      });

      expect(event).not.toBeNull();
      expect(event?.hall_id).toBeNull();
    });

    it('imports multiple null-start events for the same production as distinct rows', async () => {
      // Regression: before the fix, all null-start events for the same production
      // shared the apiId 'legacy-event-{prodId}-nostart', so each upsert silently
      // overwrote the previous one and only one row survived.
      const csv = [
        'Starttime,Endtime,Hall,Production',
        `0000-00-00 00:00:00,,Zaal A,${PROD_ID}`,
        `0000-00-00 00:00:00,,Zaal B,${PROD_ID}`,
      ].join('\n');

      await runImport(['--events', writeTempCsv(csv)]);

      const prod = await prisma.production.findUnique({ where: { apiId: PROD_API_ID } });
      const noStartEvents = await prisma.event.findMany({
        where: {
          production_id: prod!.id,
          starts_at: null,
          apiId: { startsWith: `legacy-event-${PROD_ID}-nostart` },
        },
      });

      expect(noStartEvents.length).toBeGreaterThanOrEqual(2);
    });

  });

  // Combined run
  describe('combined productions + events import', () => {

    it('links events to productions when both files are imported together', async () => {
      const productionsCsv = [
        'Titel,Ondertitel,Description1,Description2,Genre,ID,Planning ID',
        'Gecombineerde Show,,,,Theater,8001,legacy-8001',
      ].join('\n');

      const eventsCsv = [
        'Starttime,Endtime,Hall,Production',
        '2010-03-15 20:00:00,2010-03-15 22:00:00,Theaterzaal,8001',
      ].join('\n');

      await runImport([
        '--productions', writeTempCsv(productionsCsv),
        '--events', writeTempCsv(eventsCsv),
      ]);

      const prod = await prisma.production.findUnique({ where: { apiId: 'legacy-8001' } });
      expect(prod).not.toBeNull();

      const event = await prisma.event.findFirst({
        where: { production_id: prod!.id },
      });
      expect(event).not.toBeNull();
      expect(event?.production_id).toBe(prod!.id);
    });

  });

});