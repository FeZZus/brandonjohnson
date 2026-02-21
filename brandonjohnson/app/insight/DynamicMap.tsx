'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RankedPostcode } from '../../api/postcodes/route';

// Rank colors: brighter/more prominent for higher ranks
const RANK_COLORS: Record<number, string> = {
    1: '#EF4444', // Red - highest rank
    2: '#F59E0B', // Orange
    3: '#EAB308', // Yellow
    4: '#3B82F6', // Blue
    5: '#8B5CF6', // Purple - lowest rank
};

const RANK_SIZES: Record<number, number> = {
    1: 32, // Largest
    2: 28,
    3: 24,
    4: 20,
    5: 16, // Smallest
};

// Cache for marker icons to prevent recreation
const iconCache = new Map<number, Icon>();

// Custom marker icon with rank number
function createRankedMarkerIcon(rank: number): Icon {
    // Return cached icon if available
    if (iconCache.has(rank)) {
        return iconCache.get(rank)!;
    }
    
    const color = RANK_COLORS[rank] || '#6B7280';
    const size = RANK_SIZES[rank] || 20;
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${size / 2}" y="${size / 2}" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${rank}</text>
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
    iconCache.set(rank, icon);
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
}

export default function DynamicMap({ postcodes = [] }: DynamicMapProps) {
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
            {validPostcodes.map((pc, index) => (
                <Marker
                    key={`${pc.postcode}-${pc.rank}-${index}`}
                    position={[pc.lat!, pc.lng!]}
                    icon={createRankedMarkerIcon(pc.rank)}
                >
                    <Popup>
                        <div className="text-center">
                            <div className="font-bold text-lg mb-1">Rank #{pc.rank}</div>
                            <div className="text-sm text-gray-600">{pc.postcode}</div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
