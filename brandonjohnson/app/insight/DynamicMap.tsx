'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RankedPostcode } from '../../api/postcodes/route';

// Uniform marker style - all same color and size, larger for area visualization
const MARKER_COLOR = '#3B82F6'; // Blue color for all markers
const MARKER_HOVER_COLOR = '#EF4444'; // Red color for hovered markers
const MARKER_SIZE = 60; // Larger size for area-type visualization

// Cache for marker icons
const iconCache = new Map<string, Icon>();

// Custom marker icon - large circle for area visualization
function createAreaMarkerIcon(isHovered: boolean = false): Icon {
    const cacheKey = isHovered ? 'hovered' : 'normal';
    
    // Return cached icon if available
    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey)!;
    }
    
    const size = MARKER_SIZE;
    const color = isHovered ? MARKER_HOVER_COLOR : MARKER_COLOR;
    const strokeWidth = isHovered ? 5 : 3; // Thicker stroke when hovered
    const opacity = isHovered ? 0.6 : 0.4; // More opaque when hovered
    
    // Create a large semi-transparent circle to represent an area
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" fill-opacity="${opacity}" stroke="${color}" stroke-width="${strokeWidth}"/>
        <circle cx="${size / 2}" cy="${size / 2}" r="6" fill="${color}" stroke="white" stroke-width="2"/>
    </svg>`;
    // Use URL encoding instead of base64 for better compatibility
    const encodedSvg = encodeURIComponent(svg);
    const icon = new Icon({
        iconUrl: `data:image/svg+xml,${encodedSvg}`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
    });
    
    // Cache the icon
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

interface DynamicMapProps {
    postcodes?: RankedPostcode[];
    hoveredPostcode?: string | null;
    onMarkerClick?: (postcode: RankedPostcode) => void;
}

export default function DynamicMap({ postcodes = [], hoveredPostcode = null, onMarkerClick, onMarkerHover }: DynamicMapProps) {
    const defaultCenter: [number, number] = [51.5074, -0.1278];
    const validPostcodes = useMemo(
        () => postcodes.filter(pc => pc.lat !== undefined && pc.lng !== undefined),
        [postcodes]
    );

    return (
        <MapContainer
            center={defaultCenter}
            zoom={validPostcodes.length > 0 ? undefined : 12}
            style={{ width: '100%', height: '100%' }}
            className="z-0"
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapResize />
            {validPostcodes.length > 0 && <MapBounds postcodes={postcodes} />}
            {validPostcodes.map((pc, index) => {
                const isHovered = hoveredPostcode === pc.postcode;
                return (
                    <Marker
                        key={`${pc.postcode}-${pc.rank}-${index}`}
                        position={[pc.lat!, pc.lng!]}
                        icon={createAreaMarkerIcon(isHovered)}
                        eventHandlers={{
                            click: () => {
                                if (onMarkerClick) {
                                    onMarkerClick(pc);
                                }
                            },
                            mouseover: () => {
                                if (onMarkerHover) {
                                    onMarkerHover(pc.postcode);
                                }
                            },
                            mouseout: () => {
                                if (onMarkerHover) {
                                    onMarkerHover(null);
                                }
                            },
                        }}
                    >
                        <Popup>
                            <div className="text-center">
                                <div className="font-bold text-lg mb-1">Rank #{pc.rank}</div>
                                <div className="text-sm text-gray-600">{pc.postcode}</div>
                                {onMarkerClick && (
                                    <button
                                        onClick={() => onMarkerClick(pc)}
                                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                    >
                                        View Details
                                    </button>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
