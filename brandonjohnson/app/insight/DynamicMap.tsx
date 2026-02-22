'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import { Icon, DomEvent } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RankedPostcode } from '../api/postcodes/route';

const SEARCH_MARKER_COLOR = '#EF4444'; // Red color for search result marker
const SEARCH_CIRCLE_COLOR = '#6366F1'; // Indigo color for search radius circle
const SEARCH_MARKER_SIZE = 40; // Smaller size for search marker

// Normalized value 0–1 → heat color (gray → green → yellow → orange → red); green only for lowest values
function getNormalizedHeatColor(t: number): string {
    if (t <= 0 || isNaN(t)) return '#E5E7EB';
    if (t <= 0.1) return '#86EFAC';
    if (t <= 0.35) return '#FDE047';
    if (t <= 0.6) return '#FDBA74';
    return '#FCA5A5';
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
            incomeGraphPoints?: { name: string; value: number }[];
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
            incomeGraphPoints?: { name: string; value: number }[];
        };
    }>;
    heatmapMode?: 'recommended' | 'residential' | 'income' | null;
}

export default function DynamicMap({ postcodes = [], hoveredPostcode = null, onMarkerClick, onMarkerHover, mapCenter = null, searchMarker, onMapClick, onGridCellClick, gridCells = [], heatmapMode = null }: DynamicMapProps) {
    const defaultCenter: [number, number] = [51.5074, -0.1278];
    const validPostcodes = useMemo(
        () => postcodes.filter(pc => pc.lat !== undefined && pc.lng !== undefined),
        [postcodes]
    );

    // Compute per-cell values, normalise by min/max, then map to heat colour
    const { cellColors } = useMemo(() => {
        const mode = heatmapMode ?? 'residential';
        const values: number[] = [];

        if (mode === 'residential') {
            gridCells.forEach((cell) => values.push(cell.results.filtered.length));
        } else if (mode === 'recommended') {
            gridCells.forEach((cell) => {
                const activity = cell.results.filtered.length;
                const arr = cell.results.approvalRateResult ?? [];
                const avgApproval = arr.length
                    ? arr.reduce((s: number, p: { approvalRate: number }) => s + p.approvalRate, 0) / arr.length
                    : 0;
                values.push(activity * 10 + avgApproval);
            });
        } else if (mode === 'income') {
            gridCells.forEach((cell) => {
                const points = cell.results.incomeGraphPoints ?? [];
                const latest = points.length
                    ? points.slice().sort((a, b) => parseInt(b.name, 10) - parseInt(a.name, 10))[0]?.value ?? 0
                    : 0;
                values.push(latest);
            });
        }

        const min = values.length ? Math.min(...values) : 0;
        const max = values.length ? Math.max(...values) : 1;
        const range = max - min || 1;

        const colors = gridCells.map((_, i) => {
            const t = range > 0 ? (values[i] - min) / range : 0;
            return getNormalizedHeatColor(t);
        });

        return { cellColors: colors };
    }, [gridCells, heatmapMode]);

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
                    const color = cellColors[index] ?? '#E5E7EB';
                    const halfSize = cell.size_meters / 2;
                    const latDegPerM = 1 / 111000;
                    const lngDegPerM = 1 / (111000 * Math.cos((cell.lat * Math.PI) / 180));
                    const bounds: [[number, number], [number, number]] = [
                        [cell.lat - (halfSize * latDegPerM), cell.lng - (halfSize * lngDegPerM)],
                        [cell.lat + (halfSize * latDegPerM), cell.lng + (halfSize * lngDegPerM)]
                    ];

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
                                mouseover: (e) => {
                                    e.target.setStyle({
                                        color: '#4B5563',
                                        weight: 2,
                                        opacity: 0.9,
                                        fillOpacity: 0.6,
                                    });
                                },
                                mouseout: (e) => {
                                    e.target.setStyle({
                                        color: '#4B5563',
                                        weight: 1,
                                        opacity: 0.5,
                                        fillOpacity: 0.4,
                                    });
                                },
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
