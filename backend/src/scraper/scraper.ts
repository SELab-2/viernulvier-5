import { prisma } from "./prisma";

import * as Fetcher from "./fetcher"

import type {
  APIProduction,
  APIEvent,
  APIEventPrice,
  APIRank,
  APISpace,
  APIHall,
  APILocation,
  APIPriceType,
  APIStatus,
  LocalizedString,
  foreignKey
} from "./APItypes";

/*

This script will sync the database with the api 
run with:
npx tsx scraper.ts
*/

/**
 * Validates and sanitizes timestamps from API data.
 * If the timestamp has an invalid or negative year, uses a fallback date.
 * @param timestamp - The timestamp string from API
 * @param fallbackDate - Fallback date to use if validation fails (default: 1970-01-01)
 * @returns A valid ISO 8601 timestamp string
 */
function sanitizeTimestamp(timestamp: string | undefined | null, fallbackDate: string = "1970-01-01T00:00:00Z"): string {
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
    created_at: sanitizeTimestamp(event.created_at),
    updated_at: sanitizeTimestamp(event.updated_at),
    starts_at: sanitizeTimestamp(event.starts_at),
    ends_at: sanitizeTimestamp(event.ends_at),
    intermission_at: sanitizeTimestamp(event.intermission_at),
    doors_at: sanitizeTimestamp(event.doors_at),
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
      created_at: sanitizeTimestamp(prod.created_at),
      updated_at: sanitizeTimestamp(prod.updated_at),
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

      // media_gallery_id: prod.media_gallery,
      // review_gallery_id: prod.review_gallery,
      // poster_gallery_id: prod.poster_gallery,

    // uitdatabank_type/theme or keyword relations are handled separately.
  };
}

function mapLocation(location:APILocation) {
  /*
    Maps a location from the API to the location schema used by Prisma.
    Only scalar fields are included.
  */
  return {
    created_at: sanitizeTimestamp(location.created_at),
    updated_at: sanitizeTimestamp(location.updated_at),
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
    created_at: sanitizeTimestamp(space.created_at),
    updated_at: sanitizeTimestamp(space.updated_at),
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
    created_at: sanitizeTimestamp(hall.created_at),
    updated_at: sanitizeTimestamp(hall.updated_at),
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

function mapStatus(status: APIStatus) {
  /*
    Maps a status from the API to the status schema used by Prisma.
    Only scalar fields are included.
  */
  return {
    created_at: sanitizeTimestamp(status.created_at),
    updated_at: sanitizeTimestamp(status.updated_at),
    apiId: status["@id"],
    name: status.name,
    short_name: status.short_name,
    fixed: status.fixed,
    visible: status.visible,
    bookable: status.bookable,
  };
}


async function sync_locations() {

  const locations = await Fetcher.fetchLocations();

  console.log(`Fetched ${locations.length} locations`);

  await prisma.$transaction(locations.map((location) => prisma.location.upsert(
    {
      where: {apiId: location["@id"]},
      update: mapLocation(location),
      create: mapLocation(location),
    }
  )));
}

async function sync_hall() {

  const halls = await Fetcher.fetchHalls();

  console.log(`Fetched ${halls.length} halls`);

  await prisma.$transaction(async (tx) => {
    for (const hall of halls) {

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
}

async function sync_spaces() {

  const spaces = await Fetcher.fetchSpaces();

  console.log(`Fetched ${spaces.length} spaces`);

  await prisma.$transaction(async (tx) => {
    for (const space of spaces) {

      // to link the location
      const location = await prisma.location.findUnique({
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
}

async function sync_status() {

  const statuses = await Fetcher.fetchStatuses();

  console.log(`Fetched ${statuses.length} statuses`);

  await prisma.$transaction(
    statuses.map(status =>
      prisma.status.upsert({
        where: { apiId: status["@id"] },
        update: mapStatus(status),
        create: mapStatus(status),
      })
    )
  );
}

async function sync_events() {

  const events = await Fetcher.fetchEvents();

  console.log(`Fetched ${events.length} events`);

  await prisma.$transaction(async (tx) => {
    for (const event of events) {

      // to link the production
      const production = await tx.production.findUnique({
        where: { apiId: event.production["@id"] }
      });
      
      const hall = await tx.hall.findUnique({
        where: { apiId: event.hall }
      });

      const status = await tx.status.findUnique({
        where: { apiId: event.status }
      });

      await tx.event.upsert({
        where: { apiId: event["@id"] },
        update: {
          ...mapEvent(event),
          production_id: production?.id,
          hall_id: hall?.id,
          status_id: status?.id
        },
        create: {
          ...mapEvent(event),
          production_id: production?.id,
          hall_id: hall?.id,
          status_id: status?.id
        }
      });
    }
  });
}

async function sync_productions() {
  
  const productions = await Fetcher.fetchProductions();

  console.log(`Fetched ${productions.length} productions`);


  // we use upsert because it wil create if a production with the same apiID doesn't exist, else it will update
  await prisma.$transaction(
    productions.map(production =>
      prisma.production.upsert({
      where: {apiId: production["@id"]},
      update: mapProduction(production),
      create: mapProduction(production),
      })
    )
  );

  //Link events 
}


async function main() {
  // locations
  await sync_locations();
  await sync_spaces();
  await sync_hall();

  // statuses
  await sync_status();

  // proodcutions
  await sync_productions();
  await sync_events();
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