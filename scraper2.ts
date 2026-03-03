import { prisma } from "./app/prisma";
import {
    fetchProductions,
    fetchGenres,
    fetchRanks,
    fetchPrices,
    fetchLocations,
    fetchGalleries,
    fetchStatuses, fetchUitDatabankKeywords, fetchUitDatabankTypes, fetchUitDatabankThemes
} from "./fetcher";



async function storeProduction() {
    const data = await fetchProductions();

    // Assuming the API returns an array of items
    await prisma.production.deleteMany({});
    for (const item of data) {
        await prisma.production.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                vendor_id: item.vendor_id,
                box_office_id: item.box_office_id,
                performer_field: item.performer_field,
                attendance_mode: item.attendance_mode,
                super_title: item.super_title,
                title: item.title,
                artist: item.artist,
                meta_title: item.meta_title,
                meta_description: item.meta_description,
                tagline: item.tagline,
                teaser: item.teaser,
                description: item.description,
                description_extra: item.description_extra,
                description_2: item.description_2,
                video_1: item.video_1,
                video_2: item.video_2,
                quote: item.quote_source,
                quote_source: item.quote_source,
                programme: item.programme,
                info: item.info,
                description_short: item.description_short,
                eticket_info: item.eticket_info,
                custom_data: item.custom_data,
                media_gallery_id: item.media_gallery_id,
                review_gallery_id: item.review_gallery_id,
                poster_gallery_id: item.poster_gallery_id,
                // uitdatabank_theme: item.uitdatabank_theme,
                // uitdatabank_type: item.uitdatabank_type,
                // events: item.events,
                // genre_production: item.genres,
                // media_gallery: item.media_gallery,
                // poster_gallery: item.poster_gallery,
                // review_gallery: item.review_gallery,





            },
        });
    }
}

// storeProduction()
//     .then(() => console.log("Data saved"))
//     .catch(console.error)
//     .finally(() => prisma.$disconnect());

// models zonder anderen nodig:

async function storeRanks(){
    const data = await fetchRanks();
    await prisma.rank.deleteMany({});
    for (const item of data){
        await prisma.rank.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                description: item.description,
                code: item.code,
                position: item.position,
                sold_out_buffer: item.sold_out_buffer,
                event_prices: item.event_prices,
            }
        });
    }
}

async function storePrices(){
    const data = await fetchPrices();
    await prisma.price.deleteMany({});
    for (const item of data){
        await prisma.price.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                type: item.type,
                visibility: item.visibility,
                code: item.code,
                description: item.description,
                minimum: item.minimum,
                maximum: item.maximum,
                step: item.step,
                order: item.order,
                auto_select_combo: item.auto_select_combo,
                include_in_price_range: item.include_in_price_range,
                cineville_box: item.cineville_box,
                membership: item.membership,
            }
        });
    }
}

async function storeLocations(){
    const data = await fetchLocations();
    await prisma.location.deleteMany({});
    for (const item of data){
        await prisma.location.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                name: item.name,
                code: item.code,
                street: item.street,
                number: item.number,
                postal_code: item.postal_code,
                city: item.city,
                phone_1: item.phone_1,
                phone_2: item.phone_2,
                own_location: item.own_location,
                country: item.country,
                uitdatabank_id: item.uitdatabank_id,
            }
        });
    }
}

async function storeGalleries(){
    const data = await fetchGalleries();
    await prisma.gallery.deleteMany({});
    for (const item of data){
        await prisma.gallery.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                name: item.name,
                gallery_item: item.gallery_item,
                //TODO: fix gallery item
            }

        });
    }
}


async function storeStatuses(){
    const data = await fetchStatuses();
    await prisma.status.deleteMany({});
    for (const item of data){
        await prisma.status.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                name: item.name,
                short_name: item.short_name,
                fixed: item.fixed,
                visible: item.visible,
                bookable: item.bookable
            }
        });
    }
}

async function storeUitDatabankKeywords(){
    const data = await fetchUitDatabankKeywords();
    await prisma.uitdatabank_keywords.deleteMany({});
    for (const item of data){
        await prisma.uitdatabank_keywords.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                name: item.name,
            }
        });
    }
}

async function storeUitDatabankTypes(){
    const data = await fetchUitDatabankTypes();
    await prisma.uitdatabank_types.deleteMany({});
    for (const item of data){
        await prisma.uitdatabank_types.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                name: item.name,
                cdb_cat_id: item.cdb_cat_id,
            }
        });
    }
}

async function storeUitDatabankThemes(){
    const data = await fetchUitDatabankThemes();
    await prisma.uitdatabank_themes.deleteMany({});
    for (const item of data){
        await prisma.uitdatabank_themes.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                name: item.name,
                cdb_cat_id: item.cdb_cat_id,
            }
        });
    }
}




async function storeGenre() {
    const data = await fetchGenres();
    await prisma.genre.deleteMany({});

    for (const item of data) {
        await prisma.genre.create({
            data: {
                created_at: item.created_at,
                updated_at: item.updated_at,
                id: item.id,
                type: item.type,
                use_as: item.use_as,
                vendor_id: item.vendor_id,
                name: item.name,
                slug: item.slug,
                description: item.description,
                //TODO: nog de connectie met productie

            }
        });
    }

}



storeProduction();
storeRanks();
storePrices();
storeLocations();
storeGalleries();
storeStatuses();
storeUitDatabankKeywords();
storeUitDatabankThemes();
storeUitDatabankTypes()
storeGenre();

