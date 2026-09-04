export type BranchMarker = {
    id: string;
    name: string;
    address: string;
    lat: string | null;
    lng: string | null;
    phone: string | null;
    openingTime: string | null;
    closingTime: string | null;
    status: string;
    ownershipType: string;
    managerName: string | null;
};

export type BranchMarkerJoined = {
    id: string;
    name: string;
    address: string;
    lat: string | null;
    lng: string | null;
    phone: string | null;
    opening_time: string | null;
    closing_time: string | null;
    status: string;
    ownership_type: string;
    manager: { name: string } | null;
};
