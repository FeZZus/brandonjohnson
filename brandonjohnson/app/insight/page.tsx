'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full">Loading map...</div>
});

export default function InsightPage() {
    const [leftPanelOpen, setLeftPanelOpen] = useState(true);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [expandedDetails, setExpandedDetails] = useState(false);
    const [mapKey, setMapKey] = useState(0);
    const [location, setLocation] = useState('');
    const [radius, setRadius] = useState('');
    const [description, setDescription] = useState('');

    // Force map to re-render when panels change
    useEffect(() => {
        const timer = setTimeout(() => {
            setMapKey(prev => prev + 1);
        }, 300); // Match the transition duration
        return () => clearTimeout(timer);
    }, [leftPanelOpen, rightPanelOpen]);

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
                <DynamicMap key={mapKey} />
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

