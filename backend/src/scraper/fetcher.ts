import axios from "axios";
const api_key = "60d4b42665b2251a14ac5c5bf5adabab3673bcdfbc68"
const headers = {
    "Accept": "application/ld+json",
    "X-AUTH-TOKEN": api_key
}
const api = `https://www.viernulvier.gent{url}`;



/*
--------------------------------------
--------------TYPES-------------------
--------------------------------------

*/


export type LocalizedString = {
  nl?: string;
  en?: string;
  fr?: string;
};

export type APIProduction = {
    "@context":string;
    "@id": string;
    "@type": string;

    created_at: string;
    updated_at: string;

    vendor_id: string;
    box_office_id:number;
    
    performer_field:string;
    performer_type: string;
    attendance_mode: string;

    supertitle: LocalizedString;
    title: LocalizedString;
    artist: LocalizedString;
    meta_title: LocalizedString;
    meta_description: LocalizedString;
    tagline:LocalizedString;
    teaser:LocalizedString;
    description:LocalizedString;
    description_extra:LocalizedString;
    description_2:LocalizedString;
    quote:LocalizedString;
    quote_source:LocalizedString;
    programme:LocalizedString;
    info:LocalizedString;
    description_short:LocalizedString;
    eticket_info:LocalizedString;
    custom_data:LocalizedString;
    
    video_1:LocalizedString;
    video_2: LocalizedString;

    genres: string[];

    events: string[];
    
    media_gallery:string;
    review_gallery:string;
    poster_gallery:string;

    uitdatabank_keywords: string[];
    uitdatabank_theme:string;
    uitdatabank_type:string;
};

/*
--------------------------------------
--------------TYPES-------------------
--------------------------------------

*/

async function fetchFromURL(url: string){
    const all_data= []
    while (true){
        const link = api.replace("{url}", url)
        const response = await axios.get(link, {headers: headers});
        if (response.status === 200){
            const data = response.data;
            if (data.view === undefined){
                break;
            }
            const view = data["view"];
            const members = data["member"];
            all_data.push(...members);
            console.log(`succesfully retrieved list: ${url}`);
            if (!("next" in view)) {
                break;
            }
            url = data["view"]["next"];
        }else {
            console.log("Error:", response.status);
            console.log(response.statusText);
            break;
        }
    }
    return all_data
}

async function fetchSinglePageFromURL(url: string) {

    const link = api.replace("{url}", url)
    const response = await axios.get(link, {headers: headers});
    if (response.status === 200){
        const data = response.data;
        if (data.view === undefined){
            return data;
        }
        const view = data["view"];
        const members = data["member"];

        console.log(`succesfully retrieved list: ${url}`);
        
        return members;
        //url = data["view"]["next"];
    }else {
        console.log("Error:", response.status);
        console.log(response.statusText);
        return [];
    }
}

export async function fetchProductions() {
    const url = "/api/v1/productions?page=1"
    //return fetchFromURL(url);
    const data:APIProduction[] = await fetchSinglePageFromURL(url);
    return data
}

export async function fetchEvents(){
    const url = "/api/v1/events?page=1"
    return fetchFromURL(url);
}

export async function fetchCrops(){
    const url = "/api/v1/media/items/crops?page=1"
    return fetchFromURL(url);
}

export async function fetchEventPrices(){
    const url = "/api/v1/events/prices?page=1"
    return fetchFromURL(url);
}

export async function fetchGalleries(){
    const url = "/api/v1/media/galleries?page=1";
    return fetchFromURL(url);
}

export async function fetchGenres(){
    const url = "/api/v1/genres?page=1";
    return fetchFromURL(url);
}

export async function fetchHalls(){
    const url = "/api/v1/halls?page=1";
    return fetchFromURL(url);
}

export async function fetchGalleryItems(){
    const url = "/api/v1/media/items?page=1";
    return fetchFromURL(url);
}

export async function fetchLocations(){
    const url = "/api/v1/locations?page=1";
    return fetchFromURL(url);
}

export async function fetchPrices(){
    const url = "/api/v1/prices?page=1";
    return fetchFromURL(url);
}

export async function fetchRanks(){
    const url = "/api/v1/prices/ranks?page=1";
    return fetchFromURL(url);
}

export async function fetchSpaces(){
    const url = "/api/v1/spaces?page=1";
    return fetchFromURL(url);
}

export async function fetchStatuses(){
    const url = "/api/v1/events/statuses?page=1";
    return fetchFromURL(url);
}

export async function fetchTags(){
    const url = "/api/v1/tags?page=1";
    return fetchFromURL(url);
}
export async function fetchUitDatabankKeywords(){
    const url = "/api/v1/uitdatabank/keywords?page=1";
    return fetchFromURL(url);
}

export async function fetchUitDatabankThemes(){
    const url = "/api/v1/uitdatabank/themes?page=1";
    return fetchFromURL(url);
}

export async function fetchUitDatabankTypes(){
    const url = "/api/v1/uitdatabank/types?page=1";
    return fetchFromURL(url);
}


// fetchProductions();
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