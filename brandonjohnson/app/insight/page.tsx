'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { RankedPostcode } from '../api/postcodes/route';
import { geocodePostcodes, geocodeLocation } from '../../lib/geocode';
import GraphModal from './GraphModal';

type CellData = {
    lat: number;
    lng: number;
    size_meters: number;
    results: {
        all: any[];
        filtered: any[];
        businessCategoryChartPoints: { name: string; value: number }[];
        approvalRateResult: { name: string; approvalRate: number }[];
        incomeGraphPoints?: { name: string; value: number }[];
    };
};
type AddressListing = {
    address: string;
    link: string;
};

const exampleAddressListingsByPostcode: Record<string, AddressListing[]> = {
    'WC2H 7DT': [
        {
            address: 'London NW1 8QS',
            link: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGF7z5KM7tiPitaJrg_4szfGHNvTOtiCVUOhwlaGCS6O3TaN7YI3ZmKs3FKkerjdFhCYFM2dnyLmmYw5HhB535rFNu3NeeEm83ty3l7rnxxOh5sZiaKEGIrWKCSWNcKeVW2',
        },
    ],
    'WC2R 0JR': [
        {
            address: 'London NW1 8QS',
            link: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGF7z5KM7tiPitaJrg_4szfGHNvTOtiCVUOhwlaGCS6O3TaN7YI3ZmKs3FKkerjdFhCYFM2dnyLmmYw5HhB535rFNu3NeeEm83ty3l7rnxxOh5sZiaKEGIrWKCSWNcKeVW2',
        },
        {
            address: '137-139 Kentish Town Rd London NW1 8PB',
            link: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHyvv6HOM5bFa_bx3n0jmOwZ81Dtf1HaU8MMVLTZ7wKm6sd9RJa-XsuIyAPY_qs52k-1p9rSeEEGkxJkIVaES0sNOxsphGan847M-zgPigwZxblVcJedVqtZoaDYDvDd46xAMpHI4odYXFqTl3LP1s9oXz5WkH4',
        },
        {
            address: '99-99A Kentish Town Rd London NW1 8PB',
            link: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHyvv6HOM5bFa_bx3n0jmOwZ81Dtf1HaU8MMVLTZ7wKm6sd9RJa-XsuIyAPY_qs52k-1p9rSeEEGkxJkIVaES0sNOxsphGan847M-zgPigwZxblVcJedVqtZoaDYDvDd46xAMpHI4odYXFqTl3LP1s9oXz5WkH4',
        },
    ],
    'SW1A 2EP': [
        {
            address: '137-139 Kentish Town Rd London NW1 8PB',
            link: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHyvv6HOM5bFa_bx3n0jmOwZ81Dtf1HaU8MMVLTZ7wKm6sd9RJa-XsuIyAPY_qs52k-1p9rSeEEGkxJkIVaES0sNOxsphGan847M-zgPigwZxblVcJedVqtZoaDYDvDd46xAMpHI4odYXFqTl3LP1s9oXz5WkH4',
        },
        {
            address: '99-99A Kentish Town Rd London NW1 8PB',
            link: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHyvv6HOM5bFa_bx3n0jmOwZ81Dtf1HaU8MMVLTZ7wKm6sd9RJa-XsuIyAPY_qs52k-1p9rSeEEGkxJkIVaES0sNOxsphGan847M-zgPigwZxblVcJedVqtZoaDYDvDd46xAMpHI4odYXFqTl3LP1s9oXz5WkH4',
        },
    ],
};

const DynamicMap = dynamic(() => import('./DynamicMap'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-gray-400">Loading map...</div>
});

