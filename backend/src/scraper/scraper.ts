import { prisma } from "./prisma";
import * as Fetcher from "./fetcher"
import { updateStatus, finishStatus, createProgressBar } from "./logger";


import type {
  APIProduction,
  APIEvent,
  APISpace,
  APIHall,
  APILocation,
  APIGenre,
  APIGallery,
  APIItem,
  APIEventPrice,
  APITag,
  APICrop,
  APIUitKeyword,
  APIUitTheme,
  APIUitType,
} from "./APItypes";


export default {
    sync_locations,
    sync_events,
    sync_hall,
    sync_productions,
    sync_spaces,
  sync_genres,
  sync_galleries,
  sync_items,
  sync_crops,
  sync_event_prices,
  sync_tags,
  sync_uit_keywords,
  sync_uit_themes,
  sync_uit_types,
};
/*

This script will sync the database with the api 
run with:
npx tsx scraper.ts
*/

/**
 * Validates and sanitizes required timestamps (created_at, updated_at).
 * Always returns a valid date - never returns null.
 * @param timestamp - The timestamp string from API
 * @param fallbackDate - Fallback date to use if validation fails (default: 1970-01-01)
 * @returns A valid ISO 8601 timestamp string (never null)
 */
function sanitizeTimestampRequired(timestamp: string | undefined | null, fallbackDate: string = "1970-01-01T00:00:00Z"): string {
  return <string>sanitizeTimestamp(timestamp, fallbackDate);
}

/**
 * Validates and sanitizes optional timestamps (starts_at, ends_at, etc.).
 * Can return null if the timestamp is invalid.
 * @param timestamp - The timestamp string from API
 * @param fallbackDate - Fallback date to use if validation fails (default: null)
 * @returns A valid ISO 8601 timestamp string or null
 */
function sanitizeTimestampOptional(timestamp: string | undefined | null, fallbackDate: string | null = null): string | null {
  return sanitizeTimestamp(timestamp, fallbackDate);
}

