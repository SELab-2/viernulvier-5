import { prisma } from "./prisma";
import axios from "axios";
import path from 'path';
import * as fs from "node:fs";
import { crop } from "@prisma/client";



// 2 things include a gallery and so media: tags and productions, let's grab the galleries used in these
// and then grab all the media items used in these which leads us to the actually used crops.

// update: there is not a single gallery in tags.

async function get_crops(): Promise<crop[]> {
    return prisma.crop.findMany({
        where: {
            url: {
                not: null
            },
            OR: [
                {name: "FE3_header"},
                {name: "FE3_grid"}
            ]
        }
    });
}

async function download_crop(crop: crop) {
    const url = crop.url!;
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
        });
        let extension = 'webp'
        if (response.headers) {
            const contentType = response.headers['content-type'];
            if (contentType !== undefined) {
                const match = contentType.match(/\/([a-zA-Z0-9]+)/);
                if (match) {
                    extension = match[1];
                }
            }
        }
        const filename = `${crop.id}.${extension}`;
        const filepath = path.join(process.env.FILE_LOCATION!, filename);
        fs.writeFileSync(filepath, response.data);
        const fullPath = path.resolve(filepath);
        await prisma.crop.update({
                where: {
                    id: crop.id,
                },
                data: {
                    file_location: fullPath
                }
            }
        )


    } catch (error) {
        console.log(error);
        console.log(url);
        console.log(crop.id);
    }
}


export async function download_crops(){

    const crops = await get_crops();
    if (crops === undefined){
        console.log("No crops found.");
        return;
    }
    const chunkSize = 20;

    for (let i = 0; i < crops.length; i += chunkSize) {
        console.log("chunk ", i/chunkSize, "of ", crops.length/chunkSize);
        const chunk = crops.slice(i, i + chunkSize);

        await Promise.all(
            chunk.map((crop) => download_crop(crop))
        );
    }
    console.log("locally downloaded all crops");

}

export default {
    download_crops
}
