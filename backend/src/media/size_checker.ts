import { prisma } from "./prisma";
import axios from "axios";
import path from 'path';
import * as fs from "node:fs";



// 2 things include a gallery and so media: tags and productions, let's grab the galleries used in these
// and then grab all the media items used in these which leads us to the actually used crops.

// update: there is not a single gallery in tags.

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

        const filename = `${crop.id}.jpg`;
        const filepath = path.join(process.env.FILE_LOCATION!, filename);
        fs.writeFileSync(filepath, response.data);
        console.log(`Saved: ${filepath}`);
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