function sanitizeTimestamp(timestamp: string | undefined | null, fallbackDate: string | null = null): string | null {
  if (!timestamp) {
    return fallbackDate;
  }

  try {
    const date = new Date(timestamp);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Invalid timestamp "${timestamp}", using fallback`);
      return fallbackDate;
    }

    // Check if year is 0, negative, or unreasonable (before year 1)
    const year = date.getFullYear();
    if (year < 1) {
      console.warn(`Timestamp "${timestamp}" has invalid year ${year}, using fallback`);
      return fallbackDate;
    }

    return date.toISOString();
  } catch (error) {
    console.warn(`Error parsing timestamp "${timestamp}": ${error}, using fallback`);
    return fallbackDate;
  }
}


/*

filter that removes all data before a timestamp

*/
function filterByCutoff<T extends { updated_at: string }>(page: T[], cutoff_timestamp: Date | undefined = undefined): T[] {
  if (!cutoff_timestamp) {
    return page;
  }

  return page.filter((item) => new Date(item.updated_at) > cutoff_timestamp);
}

function mapEvent(event: APIEvent) {
  /*
    Maps an event from the API to the event schema used by Prisma.
    Only scalar fields are included; foreign keys (production_id, status_id, hall_id)
    must be linked separately via their apiId values.
  */

  return {
    apiId: event["@id"],
    created_at: sanitizeTimestampRequired(event.created_at),
    updated_at: sanitizeTimestampRequired(event.updated_at),
    starts_at: sanitizeTimestampOptional(event.starts_at),
    ends_at: sanitizeTimestampOptional(event.ends_at),
    intermission_at: sanitizeTimestampOptional(event.intermission_at),
    doors_at: sanitizeTimestampOptional(event.doors_at),
    box_office_id: event.box_office_id || undefined,
    vendor_id: event.vendor_id || undefined,
    max_tickets_per_order: event.max_tickets_per_order || undefined,
    uitdatabank_id: event.uitdatabank_id || undefined,
    secure: event.secure || undefined,
    sms_verification: event.sms_verification || undefined,
    info: event.info || null,
    eticket_info: event.eticket_info || null,
    external_order_url: event.external_order_url || null,
    order_url: event.order_url || undefined,
    
    // Foreign keys are linked separately:
    // production_id: looked up via event.production (apiId string)
    // status_id: looked up via event.status["@id"] (apiId string)
    // hall_id: looked up via event.hall["@id"] (apiId string)
  };
}


function mapProduction(prod: APIProduction) {
  /*
    Maps a production from the API to the production schema used by Prisma.
    Only scalar fields that exist on the `production` table are returned;
    other relations (genres, events, galleries, etc.) can be handled
    separately if needed.
  */

  return {
      created_at: sanitizeTimestampRequired(prod.created_at),
      updated_at: sanitizeTimestampRequired(prod.updated_at),
      apiId: prod["@id"],
      vendor_id: prod.vendor_id,
      box_office_id: prod.box_office_id,
      performer_field: prod.performer_field,
      performer_type: prod.performer_type,
      attendance_mode: prod.attendance_mode,
      super_title: prod.supertitle,
      title: prod.title,
      artist: prod.artist,
      meta_title: prod.meta_title,
      meta_description: prod.meta_description,
      tagline: prod.tagline,
      teaser: prod.teaser,
      description: prod.description,
      description_extra: prod.description_extra,
      description_2: prod.description_2,
      video_1: prod.video_1,
      video_2: prod.video_2,
      quote: prod.quote,
      quote_source: prod.quote_source,
      programme: prod.programme,
      info: prod.info,
      description_short: prod.description_short,
      eticket_info: prod.eticket_info,
      custom_data: prod.custom_data,

      media_gallery_id: prod.media_gallery,
      review_gallery_id: prod.review_gallery,
      poster_gallery_id: prod.poster_gallery,

    // uitdatabank_type/theme or keyword relations are handled separately.
  };
}

function mapLocation(location:APILocation) {
  /*
    Maps a location from the API to the location schema used by Prisma.
    Only scalar fields are included.
  */
  return {
    created_at: sanitizeTimestampRequired(location.created_at),
    updated_at: sanitizeTimestampRequired(location.updated_at),
    apiId: location["@id"],
    name: location.name,
    code: location.code,
    street: location.street,
    number: location.number,
    postal_code: location.postal_code,
    city: location.city,
    phone_1: location.phone_1,
    phone_2: location.phone_2,
    own_location: location.own_location,
    country: location.country,
    uitdatabank_id: location.uitdatabank_id,
  };
}

function mapSpace(space: APISpace) {
  /*
    Maps a space from the API to the space schema used by Prisma.
    location_id will be looked up via the location apiId.
  */
  return {
    created_at: sanitizeTimestampRequired(space.created_at),
    updated_at: sanitizeTimestampRequired(space.updated_at),
    apiId: space["@id"],
    vendor_id: space.vendor_id,
    name: space.name,
    // location_id: looked up via space.location["@id"] (apiId string)
  };
}

function mapHall(hall: APIHall) {
  /*
    Maps a hall from the API to the hall schema used by Prisma.
    space_id will be looked up via the space apiId.
  */
  return {
    created_at: sanitizeTimestampRequired(hall.created_at),
    updated_at: sanitizeTimestampRequired(hall.updated_at),
    apiId: hall["@id"],
    vendor_id: hall.vendor_id,
    box_office_id: hall.box_office_id,
    seat_selection: hall.seat_selection,
    open_seating: hall.open_seating,
    name: hall.name,
    remark: hall.remark,
    // space_id: looked up via hall.space["@id"] (apiId string)
  };
}

function mapGenre(genre: APIGenre){
  return {
    created_at: sanitizeTimestampRequired(genre.created_at),
    updated_at: sanitizeTimestampRequired(genre.updated_at),
    apiId: genre["@id"],
    type: genre.type,
    use_as: genre.use_as,
    vendor_id: genre.vendor_id,
    name: genre.name,
    slug: genre.slug,
    description: genre.description,
  };
}


function mapGallery(gallery: APIGallery){
  return {
    created_at: sanitizeTimestampRequired(gallery.created_at),
    updated_at: sanitizeTimestampRequired(gallery.updated_at),
    apiId: gallery["@id"],
    name: gallery.name,
  };
}

function mapItem(item: APIItem) {
  return {
    created_at: sanitizeTimestampRequired(item.created_at),
    updated_at: sanitizeTimestampRequired(item.updated_at),
    apiId: item["@id"],
    type: item.type,
    original_filename: item.original_filename,
    position: item.position,
    width: item.width,
    height: item.height,
    format: item.format,

    title: item.title,
    description: item.description,
    credits: item.credits,
    link: item.link,

  }
}

function mapEventPrice(price: APIEventPrice){
  return {
    created_at: sanitizeTimestampRequired(price.created_at),
    updated_at: sanitizeTimestampRequired(price.updated_at),
    apiId: price["@id"],
    available: price.available,
    amount: price.amount,
    box_office_id: price.box_office_id,
    contigent_id: price.contingent_id,
    expires_at: sanitizeTimestampOptional(price.expires_at),
  }
}

function mapTag(tag: APITag){
  return {
    created_at: sanitizeTimestampRequired(tag.created_at),
    updated_at: sanitizeTimestampRequired(tag.updated_at),
    apiId: tag["@id"],
    source: tag.source,
    sourcetype: tag.sourceType,
    enable: tag.enable,
    code: tag.code,
    name: tag.name,
    short_description: tag.short_description,
    url: tag.url,
    url_title: tag.url_title,
    expires_after: tag.expires_after,
    automatically_assigned: tag.automatically_assigned,
    external: tag.external,
    // gallery_id: done separately inside function
  }
}

function mapCrop(crop: APICrop){
  return {
    created_at: sanitizeTimestampRequired(crop.created_at),
    updated_at: sanitizeTimestampRequired(crop.updated_at),
    apiId: crop["@id"],
    name: crop.name,
    url: crop.url,
    // item: link items in function
  }
}

function mapUitKeyword(keyword: APIUitKeyword){
  return {
    created_at: sanitizeTimestampRequired(keyword.created_at),
    updated_at: sanitizeTimestampRequired(keyword.updated_at),
    apiId: keyword["@id"],
    name: keyword.name,
  }
}

function mapUitTheme(theme: APIUitTheme){
  return {
    created_at: sanitizeTimestampRequired(theme.created_at),
    updated_at: sanitizeTimestampRequired(theme.updated_at),
    apiId: theme["@id"],
    name: theme.name,
    cdb_cat_id: theme.cdb_cat_id,
  }
}
function mapUitType(type: APIUitType){
  return {
    created_at: sanitizeTimestampRequired(type.created_at),
    updated_at: sanitizeTimestampRequired(type.updated_at),
    apiId: type["@id"],
    name: type.name,
    cdb_cat_id: type.cdb_cat_id,
  }
}

async function sync_locations(cutoff_timestamp: Date | undefined = undefined) {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchLocationsPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Locations", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      for (const location of page) {


        await tx.location.upsert({
          where: {apiId: location["@id"]},
          update: mapLocation(location),
          create: mapLocation(location),
        });
      }
    });
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} locations from ${pageCount} pages`);
}

