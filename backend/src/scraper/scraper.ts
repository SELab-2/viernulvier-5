import { prisma } from "./prisma";

import {existsSync,readFileSync, writeFileSync } from 'fs';
import * as Fetcher from "./fetcher"

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

let cutoff_timestamp = new Date(0);

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

    // genre_production link moet nog gemaakt worden

  };
}


function mapGallery(gallery: APIGallery){
  return {
    created_at: sanitizeTimestampRequired(gallery.created_at),
    updated_at: sanitizeTimestampRequired(gallery.updated_at),
    apiId: gallery["@id"],
    name: gallery.name,
    // gallery_item moet nog gemaakt worden

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
    //gallery: item.gallery, // is this something different than the APIs gallery?
    title: item.title,
    description: item.description,
    credits: item.credits,
    link: item.link,
    // crops have to be separate
    // gallery_items still have to be created
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
    contingent_id: price.contingent_id,
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
    tag: tag.url_title,
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

async function sync_locations() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchLocationsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} locations`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      for (const location of page) {


        await tx.location.upsert({
          where: {apiId: location["@id"]},
          update: mapLocation(location),
          create: mapLocation(location),
        });
      }
    });

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} locations from ${pageCount} pages`);
}

async function sync_hall() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchHallsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} halls`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      for (const hall of page) {

        // link the space
        let space = null;
        if (hall.space) {
          space = await tx.space.findUnique({
            where: { apiId: hall.space}
          });
        }

        await tx.hall.upsert({
          where: { apiId: hall["@id"] },
          update: {
            ...mapHall(hall),
            space_id: space?.id || null
          },
          create: {
            ...mapHall(hall),
            space_id: space?.id || null
          }
        });
      }
    });

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} halls from ${pageCount} pages`);
}

async function sync_spaces() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchSpacesPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} spaces`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      for (const space of page) {

        // to link the location
        const location = await tx.location.findUnique({
          where: { apiId: space.location}
        });


        await tx.space.upsert({
          where: { apiId: space["@id"] },
          update: {
            ...mapSpace(space),
            location_id: location?.id,
          },
          create: {
            ...mapSpace(space),
            location_id: location?.id,
          }
        });
      }
    });

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} spaces from ${pageCount} pages`);
}

async function sync_events() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchEventsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} events`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      for (const event of page) {

        // to link the production
        const production = await tx.production.findUnique({
          where: { apiId: event.production["@id"] }
        });

        const hall = await tx.hall.findUnique({
          where: { apiId: event.hall}
        });

        await tx.event.upsert({
          where: { apiId: event["@id"] },
          update: {
            ...mapEvent(event),
            production_id: production?.id,
            hall_id: hall?.id,
          },
          create: {
            ...mapEvent(event),
            production_id: production?.id,
            hall_id: hall?.id,
          }
        });
      }
    });

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} events from ${pageCount} pages`);
}

