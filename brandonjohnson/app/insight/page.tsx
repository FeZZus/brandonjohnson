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
    const [radius, setRadius] = useState('');
    const [description, setDescription] = useState('');
    const [rankedPostcodes, setRankedPostcodes] = useState<RankedPostcode[]>([]);
    const [loadingPostcodes, setLoadingPostcodes] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPostcode, setSelectedPostcode] = useState<RankedPostcode | null>(null);
    const [hoveredPostcode, setHoveredPostcode] = useState<string | null>(null);
    
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
    const [searchingLocation, setSearchingLocation] = useState(false);

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

        setSearchingLocation(true);
        setError(null);
        try {
            const result = await geocodeLocation(location);
            if (result) {
                setMapCenter({
                    lat: result.lat,
                    lng: result.lng,
                    zoom: 13,
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

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
            {/* Floating Search Bar */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[500] bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-full max-w-xl mx-6">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter location"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>
                    <div className="w-28">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Radius (km)</label>
                        <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            placeholder="Radius"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>
                    <button
                        onClick={() => setExpandedDetails(!expandedDetails)}
                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                        {expandedDetails ? '▼' : '▶'}
                    </button>

                    {/* Search Button */}
                    <button
                        onClick={handleSearch}
                        disabled={searchingLocation}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {searchingLocation ? 'Searching...' : 'Search'}
                    </button>

                    {/* Refresh Postcodes Button */}
                    <button
                        onClick={handleFetchPostcodes}
                        disabled={loadingPostcodes}
                        className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh ranked postcodes"
                    >
                        {loadingPostcodes ? '…' : '↻'}
                    </button>
                </div>
                {expandedDetails && (
                    <div className="pt-4 mt-1 border-t border-gray-100">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Enter description"
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200"
                        />
                    </div>
                )}
            </div>

            {/* Left Panel */}
            <div
                className={`transition-all duration-300 ease-in-out bg-white border-r border-gray-200 shadow-sm flex-shrink-0 ${leftPanelOpen ? 'w-80' : 'w-0'} overflow-hidden`}
            >
                <div className="p-5 w-80 h-full flex flex-col overflow-y-auto">
                    <h2 className="text-base font-semibold text-gray-900 mb-4 tracking-tight">Ranked Postcodes</h2>
                    {rankedPostcodes.length === 0 ? (
                        <p className="text-sm text-gray-400">No postcodes loaded yet.</p>
                    ) : (
                        <div className="space-y-2 flex-1">
                            {rankedPostcodes.map((pc, index) => {
                                const isHovered = hoveredPostcode === pc.postcode;
                                return (
                                    <div
                                        key={`${pc.postcode}-${index}`}
                                        onClick={() => { setSelectedPostcode(pc); setModalOpen(true); }}
                                        onMouseEnter={() => setHoveredPostcode(pc.postcode)}
                                        onMouseLeave={() => setHoveredPostcode(null)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                            isHovered
                                                ? 'border-gray-400 bg-gray-50 shadow-sm'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                                                style={{ backgroundColor: '#6b7280' }}
                                            >
                                                {pc.rank}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-400 mb-0.5">Rank #{pc.rank}</div>
                                                <div className="text-sm font-mono font-semibold text-gray-800 break-all">{pc.postcode}</div>
                                                {pc.lat && pc.lng && (
                                                    <div className="text-xs text-gray-400 mt-0.5">{pc.lat.toFixed(4)}, {pc.lng.toFixed(4)}</div>
                                                )}
                                            </div>
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
                className="absolute top-1/2 -translate-y-1/2 z-[1000] bg-white border border-gray-200 shadow-md rounded-r-lg p-2.5 hover:bg-gray-50 transition-all"
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
                    onMarkerClick={(postcode) => {
                        setSelectedPostcode(postcode);
                        setModalOpen(true);
                    }}
                    onMarkerHover={(postcode) => {
                        setHoveredPostcode(postcode);
                    }}
                />
                {loadingPostcodes && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[600]">
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg">
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