async function sync_hall(cutoff_timestamp: Date | undefined = undefined) {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchHallsPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Halls", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      // Collect all space apiIds for bulk lookup
      const spaceApiIds = new Set<string>();
      for (const hall of page) {
        if (hall.space) spaceApiIds.add(hall.space);
      }

      // Fetch all required spaces in bulk
      const spaces = await tx.space.findMany({
        where: { apiId: { in: Array.from(spaceApiIds) } },
        select: { id: true, apiId: true }
      });

      // Create lookup map
      const spaceMap = new Map(spaces.map(s => [s.apiId, s.id]));

      for (const hall of page) {
        const spaceId = hall.space ? spaceMap.get(hall.space) : null;

        await tx.hall.upsert({
          where: { apiId: hall["@id"] },
          update: {
            ...mapHall(hall),
            space_id: spaceId || null
          },
          create: {
            ...mapHall(hall),
            space_id: spaceId || null
          }
        });
      }
    });
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} halls from ${pageCount} pages`);
}

async function sync_spaces(cutoff_timestamp: Date | undefined = undefined) {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchSpacesPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Spaces", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      // Collect all location apiIds for bulk lookup
      const locationApiIds = new Set<string>();
      for (const space of page) {
        if (space.location) locationApiIds.add(space.location);
      }

      // Fetch all required locations in bulk
      const locations = await tx.location.findMany({
        where: { apiId: { in: Array.from(locationApiIds) } },
        select: { id: true, apiId: true }
      });

      // Create lookup map
      const locationMap = new Map(locations.map(l => [l.apiId, l.id]));

      for (const space of page) {
        const locationId = space.location ? locationMap.get(space.location) : null;

        await tx.space.upsert({
          where: { apiId: space["@id"] },
          update: {
            ...mapSpace(space),
            location_id: locationId || null,
          },
          create: {
            ...mapSpace(space),
            location_id: locationId || null,
          }
        });
      }
    });
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} spaces from ${pageCount} pages`);
}

