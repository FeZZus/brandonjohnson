'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { RankedPostcode } from '../../api/postcodes/route';
import { geocodePostcodes } from '../../lib/geocode';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>
});

export default function InsightPage() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [expandedDetails, setExpandedDetails] = useState(false);
    const [location, setLocation] = useState('');
    const [radius, setRadius] = useState('');
    const [description, setDescription] = useState('');
    const [rankedPostcodes, setRankedPostcodes] = useState<RankedPostcode[]>([]);
    const [loadingPostcodes, setLoadingPostcodes] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Note: Removed mapKey remounting as it causes container reuse errors
    // The map will automatically adjust to container size changes

    // Fetch ranked postcodes from backend
    useEffect(() => {
        async function fetchRankedPostcodes() {
            setLoadingPostcodes(true);
            setError(null);
            try {
                // Fetch from your backend API endpoint
                // Replace this URL with your actual backend endpoint
                const response = await fetch('/api/postcodes', {
                    method: 'GET',
                });
                const data = await response.json();
                let postcodes: RankedPostcode[] = data.postcodes || [];
                // If backend doesn't provide coordinates, geocode them
                const needsGeocoding = postcodes.filter(pc => !pc.lat || !pc.lng);
                if (needsGeocoding.length > 0) {
                    const geocodeResults = await geocodePostcodes(
                        needsGeocoding.map(pc => pc.postcode)
                    );
                    // Merge geocoded coordinates
                    postcodes = postcodes.map(pc => {
                        const geocoded = geocodeResults.get(pc.postcode);
                        if (geocoded && (!pc.lat || !pc.lng)) {
                            return {
                                ...pc,
                                lat: pc.lat || geocoded.lat,
                                lng: pc.lng || geocoded.lng,
                            };
                        }
                        return pc;
                    });
                }
                setRankedPostcodes(postcodes);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load ranked postcodes');
                console.error('Error fetching ranked postcodes:', err);
            } finally {
                setLoadingPostcodes(false);
            }
        }
        // Uncomment to auto-fetch on mount:
        // fetchRankedPostcodes();
    }, []);

    // Function to manually trigger fetching (can be called from backend webhook or button)
    const handleFetchPostcodes = async () => {
        setLoadingPostcodes(true);
        setError(null);
        try {
            const response = await fetch('/api/postcodes', {
                method: 'GET',
            });
            const data = await response.json();
            let postcodes: RankedPostcode[] = data.postcodes || [];
            const needsGeocoding = postcodes.filter(pc => !pc.lat || !pc.lng);
            if (needsGeocoding.length > 0) {
                const geocodeResults = await geocodePostcodes(
                    needsGeocoding.map(pc => pc.postcode)
                );
                postcodes = postcodes.map(pc => {
                    const geocoded = geocodeResults.get(pc.postcode);
                    if (geocoded && (!pc.lat || !pc.lng)) {
                        return {
                            ...pc,
                            lat: pc.lat || geocoded.lat,
                            lng: pc.lng || geocoded.lng,
                        };
                    }
                    return pc;
                });
            }
            setRankedPostcodes(postcodes);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load ranked postcodes');
            console.error('Error fetching ranked postcodes:', err);
        } finally {
            setLoadingPostcodes(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden relative">
            {/* Floating Location/Radius Search Bar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[500] bg-white rounded-lg shadow-lg p-4 w-full max-w-xl mx-6">
                <div className="flex items-end gap-4">
                    {/* Location Box */}
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Enter location"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Radius Box */}
                    <div className="w-32">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Radius (km)</label>
                        <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(e.target.value)}
                            placeholder="Radius"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Expand Dropdown Button */}
                    <button
                        onClick={() => setExpandedDetails(!expandedDetails)}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors font-medium text-sm flex items-center gap-2 whitespace-nowrap"
                    >
                        {expandedDetails ? '▼' : '▶'}
                    </button>

                    {/* Search Button */}
                    <button
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
                    >
                        Search
                    </button>
                    
                    {/* Refresh Postcodes Button */}
                    <button
                        onClick={handleFetchPostcodes}
                        disabled={loadingPostcodes}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Refresh ranked postcodes"
                    >
                        {loadingPostcodes ? '...' : '🔄'}
                    </button>
                </div>

                {/* Expanded Details Section */}
                {expandedDetails && (
                    <div className="pt-4 border-t border-gray-200">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Enter description"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
            </div>
            {/* Left Panel */}
            <div
                className={`transition-all duration-300 ease-in-out bg-white shadow-lg flex-shrink-0 ${leftPanelOpen ? 'w-80' : 'w-0'
                    } overflow-hidden`}
            >
                <div className="p-6 w-80 h-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Left Panel</h2>
                    <p className="text-gray-600">Content for the left panel goes here.</p>
                </div>
            </div>

            {/* Toggle Left Panel Button */}
            <button
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-[1000] bg-white shadow-lg rounded-r-md p-3 hover:bg-gray-100 transition-all"
                style={{ left: leftPanelOpen ? '320px' : '0px', transition: 'left 0.3s ease-in-out' }}
            >
                <span className="text-lg font-bold">{leftPanelOpen ? '‹' : '›'}</span>
            </button>

            {/* Map Container */}
            <div className="flex-1 relative h-full">
                <DynamicMap postcodes={rankedPostcodes} />
                {/* Loading overlay */}
                {loadingPostcodes && (
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-[600]">
                        <div className="bg-white rounded-lg p-4 shadow-lg">
                            <div className="text-sm text-gray-700">Loading ranked postcodes...</div>
                        </div>
                    </div>
                )}
                {/* Error message */}
                {error && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[600] bg-red-100 border border-red-400 rounded-lg p-3 shadow-lg max-w-md">
                        <div className="text-sm text-red-800">{error}</div>
                    </div>
                )}
                {/* Ranked postcodes indicator */}
                {rankedPostcodes.length > 0 && (
                    <div className="absolute bottom-4 left-4 z-[600] bg-white rounded-lg p-3 shadow-lg max-w-xs">
                        <div className="text-xs font-bold text-gray-800 mb-2">Ranked Postcodes</div>
                        <div className="space-y-1">
                            {rankedPostcodes.map((pc, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{
                                            backgroundColor: pc.rank === 1 ? '#EF4444' : pc.rank === 2 ? '#F59E0B' : pc.rank === 3 ? '#EAB308' : pc.rank === 4 ? '#3B82F6' : '#8B5CF6',
                                        }}
                                    />
                                    <span className="text-gray-700">
                                        #{pc.rank}: {pc.postcode}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Toggle Right Panel Button */}
            <button
                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-[1000] bg-white shadow-lg rounded-l-md p-3 hover:bg-gray-100 transition-all"
                style={{ right: rightPanelOpen ? '320px' : '0px', transition: 'right 0.3s ease-in-out' }}
            >
                <span className="text-lg font-bold">{rightPanelOpen ? '›' : '‹'}</span>
            </button>

            {/* Right Panel */}
            <div
                className={`transition-all duration-300 ease-in-out bg-white shadow-lg flex-shrink-0 ${rightPanelOpen ? 'w-80' : 'w-0'
                    } overflow-hidden`}
            >
                <div className="p-6 w-80 h-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Right Panel</h2>
                    <p className="text-gray-600">Content for the right panel goes here.</p>
                </div>
            </div>
        </div>
    );
}

