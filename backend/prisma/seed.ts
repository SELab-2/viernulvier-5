import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '../src/utils/password.js'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

type SeedProduction = {
    apiId: string
    title: { nl: string; en: string }
    description_short: { nl: string; en: string }
    teaser: { nl: string; en: string }
    performer_type: string
    attendance_mode: string
    createdAt: Date
}

const SEED_IMAGE_URLS = [
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
]

function getSeedImageUrl(index: number): string {
    return SEED_IMAGE_URLS[index % SEED_IMAGE_URLS.length]
}

/**
 * Seed the database with initial data for development.
 */
async function main() {
    console.log('🌱 Seeding database...')
    const adminPasswordHash = await hashPassword('admin123')
    const editorPasswordHash = await hashPassword('editor123')

    await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
        create: {
            username: 'admin',
            passwordHash: adminPasswordHash,
            role: 'ADMIN',
        },
    })

    await prisma.adminUser.upsert({
        where: { username: 'editor' },
        update: {
            passwordHash: editorPasswordHash,
            role: 'EDITOR',
        },
        create: {
            username: 'editor',
            passwordHash: editorPasswordHash,
            role: 'EDITOR',
        },
    })

    const productionsSeed: SeedProduction[] = [
        {
            apiId: 'seed-prod-001',
            title: { nl: 'Test Productie A', en: 'Test Production A' },
            description_short: {
                nl: 'Een testproductie om de zoekpagina te valideren.',
                en: 'A test production to validate the search page.',
            },
            teaser: {
                nl: 'Korte teaser voor productie A.',
                en: 'Short teaser for production A.',
            },
            performer_type: 'dans',
            attendance_mode: 'balzaal',
            createdAt: new Date('2026-03-01T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-002',
            title: { nl: 'Test Productie B', en: 'Test Production B' },
            description_short: {
                nl: 'Tweede testproductie met andere trefwoorden.',
                en: 'Second test production with other keywords.',
            },
            teaser: {
                nl: 'Korte teaser voor productie B.',
                en: 'Short teaser for production B.',
            },
            performer_type: 'muziek',
            attendance_mode: 'theaterzaal',
            createdAt: new Date('2025-11-14T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-003',
            title: { nl: 'Archief Demo Productie C', en: 'Archive Demo Production C' },
            description_short: {
                nl: 'Gebruik deze productie om filters en sortering te testen.',
                en: 'Use this production to test filters and sorting.',
            },
            teaser: {
                nl: 'Demo teaser voor productie C.',
                en: 'Demo teaser for production C.',
            },
            performer_type: 'theater',
            attendance_mode: 'domzaal',
            createdAt: new Date('2024-06-05T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-004',
            title: { nl: 'Nachtlijnen', en: 'Night Lines' },
            description_short: {
                nl: 'Elektronische liveset met visuele projecties.',
                en: 'Electronic live set with visual projections.',
            },
            teaser: {
                nl: 'Een nachtelijke trip door licht en geluid.',
                en: 'A nightly trip through light and sound.',
            },
            performer_type: 'muziek',
            attendance_mode: 'concertzaal',
            createdAt: new Date('2023-10-18T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-005',
            title: { nl: 'Stad in Beweging', en: 'City in Motion' },
            description_short: {
                nl: 'Dansvoorstelling over stedelijke ritmes.',
                en: 'Dance performance about urban rhythms.',
            },
            teaser: {
                nl: 'Lichamen die de stad tekenen.',
                en: 'Bodies tracing the city.',
            },
            performer_type: 'dans',
            attendance_mode: 'balzaal',
            createdAt: new Date('2022-09-02T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-006',
            title: { nl: 'Leesmicro', en: 'Reading Mic' },
            description_short: {
                nl: 'Literaire avond met spoken word.',
                en: 'Literary night with spoken word.',
            },
            teaser: {
                nl: 'Stemmen, teksten en experiment.',
                en: 'Voices, texts, and experiment.',
            },
            performer_type: 'literatuur',
            attendance_mode: 'foyer',
            createdAt: new Date('2021-04-22T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-007',
            title: { nl: 'Komisch Archief', en: 'Comic Archive' },
            description_short: {
                nl: 'Stand-up avond met nieuwe stemmen.',
                en: 'Stand-up night with emerging voices.',
            },
            teaser: {
                nl: 'Scherp, snel en absurd.',
                en: 'Sharp, fast and absurd.',
            },
            performer_type: 'komedie',
            attendance_mode: 'theaterzaal',
            createdAt: new Date('2020-02-11T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-008',
            title: { nl: 'Veldwerk', en: 'Field Work' },
            description_short: {
                nl: 'Theateronderzoek met publiek op scène.',
                en: 'Theatre research with audience on stage.',
            },
            teaser: {
                nl: 'Grenzen tussen speler en kijker vervagen.',
                en: 'Borders between player and viewer fade.',
            },
            performer_type: 'theater',
            attendance_mode: 'domzaal',
            createdAt: new Date('2019-12-03T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-009',
            title: { nl: 'Ritmeatelier', en: 'Rhythm Workshop' },
            description_short: {
                nl: 'Workshop rond percussie en beweging.',
                en: 'Workshop on percussion and movement.',
            },
            teaser: {
                nl: 'Hands-on ritme voor iedereen.',
                en: 'Hands-on rhythm for everyone.',
            },
            performer_type: 'workshop',
            attendance_mode: 'studio',
            createdAt: new Date('2018-07-09T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-010',
            title: { nl: 'Kader en Kleur', en: 'Frame and Color' },
            description_short: {
                nl: 'Interdisciplinaire expo-performance.',
                en: 'Interdisciplinary expo-performance.',
            },
            teaser: {
                nl: 'Beeldende kunst ontmoet performance.',
                en: 'Visual art meets performance.',
            },
            performer_type: 'voorstelling',
            attendance_mode: 'expozaal',
            createdAt: new Date('2017-05-19T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-011',
            title: { nl: 'Vroege Vogels', en: 'Early Birds' },
            description_short: {
                nl: 'Familievoorstelling op zondagochtend.',
                en: 'Family performance on Sunday morning.',
            },
            teaser: {
                nl: 'Licht, muziek en verhalen voor jong publiek.',
                en: 'Light, music and stories for young audiences.',
            },
            performer_type: 'voorstelling',
            attendance_mode: 'balzaal',
            createdAt: new Date('2016-03-27T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-012',
            title: { nl: 'Grenzeloos Geluid', en: 'Borderless Sound' },
            description_short: {
                nl: 'Internationale samenwerking tussen muzikanten.',
                en: 'International collaboration between musicians.',
            },
            teaser: {
                nl: 'Nieuwe klankwerelden in live set-up.',
                en: 'New sonic worlds in a live setup.',
            },
            performer_type: 'muziek',
            attendance_mode: 'concertzaal',
            createdAt: new Date('2015-10-01T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-013',
            title: { nl: 'Diepe Tijd', en: 'Deep Time' },
            description_short: {
                nl: 'Langdurige performatieve installatie.',
                en: 'Long-form performative installation.',
            },
            teaser: {
                nl: 'Een traag ritueel over herinnering.',
                en: 'A slow ritual about memory.',
            },
            performer_type: 'theater',
            attendance_mode: 'domzaal',
            createdAt: new Date('2014-01-16T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-014',
            title: { nl: 'Lijnen van Lucht', en: 'Lines of Air' },
            description_short: {
                nl: 'Danssolo met live strijkkwartet.',
                en: 'Dance solo with live string quartet.',
            },
            teaser: {
                nl: 'Een intieme choreografie vol ademruimte.',
                en: 'An intimate choreography full of breathing space.',
            },
            performer_type: 'dans',
            attendance_mode: 'theaterzaal',
            createdAt: new Date('2012-08-30T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-015',
            title: { nl: 'Open Keuken', en: 'Open Kitchen' },
            description_short: {
                nl: 'Culinaire performance en gesprek.',
                en: 'Culinary performance and conversation.',
            },
            teaser: {
                nl: 'Smaak, verhaal en ontmoeting.',
                en: 'Taste, story, and encounter.',
            },
            performer_type: 'workshop',
            attendance_mode: 'foyer',
            createdAt: new Date('2011-11-08T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-016',
            title: { nl: 'Archief in Klank', en: 'Archive in Sound' },
            description_short: {
                nl: 'Luistersessie met historische opnames.',
                en: 'Listening session with historical recordings.',
            },
            teaser: {
                nl: 'Het verleden in surround.',
                en: 'The past in surround.',
            },
            performer_type: 'muziek',
            attendance_mode: 'studio',
            createdAt: new Date('2009-06-12T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-017',
            title: { nl: 'Spiegelstad', en: 'Mirror City' },
            description_short: {
                nl: 'Theaterstuk over identiteit en ruimte.',
                en: 'Theatre piece about identity and space.',
            },
            teaser: {
                nl: 'Een stad die terugkijkt.',
                en: 'A city that looks back.',
            },
            performer_type: 'theater',
            attendance_mode: 'balzaal',
            createdAt: new Date('2005-09-20T10:00:00.000Z'),
        },
        {
            apiId: 'seed-prod-018',
            title: { nl: 'Vooruit 1988', en: 'Forward 1988' },
            description_short: {
                nl: 'Retro-programma uit de beginjaren.',
                en: 'Retro program from the early years.',
            },
            teaser: {
                nl: 'Een blik op het archief van de jaren 80.',
                en: 'A look at the archive of the eighties.',
            },
            performer_type: 'voorstelling',
            attendance_mode: 'concertzaal',
            createdAt: new Date('1988-04-03T10:00:00.000Z'),
        },
    ]

    const seededProductions = await Promise.all(
        productionsSeed.map(async (production, index) => {
            const gallery = await prisma.gallery.upsert({
                where: { apiId: `${production.apiId}-poster-gallery` },
                update: {
                    name: `${production.title.nl} poster gallery`,
                },
                create: {
                    apiId: `${production.apiId}-poster-gallery`,
                    name: `${production.title.nl} poster gallery`,
                },
            })

            await prisma.item.upsert({
                where: { apiId: `${production.apiId}-poster-item` },
                update: {
                    gallery_id: gallery.id,
                    original_filename: `${production.apiId}.jpg`,
                    position: 1,
                    width: 1200,
                    height: 800,
                    format: 'image/jpeg',
                    title: {
                        nl: `${production.title.nl} poster`,
                        en: `${production.title.en} poster`,
                    },
                    link: {
                        url: getSeedImageUrl(index),
                    },
                },
                create: {
                    apiId: `${production.apiId}-poster-item`,
                    gallery_id: gallery.id,
                    original_filename: `${production.apiId}.jpg`,
                    position: 1,
                    width: 1200,
                    height: 800,
                    format: 'image/jpeg',
                    title: {
                        nl: `${production.title.nl} poster`,
                        en: `${production.title.en} poster`,
                    },
                    link: {
                        url: getSeedImageUrl(index),
                    },
                },
            })

            return prisma.production.upsert({
                where: { apiId: production.apiId },
                update: {
                    title: production.title,
                    description_short: production.description_short,
                    teaser: production.teaser,
                    performer_type: production.performer_type,
                    attendance_mode: production.attendance_mode,
                    poster_gallery_id: gallery.id,
                    created_at: production.createdAt,
                },
                create: {
                    apiId: production.apiId,
                    title: production.title,
                    description_short: production.description_short,
                    teaser: production.teaser,
                    performer_type: production.performer_type,
                    attendance_mode: production.attendance_mode,
                    poster_gallery_id: gallery.id,
                    created_at: production.createdAt,
                },
            })
        })
    )

    const now = new Date()
    await Promise.all(
        seededProductions.map((production, index) => {
            const seedEntry = productionsSeed[index]
            const startsAt = new Date(now)
            startsAt.setDate(now.getDate() + (index + 1) * 7)

            const endsAt = new Date(startsAt)
            endsAt.setHours(startsAt.getHours() + 2)

            const eventApiId = `seed-event-${String(index + 1).padStart(3, '0')}`

            return prisma.event.upsert({
                where: { apiId: eventApiId },
                update: {
                    production_id: production.id,
                    starts_at: startsAt,
                    ends_at: endsAt,
                    info: {
                        nl: `Testevent ${index + 1} voor ${seedEntry.title.nl}`,
                        en: `Test event ${index + 1} for ${seedEntry.title.en}`,
                    },
                },
                create: {
                    apiId: eventApiId,
                    production_id: production.id,
                    starts_at: startsAt,
                    ends_at: endsAt,
                    info: {
                        nl: `Testevent ${index + 1} voor ${seedEntry.title.nl}`,
                        en: `Test event ${index + 1} for ${seedEntry.title.en}`,
                    },
                },
            })
        })
    )

    console.log('✅ Seed complete')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
