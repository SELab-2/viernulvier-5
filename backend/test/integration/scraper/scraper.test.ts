import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { prisma } from '../../../src/scraper/prisma';
import Scraper from '../../../src/scraper/scraper';
import * as Fetcher from '../../../src/scraper/fetcher';

import type { APIProduction, APIEvent, APISpace, APIHall, APILocation, APIGenre, APIGallery, APIItem, APICrop, APIEventPrice, APIUitKeyword, APIUitTheme, APIUitType } from "../../../src/scraper/APItypes";


/*
!!!!!! READ THIS IF THESE TESTS FAIL !!!!!!!!!

- `npm test` should start the dedicated test database and sync the schema automatically
- Make sure Docker is running locally
- Make sure `backend/.env.test` exists and contains `DATABASE_URL`
- Make sure `DATABASE_URL` points to your test database

*/


// ------------------------------------------------------------------
// helper om Json fields te casten
// ------------------------------------------------------------------
function getLocalized(obj: any) {
  return obj as { nl: string; en: string; fr: string };
}

async function* singlePage<T>(data: T[]): AsyncGenerator<T[]> {
  yield data;
}

// ------------------------------------------------------------------
// 1. mock fetcher with mock data
// ------------------------------------------------------------------
vi.mock('../../../src/scraper/fetcher', () => {
  // mock data

  // mock data
  // Mock data met meer velden ingevuld voor testcoverage
  const locations: APILocation[] = [
    {
      "@context": "/api/context/location",
      "@id": "/loc/1",
      "@type": "Location",
      created_at: "2021-01-01T10:00:00Z",
      updated_at: "2021-01-02T11:00:00Z",
      name: { nl: "Foo Theater", en: "Foo Theater EN", fr: "Foo Théâtre" },
      code: "LOC001",
      street: "Main Street",
      number: "12A",
      postal_code: "1234",
      city: "Ghost City",
      phone_1: "0123456789",
      phone_2: "0987654321",
      own_location: "true",
      country: "Belgium",
      uitdatabank_id: "UB123",
    } as APILocation,
  ];

  const spaces: APISpace[] = [
    {
      "@context": "/api/context/space",
      "@id": "/space/1",
      "@type": "Space",
      created_at: "2021-01-01T12:00:00Z",
      updated_at: "2021-01-02T13:00:00Z",
      vendor_id: "VEND001",
      name: { nl: "Main Hall", en: "Main Hall EN", fr: "Salle Principale" },
      location: "/loc/1",
    } as APISpace,
  ];

  const halls: APIHall[] = [
    {
      "@context": "/api/context/hall",
      "@id": "/hall/1",
      "@type": "Hall",
      created_at: "2021-01-01T14:00:00Z",
      updated_at: "2021-01-02T15:00:00Z",
      vendor_id: "VEND001",
      box_office_id: "BOX001",
      seat_selection: "true",
      open_seating: "false",
      name: { nl: "Hall A", en: "Hall A EN", fr: "Salle A" },
      remark: { nl: "No remarks", en: "No remarks", fr: "Pas de remarque" },
      space: "/space/1",
    } as APIHall,
  ];

  const productions: APIProduction[] = [
    {
      "@context": "/api/context/production",
      "@id": "/prod/1",
      "@type": "Production",
      created_at: "1970-01-01T00:00:00Z",
      updated_at: "2021-01-02T18:00:00Z",
      vendor_id: "VEND001",
      box_office_id: 123,
      performer_field: "Singer",
      performer_type: "Solo",
      attendance_mode: "In-person",
      supertitle: { nl: "Supertitle NL", en: "Supertitle EN", fr: "Supertitle FR" },
      title: { nl: "Amazing Show", en: "Amazing Show EN", fr: "Spectacle Incroyable" },
      artist: { nl: "John Doe", en: "John Doe", fr: "Jean Dupont" },
      meta_title: { nl: "Meta NL", en: "Meta EN", fr: "Meta FR" },
      meta_description: { nl: "Description NL", en: "Description EN", fr: "Description FR" },
      tagline: { nl: "Tagline NL", en: "Tagline EN", fr: "Tagline FR" },
      teaser: { nl: "Teaser NL", en: "Teaser EN", fr: "Teaser FR" },
      description: { nl: "Description full NL", en: "Description full EN", fr: "Description full FR" },
      description_extra: { nl: "Extra NL", en: "Extra EN", fr: "Extra FR" },
      description_2: { nl: "Desc2 NL", en: "Desc2 EN", fr: "Desc2 FR" },
      quote: { nl: "Quote NL", en: "Quote EN", fr: "Quote FR" },
      quote_source: { nl: "Source NL", en: "Source EN", fr: "Source FR" },
      programme: { nl: "Programme NL", en: "Programme EN", fr: "Programme FR" },
      info: { nl: "Info NL", en: "Info EN", fr: "Info FR" },
      description_short: { nl: "Short NL", en: "Short EN", fr: "Short FR" },
      eticket_info: { nl: "ETicket NL", en: "ETicket EN", fr: "ETicket FR" },
      custom_data: { nl: "Custom NL", en: "Custom EN", fr: "Custom FR" },
      video_1: { nl: "Video1 NL", en: "Video1 EN", fr: "Video1 FR" },
      video_2: { nl: "Video2 NL", en: "Video2 EN", fr: "Video2 FR" },
      genres: ["/genre/1"],
      tags: ["/tag/1"],
      events: [],
      media_gallery: "/gallery/1",
      review_gallery: "/gallery/1",
      poster_gallery: "/gallery/1",
      uitdatabank_keywords: ["/uit-keyword/1"],
      uitdatabank_theme: "/uit-theme/1",
      uitdatabank_type: "/uit-type/1",
    } as APIProduction,
  ];

  const genres: APIGenre[] = [
    {
      "@context": "/api/context/genre",
      "@id": "/genre/1",
      "@type": "Genre",
      created_at: "2021-01-03T10:00:00Z",
      updated_at: "2021-01-04T11:00:00Z",
      type: "category",
      use_as: "genre",
      vendor_id: "VEND001",
      name: { nl: "Theater", en: "Theatre", fr: "Théâtre" },
      slug: { nl: "theater", en: "theatre", fr: "theatre-fr" },
      description: { nl: "Genre NL", en: "Genre EN", fr: "Genre FR" },
    } as APIGenre,
  ];

  const tags: APIGenre[] = [
    {
      "@context": "/api/context/tag",
      "@id": "/tag/1",
      "@type": "Genre",
      created_at: "2021-01-03T10:00:00Z",
      updated_at: "2021-01-04T11:00:00Z",
      type: "category",
      use_as: "tag",
      vendor_id: "VEND001",
      name: { nl: "Theater", en: "Theatre", fr: "Théâtre" },
      slug: { nl: "theater", en: "theatre", fr: "theatre-fr" },
      description: { nl: "Tag NL", en: "Tag EN", fr: "Tag FR" },
    } as APIGenre,
  ];

  const crops: APICrop[] = [
    {
      "@context": "/api/context/crop",
      "@id": "/crop/1",
      "@type": "Crop",
      created_at: "2021-01-05T09:00:00Z",
      updated_at: "2021-01-06T09:30:00Z",
      name: "thumb",
      url: "https://example.com/crop-1.jpg",
    } as APICrop,
  ];

  const items: APIItem[] = [
    {
      "@context": "/api/context/item",
      "@id": "/item/1",
      "@type": "Item",
      created_at: "2021-01-07T12:00:00Z",
      updated_at: "2021-01-08T12:00:00Z",
      type: "image",
      original_filename: "poster.jpg",
      position: 1,
      width: 1200,
      height: 800,
      format: "jpg",
      gallery: "/gallery/1",
      title: { nl: "Titel NL", en: "Title EN", fr: "Titre FR" },
      description: { nl: "Beschrijving NL", en: "Description EN", fr: "Description FR" },
      credits: { nl: "Credits NL", en: "Credits EN", fr: "Credits FR" },
      link: { nl: "https://nl.example.com/item", en: "https://en.example.com/item", fr: "https://fr.example.com/item" },
      crops: [{ "@id": "/crop/1", "@type": "Crop" }],
    } as APIItem,
  ];

  const galleries: APIGallery[] = [
    {
      "@context": "/api/context/gallery",
      "@id": "/gallery/1",
      "@type": "Gallery",
      created_at: "2021-01-09T08:00:00Z",
      updated_at: "2021-01-10T08:00:00Z",
      name: "Media Gallery",
      items: ["/item/1"],
    } as APIGallery,
  ];

  const events: APIEvent[] = [
    {
      "@context": "/api/context/event",
      "@id": "/event/1",
      "@type": "Event",
      created_at: "2021-01-01T19:00:00Z",
      updated_at: "2021-01-02T20:00:00Z",
      starts_at: "2021-05-01T19:00:00Z",
      ends_at: "2021-05-01T21:00:00Z",
      intermission_at: "2021-05-01T20:00:00Z",
      doors_at: "2021-05-01T18:30:00Z",
      box_office_id: "BOX001",
      vendor_id: "VEND001",
      max_tickets_per_order: 5,
      uitdatabank_id: "UB001",
      secure: true,
      sms_verification: true,
      production: { "@id": "/prod/1", "@type": "Production" },
      status: "/stat/1",
      hall: "/hall/1",
      prices: [],
      info: { nl: "Info NL", en: "Info EN", fr: "Info FR" },
      eticket_info: { nl: "ETicket NL", en: "ETicket EN", fr: "ETicket FR" },
      external_order_url: { nl: "https://nl.example.com", en: "https://en.example.com", fr: "https://fr.example.com" },
      order_url: "https://order.example.com",
    } as APIEvent,
  ];

  const eventPrices: APIEventPrice[] = [
    {
      "@context": "/api/context/event-price",
      "@id": "/event-price/1",
      "@type": "EventPrice",
      created_at: "2021-01-11T10:00:00Z",
      updated_at: "2021-01-12T10:00:00Z",
      available: 50,
      amount: "25.00",
      box_office_id: "BOX001",
      contingent_id: 100,
      expires_at: "2021-06-01T10:00:00Z",
      event: "/event/1",
      price: "/price/1",
      rank: "/rank/1",
    } as APIEventPrice,
  ];


  const uitKeywords: APIUitKeyword[] = [
    {
      "@context": "/api/context/uit-keyword",
      "@id": "/uit-keyword/1",
      "@type": "UitKeyword",
      created_at: "2021-01-15T07:00:00Z",
      updated_at: "2021-01-16T07:00:00Z",
      name: "Family",
    } as APIUitKeyword,
  ];

  const uitThemes: APIUitTheme[] = [
    {
      "@context": "/api/context/uit-theme",
      "@id": "/uit-theme/1",
      "@type": "UitTheme",
      created_at: "2021-01-17T07:00:00Z",
      updated_at: "2021-01-18T07:00:00Z",
      name: "Music",
      cdb_cat_id: "THEME001",
    } as APIUitTheme,
  ];

  const uitTypes: APIUitType[] = [
    {
      "@context": "/api/context/uit-type",
      "@id": "/uit-type/1",
      "@type": "UitType",
      created_at: "2021-01-19T07:00:00Z",
      updated_at: "2021-01-20T07:00:00Z",
      name: "Concert",
      cdb_cat_id: "TYPE001",
    } as APIUitType,
  ];

  async function* pages<T>(pages: T[][]): AsyncGenerator<T[]> {
    for (const p of pages) yield p;
  }
  return {
    fetchLocationsPages: () => pages([locations]),
    fetchSpacesPages: () => pages([spaces]),
    fetchHallsPages: () => pages([halls]),
    fetchGenrePages: () => pages([genres, tags]),
    fetchGalleryPages: () => pages([galleries]),
    fetchItemPages: () => pages([items]),
    fetchCropPages: () => pages([crops]),
    fetchEventsPages: () => pages([events]),
    fetchEventPricePages: () => pages([eventPrices]),
    fetchUitKeywordPages: () => pages([uitKeywords]),
    fetchUitThemePages: () => pages([uitThemes]),
    fetchUitTypePages: () => pages([uitTypes]),
    fetchProductionsPages: () => pages([productions]),
  };
});

