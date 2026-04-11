
/*
--------------------------------------
--------------TYPES-------------------
--------------------------------------

*/

// Sometimes tables referebnce eachother like this
export type foreignKey = {
    "@type":string;
    "@id": string;
}

// For fields with multiple translations
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
};

export type APILocation = {
  "@context": string;
  "@id": string;
  "@type": string;
  created_at: string;
  updated_at: string;
  name: LocalizedString;
  code: string;
  street: string;
  number: string;
  postal_code: string;
  city: string;
  phone_1: string;
  phone_2: string;
  own_location: string;
  country: string;
  spaces: string[];
};

export type APISpace = {
  "@context": string;
  "@id": string;
  "@type": string;
  created_at: string;
  updated_at: string;
  vendor_id: string;
  name: LocalizedString;
  location: string;
  halls: string[];
};

export type APIHall = {
  "@context": string;
  "@id": string;
  "@type": string;
  created_at: string;
  updated_at: string;
  vendor_id: string;
  box_office_id: string;
  seat_selection: string;
  open_seating: string;
  name: LocalizedString;
  remark: LocalizedString;
  space: string;
};

export type APIEvent = {
  "@context": string;
  "@id": string;
  "@type": string;
  created_at: string;
  updated_at: string;
  starts_at: string;
  ends_at: string;
  intermission_at: string;
  doors_at: string;
  box_office_id: string;
  vendor_id: string;
  max_tickets_per_order: number;
  secure: boolean;
  sms_verification: boolean;
  production: foreignKey; // apiID that references Production
  status: string; // references status
  hall: string; // references hall
  prices: string[]; // references prices
  info: LocalizedString;
  eticket_info: LocalizedString;
  external_order_url: LocalizedString;
  order_url: string;
};

export type APIGenre = {
    "@context": string;
    "@id": string;
    "@type": string;
    created_at: string;
    updated_at: string;
    type: string;
    use_as: string;
    vendor_id: string;
    name: LocalizedString;
    slug: LocalizedString;
    description: LocalizedString;
};

export type APIGallery = {
    "@context": string;
    "@id": string;
    "@type": string;
    created_at: string;
    updated_at: string;
    name: string;
    items: string[];
}

export type APIItem = {
    "@context": string;
    "@id": string;
    "@type": string;
    created_at: string;
    updated_at: string;
    type: string;
    original_filename: string;
    position: number;
    width: number;
    height: number;
    format: string;
    gallery: string;
    title: LocalizedString;
    description: LocalizedString;
    credits: LocalizedString;
    link: LocalizedString;
    crops: foreignKey[] // reference crops
}

export type APIEventPrice = {
    "@context": string;
    "@id": string;
    "@type": string;
    created_at: string;
    updated_at: string;
    available: number;
    amount: string;
    box_office_id: string;
    contingent_id: number;
    expires_at: string;
    event: string; // reference to event
    price: string; // reference to price
    rank: string; // reference to rank

}

export type APITag = {
    "@context": string;
    "@id": string;
    "@type": string;
    created_at: string;
    updated_at: string;
    source: string;
    sourceType: string;
    enable: string;
    code: string;
    name: LocalizedString;
    short_description: LocalizedString;
    url: string;
    url_title: LocalizedString;
    gallery: string;
    expires_after: number;
    automatically_assigned: boolean;
    external: boolean;
}

export type APICrop = {
    "@context": string;
    "@id": string;
    "@type": string;
    created_at: string;
    updated_at: string;
    name: string;
    url: string;
}

/*
--------------------------------------
--------------TYPES-------------------
--------------------------------------

*/