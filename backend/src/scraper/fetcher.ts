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


async function* fetchPagesFromURL<T = any>(url: string, per_item: boolean=false, cutoff_timestamp?: Date): AsyncGenerator<{ members: T[], totalItems: number }> {
    let currentUrl = url;
    const baseUrl = "https://www.viernulvier.gent";

    while (true) {
        // Build the full URL object
        const link = currentUrl.startsWith('http') ? currentUrl : `${baseUrl}${currentUrl.startsWith('/') ? '' : '/'}${currentUrl}`;
        const urlObj = new URL(link);

        // Ensure itemsPerPage is set
        if (!urlObj.searchParams.has("itemsPerPage")) {
            urlObj.searchParams.set("itemsPerPage", "30");
        }

        // Force the date filter if it's missing (helps if view.next doesn't include it)
        if (cutoff_timestamp && !urlObj.searchParams.has("updatedAt[after]")) {
            urlObj.searchParams.set("updatedAt[after]", cutoff_timestamp.toISOString());
        }

        const finalUrl = urlObj.toString();
        log(`GET ${finalUrl}`);
        const response = await axios.get(finalUrl, { headers: headers });

        if (response.status !== 200) {
            console.error("Error:", response.status, response.statusText);
            break;
        }

        const data = response.data;
        // Support both hydra-prefixed and non-prefixed keys
        const totalItems = data["totalItems"] || data["hydra:totalItems"] || 0;
        const view = data["view"] || data["hydra:view"];
        const members = data["member"] || data["hydra:member"];

        // If no view, this might be a single item or the last page
        if (view === undefined) {
            yield { members: members || [data], totalItems: totalItems || 1 };
            break;
        }

        if (per_item && members && members.length > 0) {
            updateStatus("Network", `Fetching details for ${members.length} items...`);
            const itemUrls = members.map((m: any) => m["@id"] || m["id"]);
            const return_members = await fetchInChunks<T>(itemUrls, 10);
            yield { members: return_members, totalItems };
        } else {
            yield { members: members || [], totalItems };
        }

        if (!view || !("next" in view || "hydra:next" in view)) {
            break;
        }

        currentUrl = view.next || view["hydra:next"];
    }
}




// Paginated versions that yield pages one at a time
export async function* fetchProductionsPages(cutoff?: Date): AsyncGenerator<{ members: APIProduction[], totalItems: number }> {
    yield* fetchPagesFromURL<APIProduction>("/api/v1/productions?page=1", false, cutoff);
}

export async function* fetchEventsPages(cutoff?: Date): AsyncGenerator<{ members: APIEvent[], totalItems: number }> {
    yield* fetchPagesFromURL<APIEvent>("/api/v1/events?page=1", false, cutoff);
}

export async function* fetchLocationsPages(cutoff?: Date): AsyncGenerator<{ members: APILocation[], totalItems: number }> {
    yield* fetchPagesFromURL<APILocation>("/api/v1/locations?page=1", false, cutoff);
}

export async function* fetchSpacesPages(cutoff?: Date): AsyncGenerator<{ members: APISpace[], totalItems: number }> {
    yield* fetchPagesFromURL<APISpace>("/api/v1/spaces?page=1", false, cutoff);
}

export async function* fetchHallsPages(cutoff?: Date): AsyncGenerator<{ members: APIHall[], totalItems: number }> {
    yield* fetchPagesFromURL<APIHall>("/api/v1/halls?page=1", false, cutoff);
}

export async function* fetchGenrePages(cutoff?: Date): AsyncGenerator<{ members: APIGenre[], totalItems: number }> {
    yield* fetchPagesFromURL<APIGenre>("/api/v1/genres?page=1", false, cutoff);

}
export async function* fetchGalleryPages(cutoff?: Date): AsyncGenerator<{ members: APIGallery[], totalItems: number }> {
    yield* fetchPagesFromURL<APIGallery>("/api/v1/media/galleries?page=1", false, cutoff);
}

export async function* fetchItemPages(cutoff?: Date): AsyncGenerator<{ members: APIItem[], totalItems: number }> {
    yield* fetchPagesFromURL<APIItem>("/api/v1/media/items?page=1", true, cutoff);
}

export async function* fetchEventPricePages(cutoff?: Date): AsyncGenerator<{ members: APIEventPrice[], totalItems: number }>{
    yield* fetchPagesFromURL<APIEventPrice>("/api/v1/events/prices?page=1", false, cutoff);
}

export async function* fetchTagPages(cutoff?: Date): AsyncGenerator<{ members: APITag[], totalItems: number }>{
    yield* fetchPagesFromURL<APITag>("/api/v1/tags?page=1", false, cutoff);
}

export async function* fetchCropPages(cutoff?: Date): AsyncGenerator<{ members: APICrop[], totalItems: number }> {
    yield* fetchPagesFromURL<APICrop>("/api/v1/media/items/crops?page=1", false, cutoff);
}

export async function* fetchUitKeywordPages(cutoff?: Date): AsyncGenerator<{ members: APIUitKeyword[], totalItems: number }>{
    yield* fetchPagesFromURL<APIUitKeyword>("/api/v1/uitdatabank/keywords?page=1", false, cutoff);
}

export async function* fetchUitThemePages(cutoff?: Date): AsyncGenerator<{ members: APIUitTheme[], totalItems: number }>{
    yield* fetchPagesFromURL<APIUitTheme>("/api/v1/uitdatabank/themes?page=1", false, cutoff);
}

export async function* fetchUitTypePages(cutoff?: Date): AsyncGenerator<{ members: APIUitType[], totalItems: number }>{
    yield* fetchPagesFromURL<APIUitType>("/api/v1/uitdatabank/types?page=1", false, cutoff);
}

