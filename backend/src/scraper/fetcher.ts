import "dotenv/config";
import axios from "axios";

import type {
    APIProduction,
    APIEvent,
    APISpace,
    APIHall,
    APILocation,
    APIGenre, APIGallery, APIItem,

} from "./APItypes";

const api_key = process.env.API_KEY;
const headers = {
    "Accept": "application/ld+json",
    "X-AUTH-TOKEN": api_key
}
const api = `https://www.viernulvier.gent{url}`;



async function* fetchPagesFromURL<T = any>(url: string): AsyncGenerator<T[]> {
    let currentUrl = url;
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
        
        console.log(`Fetched page with ${members.length} items: ${currentUrl}`);
        yield members;
        
        if (!("next" in view)) {
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
}

export async function* fetchLocationsPages(): AsyncGenerator<APILocation[]> {
    yield* fetchPagesFromURL<APILocation>("/api/v1/locations?page=1");
}

export async function* fetchSpacesPages(): AsyncGenerator<APISpace[]> {
    yield* fetchPagesFromURL<APISpace>("/api/v1/spaces?page=1");
}

export async function* fetchHallsPages(): AsyncGenerator<APIHall[]> {
    yield* fetchPagesFromURL<APIHall>("/api/v1/halls?page=1");
}

export async function* fetchGenrePages(): AsyncGenerator<APIGenre[]> {
    yield* fetchPagesFromURL<APIGenre>("/api/v1/genres?page=1");
}
export async function* fetchGalleryPages(): AsyncGenerator<APIGallery[]> {
    yield* fetchPagesFromURL<APIGallery>("/api/v1/media/galleries?page=1");
}

export async function* fetchItemPages(): AsyncGenerator<APIItem[]> {
    yield* fetchPagesFromURL<APIItem>("/api/v1/media/items?page=1");
}



// export async function* fetchStatusesPages(): AsyncGenerator<APIStatus[]> {
//     yield* fetchPagesFromURL<APIStatus>("/api/v1/events/statuses?page=1");
// }


// fetchEvents();
// fetchCrops();
// fetchEventPrices();
// fetchGalleries();
// fetchGenres();
// fetchHalls();
// fetchGalleries();
// fetchGalleryItems();
// fetchLocations();
// fetchPrices();
// fetchRanks();
// fetchSpaces();
// fetchStatuses();
// fetchTags();
// fetchUitDatabankKeywords();
// fetchUitDatabankThemes();
// fetchUitDatabankTypes();