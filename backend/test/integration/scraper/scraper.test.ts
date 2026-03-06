import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { prisma } from '../../../src/scraper/prisma';
import Scraper from '../../../src/scraper/scraper';

import type { APIProduction, APIEvent, APISpace, APIHall, APILocation, APIStatus, } from "../../../src/scraper/APItypes";



// ------------------------------------------------------------------
// helper om Json fields te casten
// ------------------------------------------------------------------
function getLocalized(obj: any) {
  return obj as { nl: string; en: string; fr: string };
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

  const statuses: APIStatus[] = [
    {
      "@context": "/api/context/status",
      "@id": "/stat/1",
      "@type": "Status",
      created_at: "2021-01-01T16:00:00Z",
      updated_at: "2021-01-02T17:00:00Z",
      name: { nl: "OK", en: "OK EN", fr: "OK FR" },
      short_name: "OK",
      fixed: true,
      visible: true,
      bookable: false,
    } as APIStatus,
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
      genres: [],
      events: [],
      media_gallery: "",
      review_gallery: "",
      poster_gallery: "",
      uitdatabank_keywords: [],
      uitdatabank_theme: "",
      uitdatabank_type: "",
    } as APIProduction,
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

  async function* pages<T>(pages: T[][]): AsyncGenerator<T[]> {
    for (const p of pages) yield p;
  }
  return {
    fetchLocationsPages: () => pages([locations]),
    fetchSpacesPages: () => pages([spaces]),
    fetchHallsPages: () => pages([halls]),
    fetchStatusesPages: () => pages([statuses]),
    fetchEventsPages: () => pages([events]),
    fetchProductionsPages: () => pages([productions]),
  };
});

// ------------------------------------------------------------------
// 2. setup: clear DB & sync everything ONCE
// ------------------------------------------------------------------
beforeAll(async () => {
  // clear DB
  await prisma.event.deleteMany();
  await prisma.production.deleteMany();
  await prisma.status.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.space.deleteMany();
  await prisma.location.deleteMany();

  // sync all scraper data in correct order
  await Scraper.sync_locations();
  await Scraper.sync_spaces();
  await Scraper.sync_hall();
  await Scraper.sync_status();
  await Scraper.sync_productions();
  await Scraper.sync_events();
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

  it('checks all status fields', async () => {
    const stat = await prisma.status.findUnique({ where: { apiId: '/stat/1' } });
    expect(stat).not.toBeNull();
    const name = getLocalized(stat?.name);
    expect(name.nl).toBe("OK");
    expect(name.en).toBe("OK EN");
    expect(name.fr).toBe("OK FR");
    expect(stat?.short_name).toBe("OK");
    expect(stat?.fixed).toBe(true);
    expect(stat?.visible).toBe(true);
    expect(stat?.bookable).toBe(false);
    expect(stat?.created_at.toISOString()).toBe("2021-01-01T16:00:00.000Z");
    expect(stat?.updated_at.toISOString()).toBe("2021-01-02T17:00:00.000Z");
  });

  it('checks all production fields', async () => {
    const prod = await prisma.production.findUnique({ where: { apiId: '/prod/1' } });
    expect(prod).not.toBeNull();
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
    expect(prod?.created_at.toISOString().startsWith("1970-01-01")).toBe(true);
    expect(prod?.updated_at.toISOString()).toBe("2021-01-02T18:00:00.000Z");
  });

  it('checks all event fields', async () => {
    const ev = await prisma.event.findUnique({
      where: { apiId: '/event/1' },
      include: { production: true, hall: true, status: true },
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
    expect(ev?.status?.apiId).toBe("/stat/1");
  });

});