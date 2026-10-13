import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { Clock, Coffee, MapPin, Phone, User } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { SectionHeader } from "@/components/shared/section-header";
import { Badge } from "@/components/ui/badge";
import {
    MapControls,
    Map as MapLibreMap,
    MapMarker,
    MapPopup,
    type MapViewport,
    MarkerContent,
    MarkerTooltip,
} from "@/components/ui/map";
import {
    BranchSidebarPanel,
    type ParsedBranch,
} from "@/features/maps/components/branch-sidebar-panel";
import { useMapBranches } from "@/features/maps/hooks/useMapsQueries";

const DEFAULT_VIEWPORT: MapViewport = {
    center: [104.756, -2.987],
    zoom: 12,
    bearing: 0,
    pitch: 0,
};

const routeApi = getRouteApi("/_dashboard/maps");

export const MapsPage = () => {
    const { q } = routeApi.useSearch();
    const navigate = useNavigate();
    const { data } = useMapBranches(q);
    if (data && !data.success) {
        throw new Error(data.error);
    }
    const branches = data?.success ? data.data : [];
    const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
    const [isListOpen, setIsListOpen] = useState(false);
    const [viewport, setViewport] = useState<MapViewport>(DEFAULT_VIEWPORT);

    const onSearchChange = useCallback(
        (searchQuery: string) => {
            navigate({
                to: ".",
                search: (prev) => ({
                    ...prev,
                    q: searchQuery || undefined,
                }),
                replace: true,
            });
        },
        [navigate],
    );

    const onToggleList = useCallback(() => {
        setIsListOpen((prev) => !prev);
    }, []);

    const filteredBranches = useMemo(() => {
        return branches.reduce<ParsedBranch[]>((acc, b) => {
            if (!b.lat || !b.lng) return acc;

            const numericLat = Number.parseFloat(b.lat);
            const numericLng = Number.parseFloat(b.lng);
            if (!Number.isFinite(numericLat) || !Number.isFinite(numericLng))
                return acc;

            acc.push({
                ...b,
                numericLat,
                numericLng,
            });
            return acc;
        }, []);
    }, [branches]);

    const handleSelectBranch = useCallback((branch: ParsedBranch) => {
        setActiveMarkerId(branch.id);
        setViewport((prev) => ({
            ...prev,
            center: [branch.numericLng, branch.numericLat],
            zoom: 15,
        }));
        if (typeof window !== "undefined" && window.innerWidth < 768)
            setIsListOpen(false);
    }, []);

    return (
        <div className="flex h-[calc(100vh-(--spacing(16))-(--spacing(4)))] min-h-0 flex-1 flex-col gap-4">
            <SectionHeader
                title="Branch Maps"
                subtitle="Explore branch locations, ownership types, and operational details."
            />

            <div className="relative flex-1 w-full overflow-hidden rounded-lg border bg-muted min-h-100">
                <MapLibreMap
                    viewport={viewport}
                    onViewportChange={setViewport}
                    className="absolute inset-0 h-full w-full">
                    <MapControls
                        position="bottom-right"
                        showZoom
                        showCompass
                        showLocate
                        showFullscreen
                    />

                    {filteredBranches.map((branch) => {
                        const isActiveMarker = activeMarkerId === branch.id;
                        const isCorporate =
                            branch.ownershipType === "corporate";
                        const isActiveStatus = branch.status === "active";
                        const hasTimes =
                            branch.openingTime || branch.closingTime;

                        return (
                            <MapMarker
                                key={branch.id}
                                longitude={branch.numericLng}
                                latitude={branch.numericLat}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMarkerId((prev) =>
                                        prev === branch.id ? null : branch.id,
                                    );
                                }}>
                                <MarkerContent className="group transition-transform hover:scale-110">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-lg transition-colors ${
                                            isCorporate
                                                ? "bg-blue-500 border-white"
                                                : "bg-orange-500 border-white"
                                        } ${isActiveMarker ? "scale-110 ring-4 ring-primary/30" : ""}`}>
                                        <Coffee className="h-4 w-4 text-white" />
                                    </div>
                                </MarkerContent>

                                {!isActiveMarker ? (
                                    <MarkerTooltip offset={20}>
                                        <span className="font-medium">
                                            {branch.name}
                                        </span>
                                    </MarkerTooltip>
                                ) : null}

                                {isActiveMarker ? (
                                    <MapPopup
                                        longitude={branch.numericLng}
                                        latitude={branch.numericLat}
                                        closeButton
                                        onClose={() => setActiveMarkerId(null)}
                                        offset={20}
                                        maxWidth="320px"
                                        className="overflow-hidden border-0 p-0">
                                        <div className="border-b border-border/50 bg-primary/10 px-4 py-3">
                                            <h3 className="text-base font-semibold leading-tight">
                                                {branch.name}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge
                                                    variant={
                                                        isActiveStatus
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                    className="h-5 text-[10px]">
                                                    {branch.status}
                                                </Badge>
                                                <Badge
                                                    variant="outline"
                                                    className="h-5 text-[10px] capitalize">
                                                    {branch.ownershipType}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-3 p-4">
                                            <div className="flex items-start gap-2.5 text-sm">
                                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="leading-relaxed text-muted-foreground">
                                                    {branch.address}
                                                </span>
                                            </div>
                                            {hasTimes ? (
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span>
                                                        {branch.openingTime?.slice(
                                                            0,
                                                            5,
                                                        ) ?? "--:--"}{" "}
                                                        -{" "}
                                                        {branch.closingTime?.slice(
                                                            0,
                                                            5,
                                                        ) ?? "--:--"}
                                                    </span>
                                                </div>
                                            ) : null}
                                            {branch.phone ? (
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span>{branch.phone}</span>
                                                </div>
                                            ) : null}
                                            {branch.managerName ? (
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                    <span>
                                                        Manager:{" "}
                                                        {branch.managerName}
                                                    </span>
                                                </div>
                                            ) : null}
                                        </div>
                                    </MapPopup>
                                ) : null}
                            </MapMarker>
                        );
                    })}
                </MapLibreMap>

                <BranchSidebarPanel
                    searchQuery={q ?? ""}
                    onSearchChange={onSearchChange}
                    isListOpen={isListOpen}
                    onToggleList={onToggleList}
                    filteredBranches={filteredBranches}
                    activeMarkerId={activeMarkerId}
                    onSelectBranch={handleSelectBranch}
                />
            </div>
        </div>
    );
};
