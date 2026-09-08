export interface PublicBranch {
    id: string;
    name: string;
    address: string;
    lat: string | null;
    lng: string | null;
    phone: string | null;
    openingTime: string | null;
    closingTime: string | null;
    ownershipType: string;
}

export interface PublicMenuCategory {
    id: string;
    name: string;
    displayOrder: number;
}

export interface PublicMenuItem {
    id: string;
    categoryId: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    category: PublicMenuCategory;
}

export interface PublicMenuCategoryJoined {
    id: string;
    category_id: string;
    name: string;
    description: string | null;
    price: string;
    image_url: string | null;
    category: {
        id: string;
        name: string;
        display_order: number;
    } | null;
}

export interface LandingTestimonial {
    quote: string;
    name: string;
    role: string;
}
