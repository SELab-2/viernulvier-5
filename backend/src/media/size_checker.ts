import { prisma } from "./prisma";
import axios from "axios";



// 2 things include a gallery and so media: tags and productions, let's grab the galleries used in these
// and then grab all the media items used in these which leads us to the actually used crops.

// update: there is not a single gallery in tags.


async function get_media_items(){
    const med = await prisma.item.findMany({});
    console.log(med.length);



    const productions = await prisma.production.findMany({
        where: {
            OR: [{
                NOT: {
                    media_gallery: null
                },
            }, {
                NOT: {
                    poster_gallery: null
                },
            },{
                NOT: {
                    review_gallery: null
                }
            }]
        },
        include: {
            media_gallery: true,
            poster_gallery: true,
            review_gallery: true,
        }
    });

    const galleries = new Set<any>();

    for (const production of productions){
        if (production.media_gallery) {
            galleries.add(
                await prisma.gallery.findUnique({
                    where: {id: production.media_gallery_id!},
                    include: {items: true}
                }));
        }
        if (production.review_gallery) {
            galleries.add(await prisma.gallery.findUnique({
                where: {id: production.review_gallery_id!},
                include: {items: true}
            }));

        }
        if (production.poster_gallery) {
            galleries.add(await prisma.gallery.findUnique({
                where: {id: production.poster_gallery_id!},
                include: {items: true}
            }));
        }
    }

    console.log("galleries:", galleries.size);
    const media_items = [];
    let index = 0;

    for (const gallery of galleries){

        for (const item of gallery.items){
            const db_item = await prisma.item.findUnique({
                where: {id: item.id,
                    NOT: {
                        crops: undefined,
                    }
                },
                include: {crops: true}
            });
            if (db_item) {
                media_items.push(db_item);
            }
        }
        if (index % 100 === 0) {
            console.log("index:", index);
        }
        index++;

    }

    console.log(media_items.length);

    const crops = new Set<any>();
    for (const item of media_items) {
        for (const crop of item.crops){
            crops.add(crop);
        }
    }
    console.log("done");
    return crops;
}


async function get_crops() {
    let crops = await prisma.crop.findMany({});
    console.log(crops.length);

    crops = await prisma.crop.findMany({
        where: {
            url: {
                not: null
            },
            OR: [
                { name: "FE3_header" },
                { name: "FE3_grid" }
            ]
        }
    });

    console.log(crops.length);
    return crops;
}

async function download_crop(crop: any) {
    const url = crop.url;
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
        });
        return Number(response.headers['content-length']); // bytes

        // console.log("File size:", fileSize, "bytes");
        // console.log("done downloading");
        // return fileSize;
    } catch (error) {
        console.log(error);
        console.log(url);
        console.log(crop.id);
        return 0;
    }
}


export async function main(){


    // const temp_crops = await get_media_items();
    // console.log(temp_crops.size);


    const crops = await get_crops();
    const crop_length = crops.length;
    const chunkSize = 20;
    let size = 0

    for (let i = 0; i < crops.length/chunkSize; i += 1) {
        console.log("chunk ", i, "of ", crops.length/chunkSize);
        const chunk = crops.slice(i, i + chunkSize);

        const results = await Promise.all(
            chunk.map(crop => download_crop(crop))
        );
        size += results.reduce((partialSum, a) => partialSum + a, 0);
    }
    console.log("total usage:", size, "bytes for ",crop_length, "crops" );

}

main();