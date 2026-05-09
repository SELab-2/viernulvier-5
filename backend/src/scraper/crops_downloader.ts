import { prisma } from "./prisma";
import axios from "axios";
import path from 'path';
import * as fs from "node:fs";
import { crop } from "@prisma/client";



// 2 things include a gallery and so media: tags and productions, let's grab the galleries used in these
// and then grab all the media items used in these which leads us to the actually used crops.

// update: there is not a single gallery in tags.


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
            if (contentType !== undefined && contentType != null && typeof contentType === 'string') {
                const match = contentType!.match(/\/([a-zA-Z0-9]+)/);
                if (match) {
                    extension = match[1];
                }
            }
        }


        const filename = `${crop.id}.${extension}`;
        const filepath = path.join(process.env.CROP_LOCATION!, filename);
        fs.writeFileSync(filepath, response.data);
        await prisma.crop.update({
                where: {
                    id: crop.id,
                },
                data: {
                    file_location: filename
                }
            }
        )


    } catch (error) {
        console.log(error);
        console.log(url);
        console.log(crop.id);
    }
}


export async function download_crops(crops: crop[]){
    if (crops === undefined || crops.length === 0){
        return;
    }

    const chunkSize = 20;

    for (let i = 0; i < crops.length; i += chunkSize) {
        const chunk = crops.slice(i, i + chunkSize);

        await Promise.all(
            chunk.map((crop) => download_crop(crop))
        );
    }

}

export default {
    download_crops
}