async function sync_events(cutoff_timestamp: Date | undefined = undefined) {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchEventsPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Events", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      // Collect all production and hall apiIds for bulk lookup
      const productionApiIds = new Set<string>();
      const hallApiIds = new Set<string>();
      for (const event of page) {
        if (event.production?.["@id"]) productionApiIds.add(event.production["@id"]);
        if (event.hall) hallApiIds.add(event.hall);
      }

      // Fetch all required productions and halls in bulk
      const [productions, halls] = await Promise.all([
        tx.production.findMany({
          where: { apiId: { in: Array.from(productionApiIds) } },
          select: { id: true, apiId: true }
        }),
        tx.hall.findMany({
          where: { apiId: { in: Array.from(hallApiIds) } },
          select: { id: true, apiId: true }
        })
      ]);

      // Create lookup maps
      const productionMap = new Map(productions.map(p => [p.apiId, p.id]));
      const hallMap = new Map(halls.map(h => [h.apiId, h.id]));

      for (const event of page) {
        const productionId = event.production?.["@id"] ? productionMap.get(event.production["@id"]) : null;
        
        // Original logic: skip the event if there is no production connected to it in the DB
        if (!productionId){
          totalProcessed -= 1;
          continue;
        }

        const hallId = event.hall ? hallMap.get(event.hall) : null;

        await tx.event.upsert({
          where: { apiId: event["@id"] },
          update: {
            ...mapEvent(event),
            production_id: productionId,
            hall_id: hallId || null,
          },
          create: {
            ...mapEvent(event),
            production_id: productionId,
            hall_id: hallId || null,
          }
        });
      }
    });
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} events from ${pageCount} pages`);
}

async function sync_productions(cutoff_timestamp: Date | undefined = undefined) {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchProductionsPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Productions", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      // Collect all apiIds for lookups to avoid N+1 queries
      const galleryIds = new Set<string>();
      const themeIds = new Set<string>();
      const typeIds = new Set<string>();
      const keywordIds = new Set<string>();
      const genreIds = new Set<string>();

      for (const prod of page) {
        if (prod.media_gallery) galleryIds.add(prod.media_gallery);
        if (prod.poster_gallery) galleryIds.add(prod.poster_gallery);
        if (prod.review_gallery) galleryIds.add(prod.review_gallery);
        if (prod.uitdatabank_theme) themeIds.add(prod.uitdatabank_theme);
        if (prod.uitdatabank_type) typeIds.add(prod.uitdatabank_type);
        if (prod.uitdatabank_keywords) {
          prod.uitdatabank_keywords.forEach(k => keywordIds.add(k));
        }
        if (prod.genres) {
          prod.genres.forEach(g => genreIds.add(g));
        }
      }

      // Fetch all required relations in bulk
      const [galleries, themes, types, keywords, genres] = await Promise.all([
        tx.gallery.findMany({ where: { apiId: { in: Array.from(galleryIds) } } }),
        tx.uitdatabank_theme.findMany({ where: { apiId: { in: Array.from(themeIds) } } }),
        tx.uitdatabank_type.findMany({ where: { apiId: { in: Array.from(typeIds) } } }),
        tx.uitdatabank_keyword.findMany({ where: { apiId: { in: Array.from(keywordIds) } } }),
        tx.genre.findMany({ where: { apiId: { in: Array.from(genreIds) } } }),
      ]);

      // Create lookup maps
      const galleryMap = new Map(galleries.map(g => [g.apiId, g.id]));
      const themeMap = new Map(themes.map(t => [t.apiId, t.id]));
      const typeMap = new Map(types.map(t => [t.apiId, t.id]));
      const keywordMap = new Map(keywords.map(k => [k.apiId, k.id]));
      const genreMap = new Map(genres.map(g => [g.apiId, g.id]));

      for (const production of page) {
        const db_production = await tx.production.upsert({
          where: {apiId: production["@id"]},
          update: {
            ...mapProduction(production),
            media_gallery_id: production.media_gallery ? galleryMap.get(production.media_gallery) : null,
            poster_gallery_id: production.poster_gallery ? galleryMap.get(production.poster_gallery) : null,
            review_gallery_id: production.review_gallery ? galleryMap.get(production.review_gallery) : null,
            uitdatabank_theme: production.uitdatabank_theme ? themeMap.get(production.uitdatabank_theme) : null,
            uitdatabank_type: production.uitdatabank_type ? typeMap.get(production.uitdatabank_type) : null,
          },
          create: {
            ...mapProduction(production),
            media_gallery_id: production.media_gallery ? galleryMap.get(production.media_gallery) : null,
            poster_gallery_id: production.poster_gallery ? galleryMap.get(production.poster_gallery) : null,
            review_gallery_id: production.review_gallery ? galleryMap.get(production.review_gallery) : null,
            uitdatabank_theme: production.uitdatabank_theme ? themeMap.get(production.uitdatabank_theme) : null,
            uitdatabank_type: production.uitdatabank_type ? typeMap.get(production.uitdatabank_type) : null,
          },
        })

        // Link keywords
        if (production.uitdatabank_keywords) {
          for (const keyword of production.uitdatabank_keywords) {
            const keywordId = keywordMap.get(keyword);
            if (keywordId) {
              await tx.uit_keywords_production.upsert({
                where: {
                  production_id_uitkeywords_id: {
                    production_id: db_production.id,
                    uitkeywords_id: keywordId
                  }
                },
                update: {}, // exists, no update needed
                create: {
                  production_id: db_production.id,
                  uitkeywords_id: keywordId
                },
              });
            }
          }
        }

        // Link genres
        if (production.genres) {
          for (const genre of production.genres) {
            const genreId = genreMap.get(genre);
            if (genreId) {
              await tx.genre_production.upsert({
                where: {
                  genre_id_production_id: {
                    genre_id: genreId,
                    production_id: db_production.id,
                  }
                },
                update: {}, // exists, no update needed
                create: {
                  production_id: db_production.id,
                  genre_id: genreId,
                }
              });
            }
          }
        }
      }
    });
    }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} productions from ${pageCount} pages`);
}



