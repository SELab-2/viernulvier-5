import { prisma } from "./prisma";

import * as Fetcher from "./fetcher"
import { id } from "zod/v4/locales";
import { create } from "domain";

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
import { uuid } from "zod/v4";
/*

This script will sync the database with the api 
run with:
npx tsx scraper.ts
*/

function mapEvent(event: APIEvent) {
  /*
    Maps an event from the API to the event schema used by Prisma.
    Only scalar fields are included; foreign keys (production_id, status_id, hall_id)
    must be linked separately via their apiId values.
  */

  return {
    apiId: event["@id"],
    created_at: event.created_at,
    updated_at: event.updated_at,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    intermission_at: event.intermission_at,
    doors_at: event.doors_at,
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
      created_at: prod.created_at,
      updated_at: prod.updated_at,
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

async function sync_events() {

  const events = await Fetcher.fetchEvents();

  console.log(`Fetched ${events.length} events`);

  await prisma.$transaction(async (tx) => {
    for (const event of events) {

      // to link the production
      const production = await prisma.production.findUnique({
        where: { apiId: event.production["@id"] }
      });
      
      await tx.event.upsert({
        where: { apiId: event["@id"] },
        update: {
          ...mapEvent(event),
          production_id: production?.id
        },
        create: {
          ...mapEvent(event),
          production_id: production?.id
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
  // ORDER is important here!!!! 
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