async function sync_productions() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchProductionsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} productions`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      for (const production of page) {

        let media_gallery = null
        if (production.media_gallery) {
          media_gallery = await tx.gallery.findUnique({
            where: {apiId: production.media_gallery}
          });
        }

        let poster_gallery = null
        if (production.poster_gallery) {
          poster_gallery = await tx.gallery.findUnique({
            where: {apiId: production.poster_gallery}
          });
        }

        let review_gallery = null
        if (production.review_gallery) {
          review_gallery = await tx.gallery.findUnique({
            where: {apiId: production.review_gallery}
          });
        }

        let uitdatabank_theme = null
        if (production.uitdatabank_theme) {
          uitdatabank_theme = await tx.uitdatabank_theme.findUnique({
            where: {apiId: production.uitdatabank_theme}
          });
        }

        let uitdatabank_type = null
        if (production.uitdatabank_type) {
          uitdatabank_type = await tx.uitdatabank_type.findUnique({
            where: {apiId: production.uitdatabank_type}
          });
        }


        const db_production = await tx.production.upsert({
          where: {apiId: production["@id"]},
          update: {
            ...mapProduction(production),
            media_gallery_id: media_gallery?.id || null,
            poster_gallery_id: poster_gallery?.id || null,
            review_gallery_id: review_gallery?.id || null,
            uitdatabank_theme: uitdatabank_theme?.id || null,
            uitdatabank_type: uitdatabank_type?.id || null,
          },
          create: {
            ...mapProduction(production),
            media_gallery_id: media_gallery?.id || null,
            poster_gallery_id: poster_gallery?.id || null,
            review_gallery_id: review_gallery?.id || null,
            uitdatabank_theme: uitdatabank_theme?.id || null,
            uitdatabank_type: uitdatabank_type?.id || null,
          },
        })

        //uit_keywords_production table
        for (const keyword of production.uitdatabank_keywords) {
          let uitdatabank_keyword = undefined
          if (production.uitdatabank_type) {
            uitdatabank_keyword = await tx.uitdatabank_keyword.findUnique({
              where: {apiId: keyword}
            });
          }

          if (uitdatabank_keyword !== undefined) {
            await tx.uit_keywords_production.upsert({
              where: {
                production_id_uitkeywords_id: {
                  production_id: db_production.id,
                  uitkeywords_id: uitdatabank_keyword!.id
                }
              },
              update: {}, // if it already exists, you don't need to update it
              create: {
                production_id: db_production.id,
                uitkeywords_id: uitdatabank_keyword!.id
              },
            });
          }
        }

        for (const genre of production.genres) {
          let db_genre = undefined
          if (production.genres) {
            db_genre = await tx.genre.findUnique({
              where: {apiId: genre}
            });
          }
          if (db_genre !== undefined) {
            await tx.genre_production.upsert({
              where: {
                genre_id_production_id: {
                  genre_id: db_genre!.id,
                  production_id: db_production.id,
                }
              },
              update: {}, // if it already exists, you don't need to update it
              create: {
                production_id: db_production.id,
                genre_id: db_genre!.id,
              }
            });
          }
        }
      }
    });
    totalProcessed += page.length;
    }

  console.log(`Completed syncing ${totalProcessed} productions from ${pageCount} pages`);
}

async function sync_genres(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchGenrePages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} genres`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(
        page.map(genre =>
            prisma.genre.upsert({
              where: { apiId: genre["@id"] },
              update: mapGenre(genre),
              create: mapGenre(genre),
            })
        )
    );

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} genres from ${pageCount} pages`);
}


async function sync_galleries(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchGalleryPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} galleries`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
      for (const gallery of page) {


        let db_items = null;
        if (gallery.items) {
            db_items = await tx.item.findMany({
            where: {apiId: {in: gallery.items}},
          });
        }



        await prisma.gallery.upsert({
          where: {apiId: gallery["@id"]},
          update: {
            ...mapGallery(gallery),
            items: db_items
                ? {connect: db_items.map((item) => ({ id: item.id }))}
                : undefined,
          },
          create: {
            ...mapGallery(gallery),
            items: db_items
                ? {connect: db_items.map((item) => ({ id: item.id }))}
                : undefined,
          }
        })


      }
    });




    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} galleries from ${pageCount} pages`);
}


async function sync_items(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchItemPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} items`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);


    await prisma.$transaction(async (tx) => {
      for (const item of page) {


        const apiIds = item.crops.map(crop => crop["@id"]);
        let db_crops: any[] = [];
        if (item.crops && item.crops.length !== 0) {
           db_crops = await tx.crop.findMany({
            where: {apiId: {in: apiIds}},
            select: {id: true},
          });


        }

        await prisma.item.upsert({
          where: {apiId: item["@id"]},
          update: {
            ...mapItem(item),
            crops: db_crops.length > 0
                ? {connect: db_crops.map((crop) => ({ id: crop.id }))}
                : undefined

          },
          create: {
            ...mapItem(item),
            crops: db_crops.length > 0
                ? {connect: db_crops.map((crop) => ({ id: crop.id }))}
                : undefined
          }
        });


      }
    });

    totalProcessed += page.length;

  }

  console.log(`Completed syncing ${totalProcessed} items from ${pageCount} pages`);
}