async function sync_genres(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchGenrePages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Genres", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(
        page.map(genre =>
            prisma.genre.upsert({
              where: { apiId: genre["@id"] },
              update: mapGenre(genre),
              create: mapGenre(genre),
            })
        )
    );
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} genres from ${pageCount} pages`);
}


async function sync_galleries(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchGalleryPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Galleries", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      // Collect all item apiIds from all galleries in the page
      const itemApiIds = new Set<string>();
      for (const gallery of page) {
        if (gallery.items) {
          gallery.items.forEach(itemId => itemApiIds.add(itemId));
        }
      }

      // Bulk fetch all required items
      const db_all_items = await tx.item.findMany({
        where: { apiId: { in: Array.from(itemApiIds) } },
        select: { id: true, apiId: true }
      });

      // Create lookup map
      const itemMap = new Map(db_all_items.map(i => [i.apiId, i.id]));

      for (const gallery of page) {
        // Map the apiIds of this specific gallery to their internal database IDs
        const galleryItemIds = gallery.items 
          ? gallery.items
              .map(apiId => itemMap.get(apiId))
              .filter((id): id is string => typeof id === 'string')
          : [];

        await tx.gallery.upsert({
          where: {apiId: gallery["@id"]},
          update: {
            ...mapGallery(gallery),
            items: galleryItemIds.length > 0
                ? { connect: galleryItemIds.map(id => ({ id })) }
                : undefined,
          },
          create: {
            ...mapGallery(gallery),
            items: galleryItemIds.length > 0
                ? { connect: galleryItemIds.map(id => ({ id })) }
                : undefined,
          }
        });
      }
    });
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} galleries from ${pageCount} pages`);
}