export default function InsightPage() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [expandedDetails, setExpandedDetails] = useState(true);
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
    const [gridCells, setGridCells] = useState<CellData[]>([]);
    const [loadingGrid, setLoadingGrid] = useState(false);
    const [aggregatedBusinessCategories, setAggregatedBusinessCategories] = useState<{ name: string; value: number }[]>([]);
    const [aggregatedApprovalRates, setAggregatedApprovalRates] = useState<{ name: string; approvalRate: number }[]>([]);
    const [selectedGridCell, setSelectedGridCell] = useState<CellData | null>(null);
    const [planningIncomeSeries, setPlanningIncomeSeries] = useState<{ name: string; value: number }[]>([]);
    const [hoveredGridCellKey, setHoveredGridCellKey] = useState<string | null>(null);

    const tileRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const makeCellKey = (lat?: number, lng?: number) => {
        if (lat == null || lng == null) return null;
        return `${lat.toFixed(6)},${lng.toFixed(6)}`;
    };

    useEffect(() => {
        if (!hoveredGridCellKey) return;
        const el = tileRefs.current[hoveredGridCellKey];
        if (el) {
            el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    }, [hoveredGridCellKey]);
    type HeatmapMode = 'recommended' | 'residential' | 'income' | null;
    const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(null);

    // Aggregate planning data from all grid cells
    useEffect(() => {
        if (gridCells.length === 0) {
            setAggregatedBusinessCategories([]);
            setAggregatedApprovalRates([]);
            return;
        }

        // Aggregate business categories
        const categoryMap = new Map<string, number>();
        gridCells.forEach(cell => {
            cell.results.businessCategoryChartPoints.forEach(point => {
                categoryMap.set(point.name, (categoryMap.get(point.name) || 0) + point.value);
            });
        });
        const aggregatedCategories = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Aggregate approval rates (average by year)
        const yearMap = new Map<string, { total: number; count: number }>();
        gridCells.forEach(cell => {
            cell.results.approvalRateResult.forEach(point => {
                const existing = yearMap.get(point.name) || { total: 0, count: 0 };
                yearMap.set(point.name, {
                    total: existing.total + point.approvalRate,
                    count: existing.count + 1
                });
            });
        });
        const aggregatedRates = Array.from(yearMap.entries())
            .map(([name, data]) => ({ name, approvalRate: data.total / data.count }))
            .sort((a, b) => parseInt(a.name) - parseInt(b.name));

        setAggregatedBusinessCategories(aggregatedCategories);
        setAggregatedApprovalRates(aggregatedRates);
    }, [gridCells]);

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

    // Handle location search
    const handleSearch = async () => {
        if (!location.trim()) {
            setError('Please enter a location');
            return;
        }
        if (!description.trim()) {
            setError('Please enter a description (tell me a use case)');
            return;
        }

        // Collapse the details panel when searching
        setExpandedDetails(false);
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

                // Fetch planning data for grid cells
                setLoadingGrid(true);
                try {
                    const planningResponse = await fetch('/api/planning', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lng: result.lng,
                            lat: result.lat,
                            radius: radiusNum,
                            yearsBack: 5
                        })
                    });
                    const planningData = await planningResponse.json();
                    const cells: CellData[] = planningData.cellDataArray || [];
                
                    setGridCells(cells);

                    // Derive hottest postcodes from grid: score by activity + approval, then reverse geocode
                    if (cells.length > 0) {
                        setLoadingPostcodes(true);
                        try {
                            const scored = cells.map((cell) => {
                                const activity = cell.results?.filtered?.length ?? 0;
                                const approvalResult = cell.results?.approvalRateResult ?? [];
                                const avgApproval = approvalResult.length
                                    ? approvalResult.reduce((s: number, p: { approvalRate: number }) => s + p.approvalRate, 0) / approvalResult.length
                                    : 0;
                                const score = activity * 10 + avgApproval;
                                return { cell, score };
                            });
                            scored.sort((a, b) => b.score - a.score);
                            const topN = scored.slice(0, 10);

                            const ranked: RankedPostcode[] = [];
                            for (let i = 0; i < topN.length; i++) {
                                const { cell } = topN[i];
                                const rev = await fetch('/api/geocode/reverse', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ lat: cell.lat, lng: cell.lng }),
                                }).then((r) => r.json());
                                const postcode = rev?.postcode ?? `${cell.lat.toFixed(4)}, ${cell.lng.toFixed(4)}`;
                                ranked.push({
                                    postcode,
                                    rank: i + 1,
                                    lat: cell.lat,
                                    lng: cell.lng,
                                });
                            }
                            setRankedPostcodes(ranked);
                        } catch (err) {
                            console.error('Error resolving hottest postcodes:', err);
                        } finally {
                            setLoadingPostcodes(false);
                        }
                    }
                    setPlanningIncomeSeries(planningData.income || []);
                    setLeftPanelOpen(true);
                    // Hide the radius circle after search (keep the pin)
                    setSearchMarker(prev => prev ? { lat: prev.lat, lng: prev.lng } : null);
                } catch (err) {
                    console.error('Error fetching planning data:', err);
                } finally {
                    setLoadingGrid(false);
                }
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

    // Handle map click - set location from map coordinates
    const handleMapClick = (lat: number, lng: number) => {
        setLocation(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        // Clear existing grid squares and selection
        setGridCells([]);
        setSelectedGridCell(null);
        setModalOpen(false);
        setPlanningIncomeSeries([]);

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
            <style dangerouslySetInnerHTML={{
                __html: `
                .left-panel-scroll {
                    scrollbar-width: thin;
                    scrollbar-color: #6b7280 #e5e7eb;
                }
                .left-panel-scroll::-webkit-scrollbar {
                    width: 10px;
                }
                .left-panel-scroll::-webkit-scrollbar-track {
                    background: #e5e7eb;
                    border-radius: 5px;
                    margin: 4px 0;
                }
                .left-panel-scroll::-webkit-scrollbar-thumb {
                    background: #6b7280;
                    border-radius: 5px;
                    border: 2px solid #e5e7eb;
                }
                .left-panel-scroll::-webkit-scrollbar-thumb:hover {
                    background: #4b5563;
                }
            `}} />
            {/* Floating Search Bar - top left, pushed right when left panel is open */}
            <div
                className={`absolute top-5 z-[500] w-full max-w-xl transition-[left] duration-300 ease-in-out pb-3 font-sans antialiased ${leftPanelOpen ? 'left-[29rem]' : 'left-5'}`}
            >
                <div className="relative bg-gray-100 border border-gray-300 rounded-xl shadow-md p-4">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray mb-1.5 tracking-tight">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="Enter location"
                                className="w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 tracking-tight"
                            />
                        </div>
                        <div className="w-28">
                            <label className="block text-xs font-medium text-gray mb-1.5 tracking-tight">Radius (km)</label>
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
                                className="w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 tracking-tight"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={searchingLocation}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-500 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed tracking-tight"
                        >
                            {searchingLocation ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    <div className={`grid transition-[grid-template-rows] duration-200 ease-out overflow-hidden ${expandedDetails ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                        <div className="min-h-0">
                            {expandedDetails && (
                                <div className="pt-3 border-t border-gray-300 mt-3">
                                    <label className="block text-xs font-medium text-gray mb-1.5 tracking-tight">Tell me about your use case</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={3}
                                        placeholder="I want to open up a bakery..."
                                        className="w-full rounded-lg border border-gray-300 bg-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none tracking-tight leading-relaxed"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Minimal tab bulging out the bottom */}
                <button
                    type="button"
                    onClick={() => setExpandedDetails(!expandedDetails)}
                    className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[15%] w-8 h-6 flex items-center justify-center rounded-full bg-gray-100  text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors"
                >
                    {expandedDetails ? '▲' : '▼'}
                </button>
            </div>

            {/* Bottom-left toggles - only after user has searched */}
            {searchMarker != null && (
                <div
                    className={`absolute bottom-5 z-[500] transition-[left] duration-300 ease-in-out ${leftPanelOpen ? 'left-[29rem]' : 'left-5'}`}
                >
                    <div className="flex flex-col gap-2 bg-gray-100 border border-gray-300 rounded-xl shadow-md p-2">
                        {[
                            { label: 'Recommended', mode: 'recommended' as const },
                            { label: 'Residential', mode: 'residential' as const },
                            { label: 'Income', mode: 'income' as const },
                        ].map(({ label, mode }) => (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => setHeatmapMode(heatmapMode === mode ? null : mode)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                                    heatmapMode === mode
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Left Panel */}
            <div
                className={`transition-all left-panel-scroll duration-300 ease-in-out bg-gray-100 border-r border-gray-300 shadow-sm flex-shrink-0 ${leftPanelOpen ? 'w-[28rem]' : 'w-0'} overflow-hidden`}
            >
                <div className="left-panel-scroll p-5 w-[28rem] h-full flex flex-col overflow-y-auto min-h-0">
                    <h2 className="text-base font-semibold text-gray-800 mb-4 tracking-tight">Recommendations</h2>
                    {rankedPostcodes.length === 0 ? (
                        <p className="text-sm text-gray-400">No postcodes loaded yet.</p>
                    ) : (
                        <div className="space-y-4 flex-1 min-h-0">
                            {rankedPostcodes.map((pc, index) => {
                                const cellKey = makeCellKey(pc.lat, pc.lng);
                                const isHovered = hoveredPostcode === pc.postcode || (cellKey != null && cellKey === hoveredGridCellKey);
                                return (
                                    <div
                                        key={`${pc.postcode}-${index}`}
                                        ref={(el) => {
                                            if (cellKey) {
                                                tileRefs.current[cellKey] = el;
                                            }
                                        }}
                                        onMouseEnter={() => {
                                            setHoveredPostcode(pc.postcode);
                                            setHoveredGridCellKey(cellKey);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredPostcode(null);
                                            setHoveredGridCellKey(null);
                                        }}
                                        className={`border rounded-lg bg-white p-4 shadow-sm cursor-pointer transition-all ${isHovered
                                            ? 'border-gray-700 bg-gray-50 shadow-lg ring-2 ring-gray-400/60'
                                            : 'border-gray-300 hover:border-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {/* Card title row: rank + postcode + coordinates */}
                                        <div
                                            onClick={() => { setSelectedPostcode(pc); setModalOpen(true); }}
                                            className="flex items-center gap-3 mb-2 cursor-pointer"
                                        >
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                                                style={{ backgroundColor: '#6b7280' }}
                                            >
                                                {pc.rank}
                                            </div>
                                            <div className="text-sm font-mono font-semibold text-gray-800 break-all min-w-0 flex-1">
                                                {pc.postcode}
                                            </div>
                                            {pc.lat != null && pc.lng != null && (
                                                <div className="text-xs text-gray-500 ml-auto text-right flex-shrink-0">
                                                    {pc.lat.toFixed(4)}, {pc.lng.toFixed(4)}
                                                </div>
                                            )}
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pc.postcode).replace(/%20/g, '+')}&layer=c`}
                                                target="_blank"
                                                rel="noreferrer noopener"
                                                onClick={(e) => e.stopPropagation()}
                                                className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                                                aria-label="Open in Google Maps Street View"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                                    <circle cx="12" cy="10" r="3" />
                                                </svg>
                                            </a>
                                        </div>

                                        {/* Why invest: 2–3 lines of insight (placeholder for now) */}
                                        <div className="p-3 mb-2">
                                            <p className="text-xs text-gray-700 leading-relaxed">
                                                Strong planning approval rates and rising commercial demand in this area.
                                            </p>
                                            <p className="text-xs text-gray-700 leading-relaxed mt-1">
                                                Above-average income growth and good transport links support long-term value.
                                            </p>
                                            <p className="text-xs text-gray-700 leading-relaxed mt-1">
                                                Placeholder: replace with generated insight per postcode.
                                            </p>
                                        </div>

                                        {/* Inner bottom tile: address listings */}
                                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                            {exampleAddressListingsByPostcode[pc.postcode]?.length ? (
                                                <div className="space-y-2">
                                                    {exampleAddressListingsByPostcode[pc.postcode].map((listing, idx) => (
                                                        <a
                                                            key={`${pc.postcode}-listing-${idx}`}
                                                            href={listing.link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="block text-xs text-gray-700 bg-white border border-gray-200 rounded-md px-2.5 py-2 hover:bg-gray-100 transition-colors"
                                                        >
                                                            {listing.address}
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-gray-400 italic">
                                                    No addresses available.
                                                </div>
                                            )}
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
                style={{ left: leftPanelOpen ? '28rem' : '0px', transition: 'left 0.3s ease-in-out' }}
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
                    gridCells={gridCells}
                    heatmapMode={heatmapMode}
                    hoveredGridCellKey={hoveredGridCellKey}
                    onGridCellHover={(key) => setHoveredGridCellKey(key)}
                    onGridCellClick={(cell) => {
                        setSelectedGridCell(cell);
                        setModalOpen(true);
                    }}
                    onMarkerClick={(postcode) => {
                        setSelectedPostcode(postcode);
                        // Don't open modal for postcode clicks anymore
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
                {loadingGrid && (
                    <div className="absolute inset-0 bg-gray-200/60 flex items-center justify-center z-[600]">
                        <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 shadow-lg">
                            <div className="text-sm text-gray-600">Loading planning data...</div>
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
                    setSelectedGridCell(null);
                }}
                postcode={selectedPostcode}
                gridCell={selectedGridCell}
                planningBusinessCategories={selectedGridCell?.results.businessCategoryChartPoints || aggregatedBusinessCategories}
                planningApprovalRates={selectedGridCell?.results.approvalRateResult || aggregatedApprovalRates}
                incomeSeries={planningIncomeSeries}
            />
        </div>
    );
}