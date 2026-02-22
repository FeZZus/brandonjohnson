'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import { Icon, DomEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RankedPostcode } from '../api/postcodes/route';

const SEARCH_MARKER_COLOR = '#EF4444'; // Red color for search result marker
const SEARCH_CIRCLE_COLOR = '#6366F1'; // Indigo color for search radius circle
const SEARCH_MARKER_SIZE = 40; // Smaller size for search marker

// Helper function to get color based on business density
function getDensityColor(count: number): string {
    if (count === 0) return '#E5E7EB'; // Gray for empty
    if (count <= 5) return '#86EFAC'; // Light green
    if (count <= 10) return '#FDE047'; // Yellow
    if (count <= 20) return '#FDBA74'; // Orange
    return '#FCA5A5'; // Red for high density
}

// Cache for marker icons
const iconCache = new Map<string, Icon>();

// Search result marker icon - smaller yellow/amber pin
function createSearchMarkerIcon(): Icon {
    const cacheKey = 'search';

    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)!;
    }

    const svg = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="12" fill="${SEARCH_MARKER_COLOR}" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="20" r="4" fill="white"/>
    </svg>`;

    const encodedSvg = encodeURIComponent(svg);
    const icon = new Icon({
        iconUrl: `data:image/svg+xml,${encodedSvg}`,
        iconSize: [SEARCH_MARKER_SIZE, SEARCH_MARKER_SIZE],
        iconAnchor: [SEARCH_MARKER_SIZE / 2, SEARCH_MARKER_SIZE / 2],
        popupAnchor: [0, -SEARCH_MARKER_SIZE / 2],
    });

    iconCache.set(cacheKey, icon);
    return icon;
}

// Component to fit map bounds to show all markers
function MapBounds({ postcodes }: { postcodes: RankedPostcode[] }) {
    const map = useMap();

    useEffect(() => {
        const validPostcodes = postcodes.filter(pc => pc.lat !== undefined && pc.lng !== undefined);
        if (validPostcodes.length > 0) {
            const bounds = validPostcodes.map(pc => [pc.lat!, pc.lng!] as [number, number]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [postcodes, map]);
    return null;
}

// Component to handle map resize when container size changes
function MapResize() {
    const map = useMap();

    useEffect(() => {
        // Initial resize after mount
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 100);

        // Also trigger resize periodically to catch container size changes
        // (e.g., when side panels open/close)
        const interval = setInterval(() => {
            map.invalidateSize();
        }, 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [map]);

    // Also listen for window resize
    useEffect(() => {
        const handleResize = () => {
            map.invalidateSize();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [map]);

    return null;
}

// Custom zoom control - styled to match the app (replaces Leaflet's default)
function CustomZoomControl() {
    const map = useMap();
    return (
        <div className="absolute top-4 right-4 z-1000 flex flex-col rounded-lg border border-gray-300 bg-gray-100 shadow-md overflow-hidden">
            <button
                type="button"
                onClick={() => map.zoomIn()}
                className="flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors text-lg font-light leading-none"
                aria-label="Zoom in"
            >
                +
            </button>
            <span className="h-px bg-gray-300" aria-hidden />
            <button
                type="button"
                onClick={() => map.zoomOut()}
                className="flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors text-lg font-light leading-none"
                aria-label="Zoom out"
            >
                −
            </button>
        </div>
    );
}

// Component to pan/zoom map to a specific center location
function MapCenter({ center }: { center: { lat: number; lng: number; zoom: number } | null }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            // Pan and zoom to the new location with smooth animation
            map.setView([center.lat, center.lng], center.zoom, {
                animate: true,
                duration: 1,
            });
        }
    }, [center, map]);

    return null;
}

// Component to handle map click events
function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e) => {
            if (onMapClick) {
                onMapClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

interface DynamicMapProps {
    postcodes?: RankedPostcode[];
    hoveredPostcode?: string | null;
    onMarkerClick?: (postcode: RankedPostcode) => void;
    onMarkerHover?: (postcode: string | null) => void;
    mapCenter?: { lat: number; lng: number; zoom: number } | null;
    searchMarker?: { lat: number; lng: number; radiusKm?: number } | null;
    onMapClick?: (lat: number, lng: number) => void;
    onGridCellClick?: (cell: {
        lat: number;
        lng: number;
        size_meters: number;
        results: {
            all: unknown[];
            filtered: unknown[];
            businessCategoryChartPoints: { name: string; value: number }[];
            approvalRateResult: { name: string; approvalRate: number }[];
        };
    }) => void;
    gridCells?: Array<{
        lat: number;
        lng: number;
        size_meters: number;
        results: {
            all: unknown[];
            filtered: unknown[];
            businessCategoryChartPoints: { name: string; value: number }[];
            approvalRateResult: { name: string; approvalRate: number }[];
        };
    }>;
}

export default function DynamicMap({ postcodes = [], hoveredPostcode = null, onMarkerClick, onMarkerHover, mapCenter = null, searchMarker, onMapClick, onGridCellClick, gridCells = [] }: DynamicMapProps) {
    const defaultCenter: [number, number] = [51.5074, -0.1278];
    const validPostcodes = useMemo(
        () => postcodes.filter(pc => pc.lat !== undefined && pc.lng !== undefined),
        [postcodes]
    );

    return (
        <div className="relative w-full h-full">
            <MapContainer
                center={defaultCenter}
                zoom={validPostcodes.length > 0 ? undefined : 12}
                style={{ width: '100%', height: '100%' }}
                className="z-0"
                scrollWheelZoom={true}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapResize />
                <MapCenter center={mapCenter} />
                <MapEvents onMapClick={onMapClick} />
                {validPostcodes.length > 0 && !mapCenter && <MapBounds postcodes={postcodes} />}

                {/* Grid cells for planning data */}
                {gridCells.map((cell, index) => {
                    const count = cell.results.filtered.length;
                    const color = getDensityColor(count);

                    // Calculate cell bounds from center point and size
                    // const halfSize = cell.size_meters / 2;
                    const halfSize = cell.size_meters;

                    // Approximate degrees per meter
                    const latDegPerM = 1 / 111000;
                    const lngDegPerM = 1 / (111000 * Math.cos((cell.lat * Math.PI) / 180));

                    const bounds: [[number, number], [number, number]] = [
                        [cell.lat - (halfSize * latDegPerM), cell.lng - (halfSize * lngDegPerM)],
                        [cell.lat + (halfSize * latDegPerM), cell.lng + (halfSize * lngDegPerM)]
                    ];

                    console.log(`Cell ${index + 1}: Count=${count}, Color=${color}, Bounds=${JSON.stringify(bounds)}`);

                    // Cell 1: Count=56, Color=#FCA5A5, Bounds=[[51.5029414954955,-0.1350021641361522],[51.511950504504505,-0.12052783586384777]]


                    return (
                        <Rectangle
                            key={`cell-${index}`}
                            bounds={bounds}
                            pathOptions={{
                                color: '#4B5563',
                                weight: 1,
                                opacity: 0.5,
                                fillColor: color,
                                fillOpacity: 0.4,
                            }}
                            eventHandlers={{
                                click: (e) => {
                                    DomEvent.stop(e);
                                    if (onGridCellClick) {
                                        onGridCellClick(cell);
                                    }
                                },
                            }}
                        />
                    );
                })}

                {searchMarker && typeof searchMarker.radiusKm === 'number' && searchMarker.radiusKm > 0 && (
                    <Circle
                        center={[searchMarker.lat, searchMarker.lng]}
                        radius={searchMarker.radiusKm * 1000}
                        pathOptions={{
                            color: SEARCH_CIRCLE_COLOR,
                            weight: 2,
                            opacity: 0.6,
                            fillColor: SEARCH_CIRCLE_COLOR,
                            fillOpacity: 0.1,
                        }}
                    />
                )}
                {searchMarker && (
                    <Marker
                        position={[searchMarker.lat, searchMarker.lng]}
                        icon={createSearchMarkerIcon()}
                    >
                        <Popup>
                            <div className="text-center">
                                <div className="font-semibold text-sm">Search Location</div>
                                <div className="text-xs text-gray-600 mt-1">{searchMarker.lat.toFixed(4)}, {searchMarker.lng.toFixed(4)}</div>
                            </div>
                        </Popup>
                    </Marker>
                )}
                <CustomZoomControl />
            </MapContainer>
        </div>
    );
}