async function sync_items(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchItemPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Items", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      // Collect all crop apiIds from all items in the page
      const cropApiIds = new Set<string>();
      for (const item of page) {
        if (item.crops) {
          item.crops.forEach(crop => cropApiIds.add(crop["@id"]));
        }
      }

      // Bulk fetch all required crops
      const db_all_crops = await tx.crop.findMany({
        where: { apiId: { in: Array.from(cropApiIds) } },
        select: { id: true, apiId: true }
      });

      // Create lookup map
      const cropMap = new Map(db_all_crops.map(c => [c.apiId, c.id]));

      for (const item of page) {
        // Map the apiIds of this specific item's crops to their internal database IDs
        const itemCropIds = item.crops
          ? item.crops
              .map(crop => cropMap.get(crop["@id"]))
              .filter((id): id is string => typeof id === 'string')
          : [];

        await tx.item.upsert({
          where: {apiId: item["@id"]},
          update: {
            ...mapItem(item),
            crops: itemCropIds.length > 0
                ? { connect: itemCropIds.map(id => ({ id })) }
                : undefined
          },
          create: {
            ...mapItem(item),
            crops: itemCropIds.length > 0
                ? { connect: itemCropIds.map(id => ({ id })) }
                : undefined
          }
        });
      }
    });
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} items from ${pageCount} pages`);
}

async function sync_event_prices(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchEventPricePages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Prices", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
          // Collect all event apiIds for bulk lookup
          const eventApiIds = new Set<string>();
          for (const price of page) {
            if (price.event) eventApiIds.add(price.event);
          }

          // Fetch all required events in bulk
          const db_events = await tx.event.findMany({
            where: { apiId: { in: Array.from(eventApiIds) } },
            select: { id: true, apiId: true }
          });

          // Create lookup map
          const eventMap = new Map(db_events.map(e => [e.apiId, e.id]));

          for (const price of page) {
            const eventId = price.event ? eventMap.get(price.event) : null;

            await tx.event_price.upsert({
              where: {apiId: price["@id"]},
              update: {
                ...mapEventPrice(price),
                event_id: eventId || null,
              },
              create: {
                ...mapEventPrice(price),
                event_id: eventId || null,
              },
            });
          }
        }
    );
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} event_prices from ${pageCount} pages`);
}

async function sync_tags(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchTagPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Tags", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
          // Collect all gallery apiIds for bulk lookup
          const galleryApiIds = new Set<string>();
          for (const tag of page) {
            if (tag.gallery) galleryApiIds.add(tag.gallery);
          }

          // Fetch all required galleries in bulk
          const db_galleries = await tx.gallery.findMany({
            where: { apiId: { in: Array.from(galleryApiIds) } },
            select: { id: true, apiId: true }
          });

          // Create lookup map
          const galleryMap = new Map(db_galleries.map(g => [g.apiId, g.id]));

          for (const tag of page) {
            const galleryId = tag.gallery ? galleryMap.get(tag.gallery) : null;

            await tx.tag.upsert({
              where: {apiId: tag["@id"]},
              update: {
                ...mapTag(tag),
                gallery_id: galleryId || null,
              },
              create: {
                ...mapTag(tag),
                gallery_id: galleryId || null,
              },
            });
          }
        }
    );
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} tags from ${pageCount} pages`);
}

async function sync_crops(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchCropPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Crops", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(
        page.map(crop =>
            prisma.crop.upsert({
              where: {apiId: crop["@id"]},
              update: mapCrop(crop),
              create: mapCrop(crop),
            })
        )
    );
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} crops from ${pageCount} pages`);
}

async function sync_uit_keywords(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchUitKeywordPages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Keywords", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(
        page.map(keyword =>
            prisma.uitdatabank_keyword.upsert({
              where: {apiId: keyword["@id"]},
              update: mapUitKeyword(keyword),
              create: mapUitKeyword(keyword),
            })
        )
    );
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} keywords from ${pageCount} pages`);
}


async function sync_uit_themes(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchUitThemePages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Themes", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(
        page.map(theme =>
            prisma.uitdatabank_theme.upsert({
              where: {apiId: theme["@id"]},
              update: mapUitTheme(theme),
              create: mapUitTheme(theme),
            })
        )
    );
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} themes from ${pageCount} pages`);
}


async function sync_uit_types(cutoff_timestamp: Date | undefined = undefined){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const { members: rawPage, totalItems } of Fetcher.fetchUitTypePages(cutoff_timestamp)) {
    pageCount++;
    totalProcessed += rawPage.length;
    updateStatus("Types", createProgressBar(totalProcessed, totalItems));

    if (rawPage.length === 0) break;
    const page = filterByCutoff(rawPage, cutoff_timestamp);

    await prisma.$transaction(
        page.map(type =>
            prisma.uitdatabank_type.upsert({
              where: {apiId: type["@id"]},
              update: mapUitType(type),
              create: mapUitType(type),
            })
        )
    );
  }

  finishStatus(`\u2705 Completed syncing ${totalProcessed} types from ${pageCount} pages`);
}