// ------------------------------------------------------------------
// 2. setup: clear DB & sync everything ONCE
// ------------------------------------------------------------------
beforeAll(async () => {
  const testDatabaseUrl = process.env.DATABASE_URL;

  if (!testDatabaseUrl) {
    throw new Error('Missing DATABASE_URL. Create .env.test with a valid test database URL.');
  }

  if (!/test/i.test(testDatabaseUrl)) {
    throw new Error('Unsafe DATABASE_URL detected. Use a dedicated test database (URL should clearly indicate test).');
  }

  // clear DB
  await prisma.event_price.deleteMany();
  await prisma.event.deleteMany();
  await prisma.uit_keywords_production.deleteMany();
  await prisma.genre_production.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.production.deleteMany();
  await prisma.uitdatabank_theme.deleteMany();
  await prisma.uitdatabank_type.deleteMany();
  await prisma.uitdatabank_keyword.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.gallery.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.item.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.space.deleteMany();
  await prisma.location.deleteMany();

  // sync all scraper data in correct order
  await Scraper.sync_locations();
  await Scraper.sync_spaces();
  await Scraper.sync_hall();
  await Scraper.sync_crops();
  await Scraper.sync_items();
  await Scraper.sync_galleries();
  await Scraper.sync_uit_keywords();
  await Scraper.sync_uit_themes();
  await Scraper.sync_uit_types();
  await Scraper.sync_genres();
  await Scraper.sync_productions();
  await Scraper.sync_events();
  await Scraper.sync_event_prices();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// ------------------------------------------------------------------
// 3. tests
// ------------------------------------------------------------------
describe('scraper integration full coverage', () => {

  it('checks all location fields', async () => {
    const loc = await prisma.location.findUnique({ where: { apiId: '/loc/1' } });
    expect(loc).not.toBeNull();
    const name = getLocalized(loc?.name);
    expect(name.nl).toBe("Foo Theater");
    expect(name.en).toBe("Foo Theater EN");
    expect(name.fr).toBe("Foo Théâtre");
    expect(loc?.code).toBe("LOC001");
    expect(loc?.street).toBe("Main Street");
    expect(loc?.number).toBe("12A");
    expect(loc?.postal_code).toBe("1234");
    expect(loc?.city).toBe("Ghost City");
    expect(loc?.phone_1).toBe("0123456789");
    expect(loc?.phone_2).toBe("0987654321");
    expect(loc?.own_location).toBe("true");
    expect(loc?.country).toBe("Belgium");
    expect(loc?.uitdatabank_id).toBe("UB123");
    expect(loc?.created_at.toISOString()).toBe("2021-01-01T10:00:00.000Z");
    expect(loc?.updated_at.toISOString()).toBe("2021-01-02T11:00:00.000Z");
  });

  it('checks all space fields', async () => {
    const space = await prisma.space.findUnique({ where: { apiId: '/space/1' } });
    const loc = await prisma.location.findUnique({ where: { apiId: '/loc/1' } });
    expect(space).not.toBeNull();
    const name = getLocalized(space?.name);
    expect(name.nl).toBe("Main Hall");
    expect(name.en).toBe("Main Hall EN");
    expect(name.fr).toBe("Salle Principale");
    expect(space?.location_id).toBe(loc?.id);
    expect(space?.vendor_id).toBe("VEND001");
    expect(space?.created_at.toISOString()).toBe("2021-01-01T12:00:00.000Z");
    expect(space?.updated_at.toISOString()).toBe("2021-01-02T13:00:00.000Z");
  });

  it('checks all hall fields', async () => {
    const hall = await prisma.hall.findUnique({ where: { apiId: '/hall/1' } });
    const space = await prisma.space.findUnique({ where: { apiId: '/space/1' } });
    expect(hall).not.toBeNull();
    const name = getLocalized(hall?.name);
    const remark = getLocalized(hall?.remark);
    expect(name.nl).toBe("Hall A");
    expect(name.en).toBe("Hall A EN");
    expect(name.fr).toBe("Salle A");
    expect(remark.nl).toBe("No remarks");
    expect(remark.en).toBe("No remarks");
    expect(remark.fr).toBe("Pas de remarque");
    expect(hall?.space_id).toBe(space?.id);
    expect(hall?.vendor_id).toBe("VEND001");
    expect(hall?.box_office_id).toBe("BOX001");
    expect(hall?.seat_selection).toBe("true");
    expect(hall?.open_seating).toBe("false");
    expect(hall?.created_at.toISOString()).toBe("2021-01-01T14:00:00.000Z");
    expect(hall?.updated_at.toISOString()).toBe("2021-01-02T15:00:00.000Z");
  });

  it('checks all production fields', async () => {
    const prod = await prisma.production.findUnique({ where: { apiId: '/prod/1' } });
    const gallery = await prisma.gallery.findUnique({ where: { apiId: '/gallery/1' } });
    const theme = await prisma.uitdatabank_theme.findUnique({ where: { apiId: '/uit-theme/1' } });
    const type = await prisma.uitdatabank_type.findUnique({ where: { apiId: '/uit-type/1' } });
    expect(prod).not.toBeNull();
    expect(gallery).not.toBeNull();
    expect(theme).not.toBeNull();
    expect(type).not.toBeNull();
    const supertitle = getLocalized(prod?.super_title);
    const title = getLocalized(prod?.title);
    const artist = getLocalized(prod?.artist);
    expect(prod?.vendor_id).toBe("VEND001");
    expect(prod?.box_office_id).toBe(123);
    expect(prod?.performer_field).toBe("Singer");
    expect(prod?.performer_type).toBe("Solo");
    expect(prod?.attendance_mode).toBe("In-person");
    expect(supertitle.nl).toBe("Supertitle NL");
    expect(title.fr).toBe("Spectacle Incroyable");
    expect(artist.fr).toBe("Jean Dupont");
    expect(prod?.media_gallery_id).toBe(gallery?.id);
    expect(prod?.review_gallery_id).toBe(gallery?.id);
    expect(prod?.poster_gallery_id).toBe(gallery?.id);
    expect(prod?.uitdatabank_theme).toBe(theme?.id);
    expect(prod?.uitdatabank_type).toBe(type?.id);
    expect(prod?.created_at.toISOString().startsWith("1970-01-01")).toBe(true);
    expect(prod?.updated_at.toISOString()).toBe("2021-01-02T18:00:00.000Z");
  });

  it('links production with uitdatabank keyword in uit_keywords_production', async () => {
    const prod = await prisma.production.findUnique({ where: { apiId: '/prod/1' } });
    const keyword = await prisma.uitdatabank_keyword.findUnique({ where: { apiId: '/uit-keyword/1' } });

    expect(prod).not.toBeNull();
    expect(keyword).not.toBeNull();

    const relation = await prisma.uit_keywords_production.findFirst({
      where: {
        production_id: prod!.id,
        uitkeywords_id: keyword!.id,
      },
    });

    expect(relation).not.toBeNull();
  });

  it('checks all genre fields', async () => {
    const genre = await prisma.genre.findUnique({ where: { apiId: '/genre/1' } });
    expect(genre).not.toBeNull();
    const name = getLocalized(genre?.name);
    const slug = getLocalized(genre?.slug);
    const description = getLocalized(genre?.description);

    expect(genre?.type).toBe('category');
    expect(genre?.vendor_id).toBe('VEND001');
    expect(name.nl).toBe('Theater');
    expect(name.en).toBe('Theatre');
    expect(name.fr).toBe('Théâtre');
    expect(slug.nl).toBe('theater');
    expect(slug.en).toBe('theatre');
    expect(slug.fr).toBe('theatre-fr');
    expect(description.nl).toBe('Genre NL');
    expect(description.en).toBe('Genre EN');
    expect(description.fr).toBe('Genre FR');
    expect(genre?.created_at.toISOString()).toBe('2021-01-03T10:00:00.000Z');
    expect(genre?.updated_at.toISOString()).toBe('2021-01-04T11:00:00.000Z');
  });

  it('checks all tag fields', async () => {
    const genre = await prisma.genre.findUnique({ where: { apiId: '/tag/1' } });
    expect(genre).not.toBeNull();
    const name = getLocalized(genre?.name);
    const slug = getLocalized(genre?.slug);
    const description = getLocalized(genre?.description);

    expect(genre?.type).toBe('category');
    expect(genre?.vendor_id).toBe('VEND001');
    expect(name.nl).toBe('Theater');
    expect(name.en).toBe('Theatre');
    expect(name.fr).toBe('Théâtre');
    expect(slug.nl).toBe('theater');
    expect(slug.en).toBe('theatre');
    expect(slug.fr).toBe('theatre-fr');
    expect(description.nl).toBe('Tag NL');
    expect(description.en).toBe('Tag EN');
    expect(description.fr).toBe('Tag FR');
    expect(genre?.created_at.toISOString()).toBe('2021-01-03T10:00:00.000Z');
    expect(genre?.updated_at.toISOString()).toBe('2021-01-04T11:00:00.000Z');
  });

  it('links production with genre in genre_production', async () => {
    const prod = await prisma.production.findUnique({ where: { apiId: '/prod/1' } });
    const genre = await prisma.genre.findUnique({ where: { apiId: '/genre/1' } });

    expect(prod).not.toBeNull();
    expect(genre).not.toBeNull();

    const relation = await prisma.genre_production.findFirst({
      where: {
        production_id: prod!.id,
        genre_id: genre!.id,
      },
    });

    expect(relation).not.toBeNull();
  });

  it('links production with tag in tag_production', async () => {
    const prod = await prisma.production.findUnique({ where: { apiId: '/prod/1' } });
    const tag = await prisma.genre.findUnique({ where: { apiId: '/tag/1' } });

    expect(prod).not.toBeNull();
    expect(tag).not.toBeNull();

    const relation = await prisma.tag_production.findFirst({
      where: {
        production_id: prod!.id,
        tag_id: tag!.id,
      },
    });

    expect(relation).not.toBeNull();
  });

  it('checks all crop fields', async () => {
    const crop = await prisma.crop.findUnique({ where: { apiId: '/crop/1' } });
    expect(crop).not.toBeNull();
    expect(crop?.name).toBe('thumb');
    expect(crop?.url).toBe('https://example.com/crop-1.jpg');
    expect(crop?.created_at.toISOString()).toBe('2021-01-05T09:00:00.000Z');
    expect(crop?.updated_at.toISOString()).toBe('2021-01-06T09:30:00.000Z');
  });

  it('checks all item fields and crop relation', async () => {
    const item = await prisma.item.findUnique({
      where: { apiId: '/item/1' },
      include: { crops: true },
    });
    expect(item).not.toBeNull();

    const title = getLocalized(item?.title);
    const description = getLocalized(item?.description);
    const credits = getLocalized(item?.credits);
    const link = getLocalized(item?.link);

    expect(item?.type).toBe('image');
    expect(item?.original_filename).toBe('poster.jpg');
    expect(item?.position).toBe(1);
    expect(item?.width).toBe(1200);
    expect(item?.height).toBe(800);
    expect(item?.format).toBe('jpg');
    expect(title.nl).toBe('Titel NL');
    expect(title.en).toBe('Title EN');
    expect(title.fr).toBe('Titre FR');
    expect(description.nl).toBe('Beschrijving NL');
    expect(description.en).toBe('Description EN');
    expect(description.fr).toBe('Description FR');
    expect(credits.nl).toBe('Credits NL');
    expect(credits.en).toBe('Credits EN');
    expect(credits.fr).toBe('Credits FR');
    expect(link.nl).toBe('https://nl.example.com/item');
    expect(link.en).toBe('https://en.example.com/item');
    expect(link.fr).toBe('https://fr.example.com/item');
    expect(item?.created_at.toISOString()).toBe('2021-01-07T12:00:00.000Z');
    expect(item?.updated_at.toISOString()).toBe('2021-01-08T12:00:00.000Z');
    expect(item?.crops).toHaveLength(1);
    expect(item?.crops[0]?.apiId).toBe('/crop/1');
  });

  it('checks all gallery fields and item relation', async () => {
    const gallery = await prisma.gallery.findUnique({
      where: { apiId: '/gallery/1' },
      include: { items: true },
    });
    expect(gallery).not.toBeNull();
    expect(gallery?.name).toBe('Media Gallery');
    expect(gallery?.created_at.toISOString()).toBe('2021-01-09T08:00:00.000Z');
    expect(gallery?.updated_at.toISOString()).toBe('2021-01-10T08:00:00.000Z');
    expect(gallery?.items).toHaveLength(1);
    expect(gallery?.items[0]?.apiId).toBe('/item/1');
  });

  it('checks all event fields', async () => {
    const ev = await prisma.event.findUnique({
      where: { apiId: '/event/1' },
      include: { production: true, hall: true },
    });
    expect(ev).not.toBeNull();
    expect(ev?.starts_at?.toISOString()).toBe("2021-05-01T19:00:00.000Z");
    expect(ev?.ends_at?.toISOString()).toBe("2021-05-01T21:00:00.000Z");
    expect(ev?.intermission_at?.toISOString()).toBe("2021-05-01T20:00:00.000Z");
    expect(ev?.doors_at?.toISOString()).toBe("2021-05-01T18:30:00.000Z");
    expect(ev?.box_office_id).toBe("BOX001");
    expect(ev?.vendor_id).toBe("VEND001");
    expect(ev?.max_tickets_per_order).toBe(5);
    expect(ev?.secure).toBe(true);
    expect(ev?.sms_verification).toBe(true);

    const info = getLocalized(ev?.info);
    const eticket = getLocalized(ev?.eticket_info);
    const extUrls = getLocalized(ev?.external_order_url);

    expect(info.nl).toBe("Info NL");
    expect(info.en).toBe("Info EN");
    expect(info.fr).toBe("Info FR");

    expect(eticket.nl).toBe("ETicket NL");
    expect(eticket.en).toBe("ETicket EN");
    expect(eticket.fr).toBe("ETicket FR");

    expect(extUrls.nl).toBe("https://nl.example.com");
    expect(extUrls.en).toBe("https://en.example.com");
    expect(extUrls.fr).toBe("https://fr.example.com");

    expect(ev?.order_url).toBe("https://order.example.com");
    expect(ev?.production?.apiId).toBe("/prod/1");
    expect(ev?.hall?.apiId).toBe("/hall/1");
  });

  it('checks all event_price fields and event relation', async () => {
    const eventPrice = await prisma.event_price.findUnique({
      where: { apiId: '/event-price/1' },
      include: { event: true },
    });

    expect(eventPrice).not.toBeNull();
    expect(eventPrice?.available).toBe(50);
    expect(eventPrice?.amount).toBe('25.00');
    expect(eventPrice?.box_office_id).toBe('BOX001');
    expect(eventPrice?.contigent_id).toBe(100);
    expect(eventPrice?.expires_at?.toISOString()).toBe('2021-06-01T10:00:00.000Z');
    expect(eventPrice?.created_at.toISOString()).toBe('2021-01-11T10:00:00.000Z');
    expect(eventPrice?.updated_at.toISOString()).toBe('2021-01-12T10:00:00.000Z');
    expect(eventPrice?.event?.apiId).toBe('/event/1');
  });

  it('checks uitdatabank keyword, theme and type fields', async () => {
    const keyword = await prisma.uitdatabank_keyword.findUnique({ where: { apiId: '/uit-keyword/1' } });
    const theme = await prisma.uitdatabank_theme.findUnique({ where: { apiId: '/uit-theme/1' } });
    const type = await prisma.uitdatabank_type.findUnique({ where: { apiId: '/uit-type/1' } });

    expect(keyword).not.toBeNull();
    expect(keyword?.name).toBe('Family');
    expect(keyword?.created_at.toISOString()).toBe('2021-01-15T07:00:00.000Z');
    expect(keyword?.updated_at.toISOString()).toBe('2021-01-16T07:00:00.000Z');

    expect(theme).not.toBeNull();
    expect(theme?.name).toBe('Music');
    expect(theme?.cdb_cat_id).toBe('THEME001');
    expect(theme?.created_at.toISOString()).toBe('2021-01-17T07:00:00.000Z');
    expect(theme?.updated_at.toISOString()).toBe('2021-01-18T07:00:00.000Z');

    expect(type).not.toBeNull();
    expect(type?.name).toBe('Concert');
    expect(type?.cdb_cat_id).toBe('TYPE001');
    expect(type?.created_at.toISOString()).toBe('2021-01-19T07:00:00.000Z');
    expect(type?.updated_at.toISOString()).toBe('2021-01-20T07:00:00.000Z');
  });

  it('does not duplicate records when syncing the same data twice', async () => {
    const before = {
      eventPrices: await prisma.event_price.count({ where: { apiId: '/event-price/1' } }),
      tags: await prisma.tag.count({ where: { apiId: '/tag/1' } }),
      keywords: await prisma.uitdatabank_keyword.count({ where: { apiId: '/uit-keyword/1' } }),
      themes: await prisma.uitdatabank_theme.count({ where: { apiId: '/uit-theme/1' } }),
      types: await prisma.uitdatabank_type.count({ where: { apiId: '/uit-type/1' } }),
      genreLinks: await prisma.genre_production.count(),
      tagLinks: await prisma.tag_production.count(),
    };

    await Scraper.sync_uit_keywords();
    await Scraper.sync_uit_themes();
    await Scraper.sync_uit_types();
    await Scraper.sync_genres();
    await Scraper.sync_productions();
    await Scraper.sync_event_prices();

    const after = {
      eventPrices: await prisma.event_price.count({ where: { apiId: '/event-price/1' } }),
      tags: await prisma.tag.count({ where: { apiId: '/tag/1' } }),
      keywords: await prisma.uitdatabank_keyword.count({ where: { apiId: '/uit-keyword/1' } }),
      themes: await prisma.uitdatabank_theme.count({ where: { apiId: '/uit-theme/1' } }),
      types: await prisma.uitdatabank_type.count({ where: { apiId: '/uit-type/1' } }),
      genreLinks: await prisma.genre_production.count(),
      tagLinks: await prisma.tag_production.count(),
    };

    expect(after).toEqual(before);
    expect(after.eventPrices).toBe(1);
    expect(after.tags).toBe(1);
    expect(after.keywords).toBe(1);
    expect(after.themes).toBe(1);
    expect(after.types).toBe(1);
  });

  it('handles empty pages without creating extra records', async () => {
    const before = {
      locations: await prisma.location.count(),
      spaces: await prisma.space.count(),
      halls: await prisma.hall.count(),
      events: await prisma.event.count(),
      productions: await prisma.production.count(),
      genres: await prisma.genre.count(),
      galleries: await prisma.gallery.count(),
      items: await prisma.item.count(),
      crops: await prisma.crop.count(),
      eventPrices: await prisma.event_price.count(),
      tags: await prisma.tag.count(),
      keywords: await prisma.uitdatabank_keyword.count(),
      themes: await prisma.uitdatabank_theme.count(),
      types: await prisma.uitdatabank_type.count(),
    };

    const locationSpy = vi.spyOn(Fetcher, 'fetchLocationsPages').mockImplementation(() => singlePage([]));
    const spaceSpy = vi.spyOn(Fetcher, 'fetchSpacesPages').mockImplementation(() => singlePage([]));
    const hallSpy = vi.spyOn(Fetcher, 'fetchHallsPages').mockImplementation(() => singlePage([]));
    const eventSpy = vi.spyOn(Fetcher, 'fetchEventsPages').mockImplementation(() => singlePage([]));
    const productionSpy = vi.spyOn(Fetcher, 'fetchProductionsPages').mockImplementation(() => singlePage([]));
    const genreSpy = vi.spyOn(Fetcher, 'fetchGenrePages').mockImplementation(() => singlePage([]));
    const gallerySpy = vi.spyOn(Fetcher, 'fetchGalleryPages').mockImplementation(() => singlePage([]));
    const itemSpy = vi.spyOn(Fetcher, 'fetchItemPages').mockImplementation(() => singlePage([]));
    const cropSpy = vi.spyOn(Fetcher, 'fetchCropPages').mockImplementation(() => singlePage([]));
    const eventPriceSpy = vi.spyOn(Fetcher, 'fetchEventPricePages').mockImplementation(() => singlePage([]));
    const keywordSpy = vi.spyOn(Fetcher, 'fetchUitKeywordPages').mockImplementation(() => singlePage([]));
    const themeSpy = vi.spyOn(Fetcher, 'fetchUitThemePages').mockImplementation(() => singlePage([]));
    const typeSpy = vi.spyOn(Fetcher, 'fetchUitTypePages').mockImplementation(() => singlePage([]));

    try {
      await Scraper.sync_locations();
      await Scraper.sync_spaces();
      await Scraper.sync_hall();
      await Scraper.sync_events();
      await Scraper.sync_productions();
      await Scraper.sync_genres();
      await Scraper.sync_galleries();
      await Scraper.sync_items();
      await Scraper.sync_crops();
      await Scraper.sync_event_prices();
      await Scraper.sync_uit_keywords();
      await Scraper.sync_uit_themes();
      await Scraper.sync_uit_types();
    } finally {
      locationSpy.mockRestore();
      spaceSpy.mockRestore();
      hallSpy.mockRestore();
      eventSpy.mockRestore();
      productionSpy.mockRestore();
      genreSpy.mockRestore();
      gallerySpy.mockRestore();
      itemSpy.mockRestore();
      cropSpy.mockRestore();
      eventPriceSpy.mockRestore();
      keywordSpy.mockRestore();
      themeSpy.mockRestore();
      typeSpy.mockRestore();
    }

    const after = {
      locations: await prisma.location.count(),
      spaces: await prisma.space.count(),
      halls: await prisma.hall.count(),
      events: await prisma.event.count(),
      productions: await prisma.production.count(),
      genres: await prisma.genre.count(),
      galleries: await prisma.gallery.count(),
      items: await prisma.item.count(),
      crops: await prisma.crop.count(),
      eventPrices: await prisma.event_price.count(),
      tags: await prisma.tag.count(),
      keywords: await prisma.uitdatabank_keyword.count(),
      themes: await prisma.uitdatabank_theme.count(),
      types: await prisma.uitdatabank_type.count(),
    };

    expect(after).toEqual(before);
  });

  it('applies cutoff_timestamp and only syncs newer records', async () => {
    const keywordSpy = vi.spyOn(Fetcher, 'fetchUitKeywordPages').mockImplementation(() => singlePage([
      {
        '@context': '/api/context/uit-keyword',
        '@id': '/uit-keyword/cutoff-old',
        '@type': 'UitKeyword',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-01-10T00:00:00Z',
        name: 'Old Keyword',
      } as APIUitKeyword,
      {
        '@context': '/api/context/uit-keyword',
        '@id': '/uit-keyword/cutoff-new-1',
        '@type': 'UitKeyword',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-02-10T00:00:00Z',
        name: 'New Keyword 1',
      } as APIUitKeyword,
      {
        '@context': '/api/context/uit-keyword',
        '@id': '/uit-keyword/cutoff-new-2',
        '@type': 'UitKeyword',
        created_at: '2021-01-01T00:00:00Z',
        updated_at: '2021-03-10T00:00:00Z',
        name: 'New Keyword 2',
      } as APIUitKeyword,
    ]));

    try {
      await Scraper.sync_uit_keywords(new Date('2021-02-01T00:00:00Z'));
    } finally {
      keywordSpy.mockRestore();
    }

    const oldKeyword = await prisma.uitdatabank_keyword.findUnique({
      where: { apiId: '/uit-keyword/cutoff-old' },
    });
    const newKeyword1 = await prisma.uitdatabank_keyword.findUnique({
      where: { apiId: '/uit-keyword/cutoff-new-1' },
    });
    const newKeyword2 = await prisma.uitdatabank_keyword.findUnique({
      where: { apiId: '/uit-keyword/cutoff-new-2' },
    });

    expect(oldKeyword).toBeNull();
    expect(newKeyword1?.name).toBe('New Keyword 1');
    expect(newKeyword2?.name).toBe('New Keyword 2');

    await prisma.uitdatabank_keyword.deleteMany({
      where: {
        apiId: {
          in: ['/uit-keyword/cutoff-old', '/uit-keyword/cutoff-new-1', '/uit-keyword/cutoff-new-2'],
        },
      },
    });
  });

});
