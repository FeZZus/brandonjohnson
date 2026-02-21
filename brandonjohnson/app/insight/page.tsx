'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { RankedPostcode } from '../api/postcodes/route';
import { geocodePostcodes, geocodeLocation } from '../../lib/geocode';
import GraphModal from './GraphModal';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading map...</div>
});

export default function InsightPage() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [expandedDetails, setExpandedDetails] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [location, setLocation] = useState('');
    const [radius, setRadius] = useState('5');
    const [description, setDescription] = useState('');
    const [rankedPostcodes, setRankedPostcodes] = useState<RankedPostcode[]>([]);
    const [loadingPostcodes, setLoadingPostcodes] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPostcode, setSelectedPostcode] = useState<RankedPostcode | null>(null);
    const [hoveredPostcode, setHoveredPostcode] = useState<string | null>(null);
    
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
    const [searchingLocation, setSearchingLocation] = useState(false);
    const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; radiusKm?: number } | null>(null);
    
    // Update circle when radius changes
    useEffect(() => {
        if (searchMarker && radius) {
            const radiusNum = parseFloat(radius);
            if (!isNaN(radiusNum) && radiusNum >= 0 && radiusNum <= 5) {
                setSearchMarker({
                    ...searchMarker,
                    radiusKm: radiusNum,
                });
            }
        }
    }, [radius]);

    useEffect(() => {
        async function fetchRankedPostcodes() {
            setLoadingPostcodes(true);
            setError(null);
            try {
                const response = await fetch('/api/postcodes', { method: 'GET' });
                const data = await response.json();
                let postcodes: RankedPostcode[] = data.postcodes || [];
                const needsGeocoding = postcodes.filter(pc => !pc.lat || !pc.lng);
                if (needsGeocoding.length > 0) {
                    const geocodeResults = await geocodePostcodes(needsGeocoding.map(pc => pc.postcode));
                    postcodes = postcodes.map(pc => {
                        const geocoded = geocodeResults.get(pc.postcode);
                        if (geocoded && (!pc.lat || !pc.lng)) {
                            return { ...pc, lat: pc.lat || geocoded.lat, lng: pc.lng || geocoded.lng };
                        }
                        return pc;
                    });
                }
                setRankedPostcodes(postcodes);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load ranked postcodes');
            } finally {
                setLoadingPostcodes(false);
            }
        }
        // fetchRankedPostcodes();
    }, []);

    const handleFetchPostcodes = async () => {
        setLoadingPostcodes(true);
        setError(null);
        try {
            const response = await fetch('/api/postcodes', { method: 'GET' });
            const data = await response.json();
            let postcodes: RankedPostcode[] = data.postcodes || [];
            const needsGeocoding = postcodes.filter(pc => !pc.lat || !pc.lng);
            if (needsGeocoding.length > 0) {
                const geocodeResults = await geocodePostcodes(needsGeocoding.map(pc => pc.postcode));
                postcodes = postcodes.map(pc => {
                    const geocoded = geocodeResults.get(pc.postcode);
                    if (geocoded && (!pc.lat || !pc.lng)) {
                        return { ...pc, lat: pc.lat || geocoded.lat, lng: pc.lng || geocoded.lng };
                    }
                    return pc;
                });
            }
            setRankedPostcodes(postcodes);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load ranked postcodes');
        } finally {
            setLoadingPostcodes(false);
        }
    };

    // Handle location search
    const handleSearch = async () => {
        if (!location.trim()) {
            setError('Please enter a location');
            return;
        }
        const radiusNum = parseFloat(radius);
        if (!radius || isNaN(radiusNum) || radiusNum < 0 || radiusNum > 5) {
            setError('Radius must be between 0 and 5 km');
            return;
        }

        setSearchingLocation(true);
        setError(null);
        try {
            const result = await geocodeLocation(location);
            if (result) {
                // Calculate zoom level based on radius to show the whole circle taking up ~80% of screen
                // If no radius, default to zoom 13
                let zoomLevel = 13;
                if (radius && parseFloat(radius) > 0) {
                    const radiusKm = parseFloat(radius);
                    // Simple formula: higher radius = lower zoom level (zoom out more)
                    // Adjust the divisor to get 80% coverage
                    if (radiusKm <= 1) zoomLevel = 15;
                    else if (radiusKm <= 2) zoomLevel = 14;
                    else if (radiusKm <= 5) zoomLevel = 13;
                    else if (radiusKm <= 10) zoomLevel = 12;
                    else if (radiusKm <= 20) zoomLevel = 11;
                    else if (radiusKm <= 50) zoomLevel = 10;
                    else if (radiusKm <= 100) zoomLevel = 9;
                    else if (radiusKm <= 200) zoomLevel = 8;
                    else zoomLevel = 7;
                }
                
                setMapCenter({
                    lat: result.lat,
                    lng: result.lng,
                    zoom: zoomLevel,
                });
                setSearchMarker({
                    lat: result.lat,
                    lng: result.lng,
                    radiusKm: radius ? parseFloat(radius) : undefined,
                });
                setError(null);
            } else {
                setError(`Location not found: ${location}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search location');
            console.error('Error searching location:', err);
        } finally {
            setSearchingLocation(false);
        }
    };

    // Handle map click
    const handleMapClick = async (lat: number, lng: number) => {
        // Set location as coordinates
        setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        // Set marker and circle with default radius
        const radiusKm = parseFloat(radius);
        setSearchMarker({
            lat,
            lng,
            radiusKm: !isNaN(radiusKm) ? radiusKm : 5,
        });
        
        // Center map on clicked location
        setMapCenter({
            lat,
            lng,
            zoom: 13,
        });
    };

    return (
        <div className="flex h-screen w-full bg-gray-200 overflow-hidden relative">
            {/* Floating Search Bar */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[500] bg-gray-100 border border-gray-300 rounded-xl shadow-md p-4 w-full max-w-xl mx-6">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter location"
                            className="w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                    </div>
                    <div className="w-28">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Radius (km)</label>
                        <input
                            type="number"
                            value={radius}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (e.target.value === '' || (!isNaN(val) && val >= 0 && val <= 5)) {
                                    setRadius(e.target.value);
                                }
                            }}
                            onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                    if (val > 5) setRadius('5');
                                    if (val < 0) setRadius('0');
                                }
                            }}
                            placeholder="Radius"
                            min="0"
                            max="5"
                            step="0.1"
                            className="w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                    </div>
                    <button
                        onClick={() => setExpandedDetails(!expandedDetails)}
                        className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-300 transition-colors text-sm font-medium"
                    >
                        {expandedDetails ? '▼' : '▶'}
                    </button>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={searchingLocation}
                        className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {searchingLocation ? 'Searching...' : 'Search'}
                    </button>

                    {/* Refresh Postcodes Button */}
                    <button
                        onClick={handleFetchPostcodes}
                        disabled={loadingPostcodes}
                        className="bg-gray-200 text-gray-600 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh ranked postcodes"
                    >
                        {loadingPostcodes ? '…' : '↻'}
                    </button>
                </div>
                {expandedDetails && (
                    <div className="pt-4 mt-1 border-t border-gray-300">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Enter description"
                            className="w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                    </div>
                )}
            </div>

            {/* Left Panel */}
            <div
                className={`transition-all duration-300 ease-in-out bg-gray-100 border-r border-gray-300 shadow-sm flex-shrink-0 ${leftPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}
            >
                <div className="p-5 w-80 h-full flex flex-col overflow-y-auto">
                    <h2 className="text-base font-semibold text-gray-800 mb-4 tracking-tight">Ranked Postcodes</h2>
                    {rankedPostcodes.length === 0 ? (
                        <p className="text-sm text-gray-400">No postcodes loaded yet.</p>
                    ) : (
                        <div className="space-y-4 flex-1">
                            {rankedPostcodes.map((pc, index) => {
                                const isHovered = hoveredPostcode === pc.postcode;
                                return (
                                    <div key={`${pc.postcode}-${index}`} className="border border-gray-300 rounded-lg bg-white p-4 shadow-sm">
                                        {/* Rank badge on outer box */}
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 mb-3"
                                            style={{ backgroundColor: '#6b7280' }}
                                        >
                                            {pc.rank}
                                        </div>
                                        
                                        {/* Top tile - Postcode info */}
                                        <div
                                            onClick={() => { setSelectedPostcode(pc); setModalOpen(true); }}
                                            onMouseEnter={() => setHoveredPostcode(pc.postcode)}
                                            onMouseLeave={() => setHoveredPostcode(null)}
                                            className={`p-3 border rounded-lg cursor-pointer transition-all mb-2 ${
                                                isHovered
                                                    ? 'border-gray-500 bg-gray-200 shadow-sm'
                                                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-200'
                                            }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-mono font-semibold text-gray-800 break-all">{pc.postcode}</div>
                                                {pc.lat && pc.lng && (
                                                    <div className="text-xs text-gray-400 mt-1">{pc.lat.toFixed(4)}, {pc.lng.toFixed(4)}</div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Bottom tile - Empty for now */}
                                        <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all min-h-20">
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Toggle Button */}
            <button
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="absolute top-1/2 -translate-y-1/2 z-[1000] bg-gray-100 border border-gray-300 shadow-md rounded-r-lg p-2.5 hover:bg-gray-200 transition-all"
                style={{ left: leftPanelOpen ? '320px' : '0px', transition: 'left 0.3s ease-in-out' }}
            >
                <span className="text-base font-bold text-gray-500">{leftPanelOpen ? '‹' : '›'}</span>
            </button>

            {/* Map Container */}
            <div className="flex-1 relative h-full">

                <DynamicMap
                    postcodes={rankedPostcodes}
                    hoveredPostcode={hoveredPostcode}
                    mapCenter={mapCenter}
                    searchMarker={searchMarker}
                    onMapClick={handleMapClick}
                    onMarkerClick={(postcode) => {
                        setSelectedPostcode(postcode);
                        setModalOpen(true);
                    }}
                    onMarkerHover={(postcode) => {
                        setHoveredPostcode(postcode);
                    }}
                />
                {loadingPostcodes && (
                    <div className="absolute inset-0 bg-gray-200/60 flex items-center justify-center z-[600]">
                        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 shadow-lg">
                            <div className="text-sm text-gray-600">Loading ranked postcodes...</div>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[600] bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg max-w-md">
                        <div className="text-sm text-red-700">{error}</div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <GraphModal
                isOpen={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setSelectedPostcode(null);
                }}
                postcode={selectedPostcode}
            />
        </div>
    );
}