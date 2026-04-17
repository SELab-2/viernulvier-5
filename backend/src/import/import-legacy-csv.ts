/**
 * Legacy CSV Importer
 *
 * Imports productions from productions.csv and events from events-voorstellingen.csv
 * into the existing Prisma schema.
 *
 * Usage:
 *   npx tsx import-legacy-csv.ts --productions ./productions.csv --events ./events-voorstellingen.csv
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../scraper/prisma.js";
import { log } from "../scraper/logger.js";

const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
}
const PRODUCTIONS_FILE = getArg("--productions");
const EVENTS_FILE = getArg("--events");

function legacyApiId(numericId: string | number): string {
    return `legacy-${numericId}`;
}

function parseDate(raw: string | undefined | null): Date | null {
    if (!raw) return null;
    const d = new Date(raw.trim());
    return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Productions
// ---------------------------------------------------------------------------

interface ProductionRow {
    Titel: string;
    Ondertitel: string;
    Description1: string;
    Genre: string;
    ID: string;
}

async function importProductions(filePath: string) {
    log(`Reading productions from ${filePath}`);
    const raw = fs.readFileSync(filePath, "utf-8");

    const rows: ProductionRow[] = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    log(`Parsed ${rows.length} production rows`);
    let created = 0;

    for (const row of rows) {
        const numericId = row.ID?.trim();
        if (!numericId) continue;

        const apiId = legacyApiId(numericId);

        const data = {
            apiId,
            title: row.Titel ? { nl: row.Titel.trim() } : null,
            tagline: row.Ondertitel ? { nl: row.Ondertitel.trim() } : null,
            description: row.Description1 ? { nl: row.Description1.trim() } : null,
            custom_data: row.Genre ? { legacy_genre: row.Genre.trim() } : undefined,
        };

        const existing = await prisma.production.findUnique({ where: { apiId } });
        if (!existing) {
            await prisma.production.create({ data });
            created++;
        }
    }

    log(`Productions done — created: ${created}`);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

interface EventRow {
    Starttime: string;
    Endtime: string;
    Hall: string;
    Production: string;
}

async function importEvents(filePath: string) {
    log(`Reading events from ${filePath}`);
    const raw = fs.readFileSync(filePath, "utf-8");

    const rows: EventRow[] = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    log(`Parsed ${rows.length} event rows`);
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
        const productionNumericId = row.Production?.trim();
        if (!productionNumericId) {
            skipped++;
            continue;
        }

        const production = await prisma.production.findUnique({
            where: { apiId: legacyApiId(productionNumericId) },
        });

        if (!production) {
            log(`  ⚠  Production not found for ID "${productionNumericId}", skipping`);
            skipped++;
            continue;
        }

        const starts_at = parseDate(row.Starttime);
        const startStr = starts_at ? starts_at.toISOString().replace(/[^0-9T]/g, "") : "nostart";
        const eventApiId = `legacy-event-${productionNumericId}-${startStr}`;

        const existing = await prisma.event.findUnique({ where: { apiId: eventApiId } });
        if (!existing) {
            await prisma.event.create({
                data: {
                    apiId: eventApiId,
                    starts_at: starts_at ?? undefined,
                    ends_at: parseDate(row.Endtime) ?? undefined,
                    production_id: production.id,
                },
            });
            created++;
        }
    }

    log(`Events done — created: ${created}, skipped: ${skipped}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    if (!PRODUCTIONS_FILE && !EVENTS_FILE) {
        console.error(
            "Usage: npx tsx import-legacy-csv.ts [--productions <file>] [--events <file>]"
        );
        process.exit(1);
    }

    if (PRODUCTIONS_FILE) await importProductions(path.resolve(PRODUCTIONS_FILE));
    if (EVENTS_FILE) await importEvents(path.resolve(EVENTS_FILE));

    log("Import complete.");
}

main();