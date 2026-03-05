import { prisma } from "./prisma";

import * as Fetcher from "./fetcher"
import { id } from "zod/v4/locales";

/*

This script will sync the database with the api 
run with:
npx tsx scraper.ts
*/


function mapProduction(prod: Fetcher.APIProduction) {
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

async function sync_productions() {
  
  const productions = await Fetcher.fetchProductions();

  console.log(`Fetched ${productions.length} productions`);

  const ids = productions.map(e => e["@id"]);

  const existing = await prisma.production.findMany({
  where: {
    apiId: { in: productions.map(e => e["@id"]) }
  },
    select: { apiId: true }
  });
  
  const existingIds = new Set(existing.map(e => e.apiId));
  
  const toCreate = [];
  const toUpdate = [];

  for (const production of productions) {
  if (existingIds.has(production["@id"])) {
    toUpdate.push(production);
  } else {
    toCreate.push(production);
  }
  }
  console.log(toCreate.length);
  console.log(toUpdate.length);
  
  await prisma.production.createMany({
    data: toCreate.map(mapProduction)
  });


  await Promise.all(
  toUpdate.map(production =>
      prisma.production.update({
        where: { apiId: production["@id"] },
        data: mapProduction(production)
      })
    )
  );
  
}


async function main() {
  await sync_productions();
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