async function sync_event_prices(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchEventPricePages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} event_prices`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);


    await prisma.$transaction(async (tx) => {
          for (const price of page) {

            let event = null
            if (price.event) {
                event = await tx.event.findUnique({
                where: {apiId: price.event}
              });
            }

            prisma.event_price.upsert({
              where: {apiId: price["@id"]},
              update: {
                ...mapEventPrice(price),
                event_id: event?.id || null,
              },
              create: {
                ...mapEventPrice(price),
                event_id: event?.id || null,
              },
            });
          }
        }
    );

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} event_prices from ${pageCount} pages`);
}

async function sync_tags(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchTagPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} tags`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(async (tx) => {
          for (const tag of page) {

            let gallery = null;
            if (tag.gallery) {
                gallery = await tx.gallery.findUnique({
                where: {apiId: tag.gallery}
              });
            }

            prisma.event_price.upsert({
              where: {apiId: tag["@id"]},
              update: {
                ...mapTag(tag),
                event_id: gallery?.id || null,
              },
              create: {
                ...mapTag(tag),
                event_id: gallery?.id || null,
              },
            });
          }
        }
    );

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} tags from ${pageCount} pages`);
}

async function sync_crops(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchCropPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} crops`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(
        page.map(crop =>
            prisma.crop.upsert({
              where: {apiId: crop["@id"]},
              update: mapCrop(crop),
              create: mapCrop(crop),
            })
        )
    );


    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} crops from ${pageCount} pages`);
}

async function sync_uit_keywords(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchUitKeywordPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} keywords`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(
        page.map(keyword =>
            prisma.uitdatabank_keyword.upsert({
              where: {apiId: keyword["@id"]},
              update: mapUitKeyword(keyword),
              create: mapUitKeyword(keyword),
            })
        )
    );


    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} keywords from ${pageCount} pages`);
}


async function sync_uit_themes(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchUitThemePages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} themes`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(
        page.map(theme =>
            prisma.uitdatabank_theme.upsert({
              where: {apiId: theme["@id"]},
              update: mapUitTheme(theme),
              create: mapUitTheme(theme),
            })
        )
    );


    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} themes from ${pageCount} pages`);
}


async function sync_uit_types(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (let page of Fetcher.fetchUitTypePages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} themes`);

    if (page.length === 0) break;
    page = page.filter(item => new Date(item.updated_at) > cutoff_timestamp);

    await prisma.$transaction(
        page.map(type =>
            prisma.uitdatabank_type.upsert({
              where: {apiId: type["@id"]},
              update: mapUitType(type),
              create: mapUitType(type),
            })
        )
    );


    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} themes from ${pageCount} pages`);
}





async function main() {
  if (existsSync('scraper_timestamp.txt')) {
    const read_timestamp = readFileSync('scraper_timestamp.txt', 'utf-8');
    const ts = new Date(read_timestamp);
    if ((ts.getTime())) {
      cutoff_timestamp = ts;
      console.log('Timestamp read from file:', cutoff_timestamp);
    } else {
      console.log('unable to read timestamp from file, reverted to standard:', cutoff_timestamp);
    }
  } else {
    console.log('unable to read timestamp from file, reverted to standard:', cutoff_timestamp);
  }
  const timestamp = new Date().toISOString();

  // locations
  await sync_locations();
  await sync_spaces();
  await sync_hall();

  // Uitdatabank
  await sync_uit_keywords();
  await sync_uit_themes();
  await sync_uit_types();


  // productions
  await sync_crops();
  await sync_items();
  await sync_galleries()
  await sync_genres();
  await sync_productions();
  await sync_events();
  await sync_event_prices();
  await sync_tags();

  // overwrite the timestamp after everything is done in case it errors
  writeFileSync('scraper_timestamp.txt', timestamp);
  console.log('Timestamp written to scraper_timestamp.txt:', timestamp);

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });