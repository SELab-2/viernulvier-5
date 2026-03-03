import axios from "axios";
import { prisma } from "./app/prisma";
import {fetchProductions} from "./fetcher";



async function storeData() {
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
                events: item.events,
                genre_production: item.genres,
                // media_gallery: item.media_gallery,
                // poster_gallery: item.poster_gallery,
                // review_gallery: item.review_gallery,





            },
        });
    }
}

storeData()
    .then(() => console.log("Data saved"))
    .catch(console.error)
    .finally(() => prisma.$disconnect());







