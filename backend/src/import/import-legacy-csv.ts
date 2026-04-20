/**
 * Legacy CSV Importer
 *
 * Imports productions from productions.csv and events from events.csv
 * into the existing Prisma schema.
 *
 * Usage:
 *   npx tsx import-legacy-csv.ts --productions ./productions.csv --events ./events.csv
 *
 * Both flags are optional — you can run only one if needed.
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { Prisma } from "@prisma/client";
import { prisma } from "../scraper/prisma";
import { log } from "../scraper/logger";


//  CLI args

const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
}
const PRODUCTIONS_FILE = getArg("--productions");
const EVENTS_FILE = getArg("--events");


// Helpers

/**
 * Builds the apiId used in the database for legacy records.
 * Both productions and events use this same prefix so the event→production
 * FK lookup works: the events CSV references production by numeric ID,
 * and we store productions as "legacy-{numericId}".
 */
function legacyApiId(numericId: string | number): string {
    return `legacy-${numericId}`;
}

const NULL_DATES = new Set([
    "0000-00-00 00:00:00",
    "1970-01-01 00:00:00",
    "1970-01-01T00:00:00.000Z",
]);

function parseDate(raw: string | undefined | null): Date | null {
    if (!raw || NULL_DATES.has(raw.trim())) return null;
    const d = new Date(raw.trim());
    if (isNaN(d.getTime())) {
        log(`  ⚠  Could not parse date "${raw}", storing as NULL`);
        return null;
    }
    // Extra guard: epoch / year-0 variants
    if (d.getFullYear() <= 1970 && d.getMonth() === 0 && d.getDate() === 1) {
        return null;
    }
    return d;
}


// Productions

interface ProductionRow {
    Titel: string;
    Ondertitel: string;
    Description1: string;
    Description2: string;
    Genre: string;
    ID: string;
    "Planning ID": string;
}

