import { prisma } from "./prisma";

import * as Fetcher from "./fetcher"

import type {
  APIProduction,
  APIEvent,
  APISpace,
  APIHall,
  APILocation, APIGenre, APIGallery, APIItem,
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
    //gallery: item.gallery, // this is something different than the APIs gallery?
    title: item.title,
    description: item.description,
    credits: item.credits,
    link: item.link,
    // crops have to be separate
    // gallery_items still have to be created
  }
}





// function mapStatus(status: APIStatus) {
//   /*
//     Maps a status from the API to the status schema used by Prisma.
//     Only scalar fields are included.
//   */
//   return {
//     created_at: sanitizeTimestampRequired(status.created_at),
//     updated_at: sanitizeTimestampRequired(status.updated_at),
//     apiId: status["@id"],
//     name: status.name,
//     short_name: status.short_name,
//     fixed: status.fixed,
//     visible: status.visible,
//     bookable: status.bookable,
//   };
// }


async function sync_locations() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const page of Fetcher.fetchLocationsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} locations`);

    if (page.length === 0) break;

    await prisma.$transaction(
      page.map(location =>
        prisma.location.upsert({
          where: { apiId: location["@id"] },
          update: mapLocation(location),
          create: mapLocation(location),
        })
      )
    );

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} locations from ${pageCount} pages`);
}

async function sync_hall() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const page of Fetcher.fetchHallsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} halls`);

    if (page.length === 0) break;

    await prisma.$transaction(async (tx) => {
      for (const hall of page) {

        // link the space
        const spaceApiId = hall.space;

        let space = null;
        if (spaceApiId) {
          space = await tx.space.findUnique({
            where: { apiId: spaceApiId }
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

  for await (const page of Fetcher.fetchSpacesPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} spaces`);

    if (page.length === 0) break;

    await prisma.$transaction(async (tx) => {
      for (const space of page) {

        // to link the location
        const location = await tx.location.findUnique({
          where: { apiId: space.location }
        });

        await tx.space.upsert({
          where: { apiId: space["@id"] },
          update: {
            ...mapSpace(space),
            location_id: location?.id
          },
          create: {
            ...mapSpace(space),
            location_id: location?.id
          }
        });
      }
    });

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} spaces from ${pageCount} pages`);
}
//
// async function sync_status() {
//
//   let totalProcessed = 0;
//   let pageCount = 0;
//
//   for await (const page of Fetcher.fetchStatusesPages()) {
//     pageCount++;
//     console.log(`Processing page ${pageCount} with ${page.length} statuses`);
//
//     if (page.length === 0) break;
//
//     await prisma.$transaction(
//       page.map(status =>
//         prisma.status.upsert({
//           where: { apiId: status["@id"] },
//           update: mapStatus(status),
//           create: mapStatus(status),
//         })
//       )
//     );
//
//     totalProcessed += page.length;
//   }
//
//   console.log(`Completed syncing ${totalProcessed} statuses from ${pageCount} pages`);
// }

async function sync_events() {

  let totalProcessed = 0;
  let pageCount = 0;

  for await (const page of Fetcher.fetchEventsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} events`);

    if (page.length === 0) break;

    await prisma.$transaction(async (tx) => {
      for (const event of page) {

        // to link the production
        const production = await tx.production.findUnique({
          where: { apiId: event.production["@id"] }
        });

        const hall = await tx.hall.findUnique({
          where: { apiId: event.hall }
        });

        // const status = await tx.status.findUnique({
        //   where: { apiId: event.status }
        // });

        await tx.event.upsert({
          where: { apiId: event["@id"] },
          update: {
            ...mapEvent(event),
            production_id: production?.id,
            hall_id: hall?.id,
            // status_id: status?.id
          },
          create: {
            ...mapEvent(event),
            production_id: production?.id,
            hall_id: hall?.id,
            // status_id: status?.id
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

  for await (const page of Fetcher.fetchProductionsPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} productions`);

    if (page.length === 0) break;

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


        await tx.production.upsert({
          where: {apiId: production["@id"]},
          update: {
            ...mapProduction(production),
            media_gallery_id: media_gallery?.id || null,
            poster_gallery_id: poster_gallery?.id || null,
            review_gallery_id: review_gallery?.id || null,
          },

          create: {
            ...mapProduction(production),
            media_gallery_id: media_gallery?.id || null,
            poster_gallery_id: poster_gallery?.id || null,
            review_gallery_id: review_gallery?.id || null,
          },
        })
      }
    });

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} productions from ${pageCount} pages`);
}

async function sync_genres(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const page of Fetcher.fetchGenrePages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} genres`);

    if (page.length === 0) break;

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

  for await (const page of Fetcher.fetchGalleryPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} galleries`);

    if (page.length === 0) break;

    await prisma.$transaction(async (tx) => {
      for (const gallery of page) {


        const items = await tx.item.findMany({
          where: {apiId: { in: gallery.items}},
          select: { id: true },
        });



        const db_gallery = await prisma.gallery.upsert({
          where: {apiId: gallery["@id"]},
          update: mapGallery(gallery),
          create: mapGallery(gallery),
        })

        // gallery_item table
        if (items.length !== 0) {
          for (const item of items) {
            await prisma.gallery_item.upsert({
              where: {
                gallery_id_item_id: {
                  gallery_id: db_gallery.id,
                  item_id: item.id,
                },
              },
              update: {}, // if theyre already connected you don't have to update them//}
              create: {
                gallery_id: db_gallery.id,
                item_id: item.id,
              },
            });
          }
        }
      }
    });




    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} galleries from ${pageCount} pages`);
}

async function sync_items(){
  let totalProcessed = 0;
  let pageCount = 0;

  for await (const page of Fetcher.fetchItemPages()) {
    pageCount++;
    console.log(`Processing page ${pageCount} with ${page.length} items`);

    if (page.length === 0) break;

    await prisma.$transaction(
        page.map(item =>
            prisma.item.upsert({
              where: { apiId: item["@id"] },
              update: mapItem(item),
              create: mapItem(item),
            })
        )
    );

    totalProcessed += page.length;
  }

  console.log(`Completed syncing ${totalProcessed} items from ${pageCount} pages`);
}




async function main() {
  // locations
  await sync_locations();
  await sync_spaces();
  await sync_hall();

  // statuses
  // await sync_status();

  // productions
  await sync_items()
  await sync_galleries()
  await sync_productions();
  await sync_events();
  await sync_genres();

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