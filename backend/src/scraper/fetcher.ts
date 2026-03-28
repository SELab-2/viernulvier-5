import "dotenv/config";
import axios from "axios";
import axiosRetry from "axios-retry";
import { log, updateStatus } from "./logger";


// if we request too fast, for rate limits
axiosRetry(axios, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => {
        return error.code === 'ECONNRESET' || axiosRetry.isNetworkError(error);
    }
});

import type {
    APIProduction,
    APIEvent,
    APISpace,
    APIHall,
    APILocation,
    APIGenre, APIGallery, APIItem, APIEventPrice, APITag, APICrop, APIUitKeyword, APIUitTheme, APIUitType,

} from "./APItypes";

const api_key = process.env.API_KEY;
const headers = {
    "Accept": "application/ld+json",
    "X-AUTH-TOKEN": api_key
}
const api = `https://www.viernulvier.gent{url}`;

// Helper function to fetch items in parallel chunks to avoid overwhelming the API
async function fetchInChunks<T>(urls: string[], chunkSize: number): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < urls.length; i += chunkSize) {
        const chunk = urls.slice(i, i + chunkSize);
        const promises = chunk.map(url => {
            const link = api.replace("{url}", url);
            return axios.get(link, { headers: headers }).then(res => res.data);
        });
        
        updateStatus("Network", `Fetching sub-chunk ${i / chunkSize + 1}/${Math.ceil(urls.length / chunkSize)} (${urls.length} items)`);
        const chunkResults = await Promise.all(promises);
        results.push(...chunkResults);
    }
    return results;
}


async function* fetchPagesFromURL<T = any>(url: string, per_item: boolean=false): AsyncGenerator<T[]> {
    let currentUrl = url;
    // Append itemsPerPage to the initial URL if not present
    if (!currentUrl.includes("itemsPerPage=")) {
        const separator = currentUrl.includes("?") ? "&" : "?";
        currentUrl += `${separator}itemsPerPage=50`;
    }

    while (true) {
        const link = api.replace("{url}", currentUrl);
        const response = await axios.get(link, { headers: headers });

        
        if (response.status !== 200) {
            console.error("Error:", response.status, response.statusText);
            break;
        }
        
        const data = response.data;
        
        // If no view, this is a single item response
        if (data.view === undefined) {
            yield data.member || [data];
            break;
        }
        
        const view = data["view"];
        const members = data["member"];
        if (per_item && members && members.length > 0) {
            log(`Fetching ${members.length} items in parallel for: ${currentUrl}`);
            const itemUrls = members.map((m: any) => m["@id"]);
            // Use a chunk size of 10 for parallel fetching
            const return_members = await fetchInChunks<T>(itemUrls, 10);
            yield return_members;
        } else {
            log(`Fetched page with ${members.length} items: ${currentUrl}`);
            yield members;
        }
        
        if (!view || !("next" in view)) {
            break;
        }
        
        currentUrl = view.next;
    }
}




// Paginated versions that yield pages one at a time
export async function* fetchProductionsPages(): AsyncGenerator<APIProduction[]> {
    yield* fetchPagesFromURL<APIProduction>("/api/v1/productions?page=1");
}

export async function* fetchEventsPages(): AsyncGenerator<APIEvent[]> {
    yield* fetchPagesFromURL<APIEvent>("/api/v1/events?page=1");
    // depending on per page or per item, the 'production' field will have @type and @id or be filled in
}

export async function* fetchLocationsPages(): AsyncGenerator<APILocation[]> {
    yield* fetchPagesFromURL<APILocation>("/api/v1/locations?page=1");
    // depending on per page or per item, the 'space' field will have a string or be filled in
}

export async function* fetchSpacesPages(): AsyncGenerator<APISpace[]> {
    yield* fetchPagesFromURL<APISpace>("/api/v1/spaces?page=1");
    // depending on per page or per item, the 'location' and 'halls' fields will have a string or be filled in
}

export async function* fetchHallsPages(): AsyncGenerator<APIHall[]> {
    yield* fetchPagesFromURL<APIHall>("/api/v1/halls?page=1");
    // depending on per page or per item, the 'space' field will have a string or be filled in
}

export async function* fetchGenrePages(): AsyncGenerator<APIGenre[]> {
    yield* fetchPagesFromURL<APIGenre>("/api/v1/genres?page=1");

}
export async function* fetchGalleryPages(): AsyncGenerator<APIGallery[]> {
    yield* fetchPagesFromURL<APIGallery>("/api/v1/media/galleries?page=1");
    // depending on per page or per item, the 'items' field will have a string or be filled in
}

export async function* fetchItemPages(): AsyncGenerator<APIItem[]> {
    yield* fetchPagesFromURL<APIItem>("/api/v1/media/items?page=1", true);
    // depending on per page or per item, the 'crop' field will be absent.
}

export async function* fetchEventPricePages(): AsyncGenerator<APIEventPrice[]>{
    yield* fetchPagesFromURL<APIEventPrice>("/api/v1/events/prices?page=1");
    // depending on per page or per item, the 'event', 'price', 'rank' fields will have a string or be filled in
}

export async function* fetchTagPages(): AsyncGenerator<APITag[]>{
    yield* fetchPagesFromURL<APITag>("/api/v1/tags?page=1");
    // depending on per page or per item, the 'gallery' field will have a string or be filled in
}

export async function* fetchCropPages(): AsyncGenerator<APICrop[]> {
    yield* fetchPagesFromURL<APICrop>("/api/v1/media/items/crops?page=1");
}

export async function* fetchUitKeywordPages(): AsyncGenerator<APIUitKeyword[]>{
    yield* fetchPagesFromURL<APIUitKeyword>("/api/v1/uitdatabank/keywords?page=1");
}

export async function* fetchUitThemePages(): AsyncGenerator<APIUitTheme[]>{
    yield* fetchPagesFromURL<APIUitTheme>("/api/v1/uitdatabank/themes?page=1");
}

export async function* fetchUitTypePages(): AsyncGenerator<APIUitType[]>{
    yield* fetchPagesFromURL<APIUitType>("/api/v1/uitdatabank/types?page=1");
}