async function importProductions(filePath: string) {
    log(`Reading productions from ${filePath}`);
    const raw = fs.readFileSync(filePath, "utf-8");

    const rows: ProductionRow[] = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        trim: true,
    });

    log(`Parsed ${rows.length} production rows`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
        const numericId = row.ID?.trim();
        if (!numericId) {
            log(`  ⚠  Row missing ID, skipping: ${JSON.stringify(row)}`);
            skipped++;
            continue;
        }

        const apiId = legacyApiId(numericId);

        // Build title as a JSON object (same pattern as live productions).
        // The CSV has (it seems mostly) Dutch titles; we store under "nl" key.
        const titleJson = row.Titel ? { nl: row.Titel.trim() } : null;
        const taglineJson = row.Ondertitel ? { nl: row.Ondertitel.trim() } : null;

        // Description1 → description, Description2 → description_2
        const descriptionJson = row.Description1
            ? { nl: row.Description1.trim() }
            : null;
        const description2Json = row.Description2
            ? { nl: row.Description2.trim() }
            : null;

        const vendorId = row["Planning ID"]?.trim()
            ? `legacy-${row["Planning ID"].trim()}`
            : undefined;

        // Prisma requires Prisma.JsonNull (not plain null) for nullable Json fields.
        const toJson = (v: object | null) => v ?? Prisma.JsonNull;

        const data = {
            apiId,
            title: toJson(titleJson),
            tagline: toJson(taglineJson),
            description: toJson(descriptionJson),
            description_2: toJson(description2Json),
            vendor_id: vendorId,
        };

        const existing = await prisma.production.findUnique({ where: { apiId } });
        if (existing) {
            await prisma.production.update({ where: { apiId }, data });
            updated++;
        } else {
            await prisma.production.create({ data });
            created++;
        }

        if (row.Genre?.trim()) {
            const genreName = row.Genre.trim();
            const genreApiId = `legacy-genre-${genreName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

            // Find or create the genre record
            let dbGenre = await prisma.genre.findUnique({
                where: { apiId: genreApiId },
            });

            if (!dbGenre) {
                // Check if a live genre with this name already exists (any language)
                dbGenre = await prisma.genre.findFirst({
                    where: {
                        OR: [
                            { name: { path: ["nl"], equals: genreName } },
                            { name: { path: ["en"], equals: genreName } },
                            { name: { path: ["fr"], equals: genreName } },
                        ],
                    },
                });
            }

            if (!dbGenre) {
                dbGenre = await prisma.genre.create({
                    data: {
                        apiId: genreApiId,
                        name: { nl: genreName },
                    },
                });
                log(`  ✚ Created genre "${genreName}" (${dbGenre.id})`);
            }

            // Get the production id (either just created or updated above)
            const dbProduction = await prisma.production.findUnique({
                where: { apiId },
                select: { id: true },
            });

            if (dbProduction) {
                await prisma.genre_production.upsert({
                    where: {
                        genre_id_production_id: {
                            genre_id: dbGenre.id,
                            production_id: dbProduction.id,
                        },
                    },
                    update: {},
                    create: {
                        genre_id: dbGenre.id,
                        production_id: dbProduction.id,
                    },
                });
            }
        }
    }

    log(
        `Productions done — created: ${created}, updated: ${updated}, skipped: ${skipped}`
    );
}


// Halls  (created on demand)

// Cache to avoid repeated DB hits for the same hall name within one run
const hallCache = new Map<string, string>(); // name → db uuid

async function findOrCreateHall(rawName: string): Promise<string> {
    const name = rawName.trim();
    if (hallCache.has(name)) return hallCache.get(name)!;

    const nameLower = name.toLowerCase();

    const allHalls = await prisma.hall.findMany({
        select: { id: true, apiId: true, name: true },
    });

    const existing = allHalls.find((hall) => {
        const n = hall.name as Record<string, string> | null;
        if (!n) return false;
        return Object.values(n).some(
            (v) => typeof v === "string" && v.toLowerCase() === nameLower
        );
    });

    if (existing) {
        log(`  ↩ Reusing existing hall "${name}" (${existing.id})`);
        hallCache.set(name, existing.id);
        return existing.id;
    }

    // Create a minimal legacy hall record
    const apiId = `legacy-hall-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    // upsert so concurrent runs / reruns are safe
    const hall = await prisma.hall.upsert({
        where: { apiId },
        update: {},
        create: {
            apiId,
            name: { nl: name },
        },
    });

    log(`  ✚ Created hall "${name}" (${hall.id})`);
    hallCache.set(name, hall.id);
    return hall.id;
}


// Events

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
        relax_quotes: true,
        trim: true,
    });

    log(`Parsed ${rows.length} event rows`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
        const productionNumericId = row.Production?.trim();
        if (!productionNumericId) {
            log(`  ⚠  Event row missing Production ID, skipping`);
            skipped++;
            continue;
        }

        // Look up the production by its legacy apiId
        const productionApiId = legacyApiId(productionNumericId);
        const production = await prisma.production.findUnique({
            where: { apiId: productionApiId },
        });

        if (!production) {
            log(`  ⚠  Production "${productionApiId}" not found — skipping event (start: ${row.Starttime})`);
            skipped++;
            continue;
        }

        const starts_at = parseDate(row.Starttime);
        const ends_at = parseDate(row.Endtime);

        // Resolve / create hall
        let hall_id: string | null = null;
        if (row.Hall?.trim()) {
            hall_id = await findOrCreateHall(row.Hall);
        }

        // Build a stable apiId from production + start time so reruns are idempotent
        const startStr = starts_at
            ? starts_at.toISOString().replace(/[^0-9T]/g, "")
            : "nostart";
        const eventApiId = `legacy-event-${productionNumericId}-${startStr}`;

        const data = {
            apiId: eventApiId,
            starts_at: starts_at ?? undefined,
            ends_at: ends_at ?? undefined,
            production_id: production.id,
            hall_id,
        };

        const existing = await prisma.event.findUnique({
            where: { apiId: eventApiId },
        });
        if (existing) {
            await prisma.event.update({ where: { apiId: eventApiId }, data });
            updated++;
        } else {
            await prisma.event.create({ data });
            created++;
        }
    }

    log(
        `Events done — created: ${created}, updated: ${updated}, skipped: ${skipped}`
    );
}


// Main

async function main() {
    if (!PRODUCTIONS_FILE && !EVENTS_FILE) {
        console.error(
            "Usage: npx tsx import-legacy-csv.ts [--productions <file>] [--events <file>]"
        );
        process.exit(1);
    }

    try {
        if (PRODUCTIONS_FILE) {
            await importProductions(path.resolve(PRODUCTIONS_FILE));
        }
        if (EVENTS_FILE) {
            await importEvents(path.resolve(EVENTS_FILE));
        }
        log("Import complete.");
    } catch (err) {
        console.error("Import failed:", err);
        process.exit(1);
    }
}

main();